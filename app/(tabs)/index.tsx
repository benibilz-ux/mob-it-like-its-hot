import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp, onSnapshot, query, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { T, Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

const DAYS = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

function dateLabel() {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`.toUpperCase();
}

function istFaellig(datum?: string): boolean {
  if (!datum) return true;
  const parts = datum.split('.');
  if (parts.length !== 3) return true;
  const taskDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  return taskDate <= heute;
}

const NAV = [
  { label: 'Food',      route: '/einkaufsliste', icon: 'food'     },
  { label: 'Aufgaben',  route: '/aufgaben',      icon: 'aufgaben' },
  { label: 'Roulette',  route: '/roulette',      icon: 'roulette' },
  { label: 'Kalender',  route: '/kalender',      icon: 'kalender' },
];

function NavIcon({ type }: { type: string }) {
  return (
    <View style={styles.navIconCircle}>
      {type === 'aufgaben' && (
        <View style={{ width: 10, height: 6, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: T.accent, transform: [{ rotate: '-45deg' }, { translateY: -1 }] }} />
      )}
      {type === 'food' && (
        <View style={{ width: 10, height: 10, borderWidth: 1.5, borderColor: T.accent, borderTopWidth: 0, borderRadius: 2 }} />
      )}
      {type === 'roulette' && (
        <View style={{ width: 12, height: 12, borderRadius: 6, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: 0, left: 0, width: 6, height: 6, backgroundColor: T.accent }} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 6, height: 6, backgroundColor: T.accent }} />
        </View>
      )}
      {type === 'kalender' && (
        <View style={{ gap: 2 }}>
          <View style={{ width: 12, height: 1.5, backgroundColor: T.accent }} />
          <View style={{ width: 12, height: 1.5, backgroundColor: T.accent }} />
          <View style={{ width: 8, height: 1.5, backgroundColor: T.accent }} />
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [dankbarText, setDankbarText] = useState('');
  const [editingDankbar, setEditingDankbar] = useState(false);
  const dankbarRef = useRef<TextInput>(null);
  const dankbarDocRef = doc(db, 'einstellungen', 'dankbarkeit');
  const [totalOffen, setTotalOffen] = useState(0);
  const [benniOffen, setBenniOffen] = useState(0);
  const [leniOffen, setLeniOffen] = useState(0);

  const [quickModal, setQuickModal] = useState<'essen' | 'einkauf' | null>(null);
  const [quickModalInput, setQuickModalInput] = useState('');
  const modalInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const q = query(collection(db, 'aufgaben'));
    return onSnapshot(q, snap => {
      const alle = snap.docs.map(d => d.data());
      const offen = alle.filter(a => !a.done && istFaellig(a.datum));
      setTotalOffen(offen.length);
      setBenniOffen(offen.filter(a => a.person === 'Benni').length);
      setLeniOffen(offen.filter(a => a.person === 'Leni').length);
    });
  }, []);

  useEffect(() => {
    return onSnapshot(dankbarDocRef, snap => {
      if (snap.exists()) setDankbarText(snap.data().text ?? '');
    });
  }, []);

  async function saveDankbar() {
    setEditingDankbar(false);
    await setDoc(dankbarDocRef, { text: dankbarText });
  }

  function openQuickModal(type: 'essen' | 'einkauf') {
    setQuickModal(type);
    setQuickModalInput('');
    setTimeout(() => modalInputRef.current?.focus(), 100);
  }

  function closeQuickModal() {
    setQuickModal(null);
    setQuickModalInput('');
  }

  async function addQuick() {
    if (!quickModalInput.trim() || !quickModal) return;
    const coll = quickModal === 'essen' ? 'essensliste' : 'einkaufsliste';
    await addDoc(collection(db, coll), { name: quickModalInput.trim(), done: false, createdAt: serverTimestamp() });
    setQuickModalInput('');
    closeQuickModal();
  }

  const total = benniOffen + leniOffen;
  const benniRatio = total > 0 ? benniOffen / total : 0.5;

  const modalTitle = quickModal === 'essen' ? 'Essensliste' : 'Einkaufsliste';
  const modalPlaceholder = quickModal === 'essen' ? 'Was kochen wir?' : 'Was kaufen wir ein?';

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingText}>{greeting()}</Text>
          <Text style={styles.dateText}>{dateLabel()}</Text>
        </View>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Heute offen</Text>
            <Text style={styles.summaryCount}>{totalOffen}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressSegment, { flex: benniRatio, backgroundColor: T.accent }]} />
            <View style={[styles.progressSegment, { flex: 1 - benniRatio, backgroundColor: T.accentSoft }]} />
          </View>
          <View style={styles.summaryFooter}>
            <Text style={styles.summaryPerson}>Benni · {benniOffen}</Text>
            <Text style={styles.summaryPerson}>Leni · {leniOffen}</Text>
          </View>
        </View>

        {/* Dankbarkeits-Kachel */}
        <View style={styles.quoteCard}>
          <View style={styles.quoteHeader}>
            <Text style={styles.quoteTitle}>DANKBARKEIT</Text>
            <TouchableOpacity
              style={styles.quoteEditBtn}
              onPress={() => {
                setEditingDankbar(true);
                setTimeout(() => dankbarRef.current?.focus(), 50);
              }}
              activeOpacity={0.7}
            >
              <IconSymbol name="pencil" size={16} color={T.accent} />
            </TouchableOpacity>
          </View>

          {editingDankbar ? (
            <TextInput
              ref={dankbarRef}
              style={styles.quoteInput}
              value={dankbarText}
              onChangeText={setDankbarText}
              onBlur={saveDankbar}
              multiline
              placeholder="Dafür sind wir diese Woche besonders dankbar…"
              placeholderTextColor={T.muted}
              returnKeyType="done"
              blurOnSubmit
            />
          ) : (
            <Text style={dankbarText ? styles.quoteText : styles.quotePlaceholder}>
              {dankbarText || 'Dafür sind wir diese Woche besonders dankbar…'}
            </Text>
          )}
        </View>

        {/* Nav list */}
        <View style={styles.navList}>
          {NAV.map((item, i) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.navRow, i < NAV.length - 1 && styles.navRowBorder]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <NavIcon type={item.icon} />
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Quick input — tappable pills that open modal */}
      <View style={styles.quickInput}>
        <TouchableOpacity style={styles.quickPill} onPress={() => openQuickModal('essen')} activeOpacity={0.7}>
          <Text style={styles.quickPillText}>Was kochen wir?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickPill} onPress={() => openQuickModal('einkauf')} activeOpacity={0.7}>
          <Text style={styles.quickPillText}>Was kaufen wir ein?</Text>
        </TouchableOpacity>
      </View>

      {/* Quick-add modal */}
      <Modal visible={quickModal !== null} transparent animationType="slide" onRequestClose={closeQuickModal}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.modalBackdrop} onPress={closeQuickModal} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <View style={styles.modalInputRow}>
              <TextInput
                ref={modalInputRef}
                style={styles.modalInput}
                placeholder={modalPlaceholder}
                placeholderTextColor={T.muted}
                value={quickModalInput}
                onChangeText={setQuickModalInput}
                onSubmitEditing={addQuick}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.modalAddBtn} onPress={addQuick} activeOpacity={0.8}>
                <Text style={styles.modalAddBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 72, gap: 24 },

  greetingBlock: { gap: 4 },
  greetingText: { fontFamily: Fonts?.serif, fontStyle: 'italic', fontSize: 30, color: T.ink },
  dateText: { fontSize: 12, color: T.muted, letterSpacing: 0.8 },

  summaryCard: {
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: T.hairline,
    paddingVertical: 16, gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  summaryLabel: { fontSize: 15, color: T.muted },
  summaryCount: { fontSize: 26, fontWeight: '600', color: T.accent },
  progressBar: { flexDirection: 'row', height: 3, borderRadius: 9999, overflow: 'hidden', gap: 2 },
  progressSegment: { borderRadius: 9999 },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryPerson: { fontSize: 13, color: T.muted },

  quoteCard: { backgroundColor: T.accentSoft, borderRadius: 20, padding: 20, paddingTop: 14, gap: 8 },
  quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteTitle: { fontSize: 11, fontWeight: '700', color: T.accent, letterSpacing: 1.2 },
  quoteEditBtn: { padding: 4 },
  quoteText: { fontFamily: Fonts?.serif, fontStyle: 'italic', fontSize: 16, color: T.ink, lineHeight: 24 },
  quotePlaceholder: { fontFamily: Fonts?.serif, fontStyle: 'italic', fontSize: 16, color: T.muted, lineHeight: 24 },
  quoteInput: { fontFamily: Fonts?.serif, fontStyle: 'italic', fontSize: 16, color: T.ink, lineHeight: 24, minHeight: 60, textAlignVertical: 'top' },

  navList: { gap: 0 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
  navRowBorder: { borderBottomWidth: 1, borderBottomColor: T.hairline },
  navIconCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  navLabel: { flex: 1, fontSize: 17, color: T.ink },

  quickInput: {
    backgroundColor: T.surface, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28,
    gap: 10, borderTopWidth: 1, borderTopColor: T.hairline,
  },
  quickPill: {
    backgroundColor: T.bg, borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 14,
    borderWidth: 1, borderColor: T.hairline,
  },
  quickPillText: { fontSize: 15, color: T.muted },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: {
    backgroundColor: T.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40,
    gap: 16,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.hairline, alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 13, fontWeight: '600', color: T.muted, letterSpacing: 0.6 },
  modalInputRow: { flexDirection: 'row', gap: 10 },
  modalInput: {
    flex: 1, backgroundColor: T.bg, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 15,
    borderWidth: 1, borderColor: T.hairline, color: T.ink,
  },
  modalAddBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  modalAddBtnText: { color: T.surface, fontSize: 26, fontWeight: 'bold' },
});
