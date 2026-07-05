import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { T, Fonts } from '@/constants/theme';

const STANDARD_AUFGABEN = ['Staubsaugen', 'Abwasch', 'Müll rausbringen', 'Bad putzen', 'Einkaufen'];
const PERSONEN = ['Benni', 'Leni'];
const WHEEL_SIZE = 200;

type Zuweisung = { aufgabe: string; person: string };

function RouletteWheel({ spinning }: { spinning: boolean }) {
  return (
    <View style={styles.wheelWrapper}>
      <View style={styles.pointer} />
      <View style={[styles.wheel, spinning && styles.wheelSpinning]}>
        <View style={[styles.quadrant, { top: 0, left: 0, backgroundColor: T.accent }]} />
        <View style={[styles.quadrant, { top: 0, right: 0, backgroundColor: T.surface }]} />
        <View style={[styles.quadrant, { bottom: 0, left: 0, backgroundColor: T.surface }]} />
        <View style={[styles.quadrant, { bottom: 0, right: 0, backgroundColor: T.accent }]} />
        <View style={styles.dividerH} />
        <View style={styles.dividerV} />
        <View style={styles.hub} />
      </View>
    </View>
  );
}

export default function Roulette() {
  const [aufgaben, setAufgaben] = useState<string[]>(STANDARD_AUFGABEN);
  const [zugelost, setZugelost] = useState<Zuweisung[]>([]);
  const [neueAufgabe, setNeueAufgabe] = useState('');
  const [spinning, setSpinning] = useState(false);

  function drehen() {
    if (aufgaben.length === 0) return;
    setSpinning(true);
    setTimeout(() => {
      const idx = Math.floor(Math.random() * aufgaben.length);
      const aufgabe = aufgaben[idx];
      const person = PERSONEN[Math.floor(Math.random() * PERSONEN.length)];
      setAufgaben(prev => prev.filter((_, i) => i !== idx));
      setZugelost(prev => [{ aufgabe, person }, ...prev]);
      setSpinning(false);
    }, 1500);
  }

  function removeZuweisung(index: number) {
    const z = zugelost[index];
    setZugelost(prev => prev.filter((_, i) => i !== index));
    setAufgaben(prev => [...prev, z.aufgabe]);
  }

  function addAufgabe() {
    if (!neueAufgabe.trim()) return;
    setAufgaben(prev => [...prev, neueAufgabe.trim()]);
    setNeueAufgabe('');
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.header}>POWERHOUR-Roulette</Text>
      <Text style={styles.subheader}>Wer macht was?</Text>

      <RouletteWheel spinning={spinning} />

      <TouchableOpacity
        style={[styles.drehenBtn, (spinning || aufgaben.length === 0) && styles.drehenBtnDisabled]}
        onPress={drehen}
        disabled={spinning || aufgaben.length === 0}
        activeOpacity={0.8}
      >
        <Text style={styles.drehenBtnText}>{spinning ? 'Dreht…' : 'Drehen'}</Text>
      </TouchableOpacity>

      {/* Aufgaben im Topf */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aufgaben im Topf</Text>
        {aufgaben.length === 0 && (
          <Text style={styles.emptyHint}>Alle Aufgaben wurden zugelost.</Text>
        )}
        {aufgaben.map((a, i) => (
          <View key={i} style={[styles.poolRow, i < aufgaben.length - 1 && styles.rowBorder]}>
            <Text style={styles.poolItem}>{a}</Text>
            <TouchableOpacity onPress={() => setAufgaben(aufgaben.filter((_, j) => j !== i))}>
              <View style={styles.removeBtn}><Text style={styles.removeBtnText}>×</Text></View>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Neue Aufgabe…"
            placeholderTextColor={T.muted}
            value={neueAufgabe}
            onChangeText={setNeueAufgabe}
            onSubmitEditing={addAufgabe}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addAufgabe} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Zugelost */}
      {zugelost.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zugelost</Text>
          {zugelost.map((z, i) => (
            <View key={i} style={[styles.poolRow, i < zugelost.length - 1 && styles.rowBorder]}>
              <Text style={styles.poolItem}>{z.aufgabe}</Text>
              <TouchableOpacity onPress={() => removeZuweisung(i)} activeOpacity={0.7}>
                <View style={styles.personChip}>
                  <Text style={styles.personChipText}>{z.person[0]}</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: T.bg },
  content: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
  header: { fontFamily: Fonts?.serif, fontStyle: 'italic', fontSize: 28, color: T.ink },
  subheader: { fontSize: 14, color: T.muted, marginTop: -12 },

  wheelWrapper: { alignItems: 'center' },
  pointer: {
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 14,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: T.accent,
    zIndex: 1,
  },
  wheel: {
    width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: WHEEL_SIZE / 2,
    overflow: 'hidden', borderWidth: 2, borderColor: T.accent,
  },
  wheelSpinning: { opacity: 0.7 },
  quadrant: { position: 'absolute', width: WHEEL_SIZE / 2, height: WHEEL_SIZE / 2 },
  dividerH: { position: 'absolute', top: WHEEL_SIZE / 2 - 1, left: 0, right: 0, height: 2, backgroundColor: T.accent },
  dividerV: { position: 'absolute', left: WHEEL_SIZE / 2 - 1, top: 0, bottom: 0, width: 2, backgroundColor: T.accent },
  hub: {
    position: 'absolute',
    top: WHEEL_SIZE / 2 - 14, left: WHEEL_SIZE / 2 - 14,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: T.surface, borderWidth: 2, borderColor: T.accent,
  },

  drehenBtn: { backgroundColor: T.accent, borderRadius: 9999, paddingVertical: 16, alignItems: 'center' },
  drehenBtnDisabled: { backgroundColor: T.accentSoft },
  drehenBtnText: { color: T.surface, fontWeight: '600', fontSize: 16 },

  section: { backgroundColor: T.surface, borderRadius: 20, padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: T.ink, marginBottom: 8 },
  emptyHint: { fontSize: 14, color: T.muted, paddingVertical: 8 },

  poolRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: T.hairline },
  poolItem: { flex: 1, fontSize: 15, color: T.ink },

  removeBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 14, lineHeight: 20, color: T.muted, fontWeight: '600' },

  personChip: { width: 34, height: 34, borderRadius: 17, backgroundColor: T.accentSoft, alignItems: 'center', justifyContent: 'center' },
  personChipText: { fontSize: 13, fontWeight: '700', color: T.accent },

  inputRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  input: {
    flex: 1, backgroundColor: T.bg, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 15,
    borderWidth: 1, borderColor: T.hairline, color: T.ink,
  },
  addBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: T.surface, fontSize: 26, fontWeight: 'bold' },
});
