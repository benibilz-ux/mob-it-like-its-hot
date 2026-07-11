import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Modal, ScrollView, Switch } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { T, Fonts } from '@/constants/theme';

LocaleConfig.locales['de'] = {
  monthNames: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  monthNamesShort: ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'],
  dayNames: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
  dayNamesShort: ['So','Mo','Di','Mi','Do','Fr','Sa'],
  today: 'Heute',
};
LocaleConfig.defaultLocale = 'de';

type Ansicht = 'haushalt' | 'garten';
type Turnus = 'wöchentlich' | '2-wöchentlich' | 'monatlich';

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function ddmmToIso(datum: string): string {
  const [d, m, y] = datum.split('.');
  if (!d || !m || !y) return '';
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}

function isoToDdmm(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}.${m}.${y}`;
}

function heuteIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function Checkbox({ done, onPress }: { done: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.checkbox, done && styles.checkboxDone]}>
      {done && <View style={styles.checkmark} />}
    </TouchableOpacity>
  );
}

function PersonChip({ person, done }: { person: string; done: boolean }) {
  const initial = person === 'Beide' ? '2' : person[0];
  return (
    <View style={[styles.personChip, done && styles.personChipDone]}>
      <Text style={[styles.personChipText, done && styles.personChipTextDone]}>{initial}</Text>
    </View>
  );
}

function DatumPicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const [offen, setOffen] = useState(false);
  const isoValue = value ? ddmmToIso(value) : undefined;

  function waehle(day: { dateString: string }) {
    onChange(isoToDdmm(day.dateString));
    setOffen(false);
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.input, styles.datumField]}
        onPress={() => setOffen(v => !v)}
        activeOpacity={0.7}
      >
        <Text style={value ? styles.datumText : styles.datumPlaceholder}>
          {value || 'Datum wählen…'}
        </Text>
        <Text style={styles.datumChevron}>{offen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {offen && (
        <View style={styles.kalenderBox}>
          <Calendar
            onDayPress={waehle}
            selected={isoValue}
            markedDates={isoValue ? { [isoValue]: { selected: true, selectedColor: T.accent } } : {}}
            initialDate={isoValue ?? heuteIso()}
            theme={{
              calendarBackground: T.surface,
              selectedDayBackgroundColor: T.accent,
              selectedDayTextColor: T.surface,
              todayTextColor: T.accent,
              dayTextColor: T.ink,
              textDisabledColor: T.hairline,
              monthTextColor: T.ink,
              arrowColor: T.accent,
              textMonthFontWeight: '600',
            }}
          />
        </View>
      )}
    </View>
  );
}

// ─── Haushalt ─────────────────────────────────────────────────────────────────

type Aufgabe = {
  id: string; titel: string; person: string; done: boolean;
  datum: string; wiederkehrend: boolean; turnus: Turnus | '';
};

const PERSONEN = ['Benni', 'Leni', 'Beide'];
const TURNUS_OPTIONEN: Turnus[] = ['wöchentlich', '2-wöchentlich', 'monatlich'];

function naechesDatum(datum: string, turnus: Turnus): string {
  const [day, month, year] = datum.split('.').map(Number);
  const date = new Date(year, month - 1, day);
  if (turnus === 'wöchentlich') date.setDate(date.getDate() + 7);
  else if (turnus === '2-wöchentlich') date.setDate(date.getDate() + 14);
  else if (turnus === 'monatlich') date.setMonth(date.getMonth() + 1);
  return `${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}.${date.getFullYear()}`;
}

function HaushaltListe() {
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [modal, setModal] = useState(false);
  const [titel, setTitel] = useState('');
  const [person, setPerson] = useState(PERSONEN[0]);
  const [datum, setDatum] = useState('');
  const [wiederkehrend, setWiederkehrend] = useState(false);
  const [turnus, setTurnus] = useState<Turnus>('wöchentlich');

  useEffect(() => {
    const q = query(collection(db, 'aufgaben'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => setAufgaben(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Aufgabe[]));
  }, []);

  async function add() {
    if (!titel.trim()) return;
    await addDoc(collection(db, 'aufgaben'), {
      titel: titel.trim(), person, done: false, datum: datum.trim(),
      wiederkehrend, turnus: wiederkehrend ? turnus : '', createdAt: serverTimestamp(),
    });
    reset(); setModal(false);
  }

  async function toggle(a: Aufgabe) {
    await updateDoc(doc(db, 'aufgaben', a.id), { done: !a.done });
    if (!a.done && a.wiederkehrend && a.datum && a.turnus) {
      await addDoc(collection(db, 'aufgaben'), {
        titel: a.titel, person: a.person, done: false,
        datum: naechesDatum(a.datum, a.turnus as Turnus),
        wiederkehrend: true, turnus: a.turnus, createdAt: serverTimestamp(),
      });
    }
  }

  function reset() { setTitel(''); setPerson(PERSONEN[0]); setDatum(''); setWiederkehrend(false); setTurnus('wöchentlich'); }

  const offen = aufgaben.filter(a => !a.done);
  const erledigt = aufgaben.filter(a => a.done);

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.subheader}>{offen.length} offen</Text>

      <FlatList
        data={[...offen, ...erledigt]}
        keyExtractor={i => i.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Checkbox done={item.done} onPress={() => toggle(item)} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.rowTitle, item.done && styles.rowTitleDone]}>{item.titel}</Text>
              <Text style={styles.rowMeta}>
                {item.datum ? item.datum : ''}
                {item.datum && item.turnus ? '  ·  ' : ''}
                {item.turnus ? item.turnus : ''}
              </Text>
            </View>
            <PersonChip person={item.person} done={item.done} />
            <TouchableOpacity onPress={() => deleteDoc(doc(db, 'aufgaben', item.id))}>
              <View style={styles.deleteBtn}><Text style={styles.deleteBtnText}>×</Text></View>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Keine offenen Aufgaben.</Text>}
      />

      <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)} activeOpacity={0.8}>
        <Text style={styles.addBtnText}>Aufgabe hinzufügen</Text>
      </TouchableOpacity>

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 14, paddingBottom: 32 }}>
            <Text style={styles.sheetTitle}>Neue Aufgabe</Text>
            <TextInput style={styles.input} placeholder="Was muss gemacht werden?" placeholderTextColor={T.muted} value={titel} onChangeText={setTitel} />
            <DatumPicker value={datum} onChange={setDatum} />
            <Text style={styles.fieldLabel}>Für wen?</Text>
            <View style={styles.chipRow}>
              {PERSONEN.map(p => (
                <TouchableOpacity key={p} style={[styles.chip, person === p && styles.chipActive]} onPress={() => setPerson(p)}>
                  <Text style={[styles.chipText, person === p && styles.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Wiederkehrend</Text>
              <Switch value={wiederkehrend} onValueChange={setWiederkehrend} trackColor={{ true: T.accent }} />
            </View>
            {wiederkehrend && (
              <>
                <Text style={styles.fieldLabel}>Turnus</Text>
                <View style={styles.chipRow}>
                  {TURNUS_OPTIONEN.map(t => (
                    <TouchableOpacity key={t} style={[styles.chip, turnus === t && styles.chipActive]} onPress={() => setTurnus(t)}>
                      <Text style={[styles.chipText, turnus === t && styles.chipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <TouchableOpacity style={styles.addBtn} onPress={add} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>Speichern</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { reset(); setModal(false); }}>
              <Text style={styles.cancelText}>Abbrechen</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Garten ──────────────────────────────────────────────────────────────────

type Eintrag = { id: string; pflanze: string; aufgabe: string; datum: string; done: boolean };
const GARTEN_AUFGABEN = ['Pflanzen', 'Gießen', 'Schneiden', 'Ernten', 'Düngen'];

function GartenListe() {
  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [modal, setModal] = useState(false);
  const [pflanze, setPflanze] = useState('');
  const [aufgabe, setAufgabe] = useState(GARTEN_AUFGABEN[0]);
  const [datum, setDatum] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'gartenkalender'), orderBy('datum', 'asc'));
    return onSnapshot(q, snap => setEintraege(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Eintrag[]));
  }, []);

  async function add() {
    if (!pflanze.trim() || !datum.trim()) return;
    await addDoc(collection(db, 'gartenkalender'), {
      pflanze: pflanze.trim(), aufgabe, datum: datum.trim(), done: false, createdAt: serverTimestamp(),
    });
    setPflanze(''); setDatum(''); setAufgabe(GARTEN_AUFGABEN[0]); setModal(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.subheader}>{eintraege.filter(e => !e.done).length} offen</Text>

      <FlatList
        data={eintraege}
        keyExtractor={i => i.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Checkbox done={item.done} onPress={() => updateDoc(doc(db, 'gartenkalender', item.id), { done: !item.done })} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.rowTitle, item.done && styles.rowTitleDone]}>{item.pflanze}</Text>
              <Text style={styles.rowMeta}>{item.aufgabe}  ·  {item.datum}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteDoc(doc(db, 'gartenkalender', item.id))}>
              <View style={styles.deleteBtn}><Text style={styles.deleteBtnText}>×</Text></View>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Keine Gartenaufgaben.</Text>}
      />

      <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)} activeOpacity={0.8}>
        <Text style={styles.addBtnText}>Aufgabe hinzufügen</Text>
      </TouchableOpacity>

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 14, paddingBottom: 32 }}>
            <Text style={styles.sheetTitle}>Neue Gartenaufgabe</Text>
            <TextInput style={styles.input} placeholder="Pflanze (z.B. Tomaten)" placeholderTextColor={T.muted} value={pflanze} onChangeText={setPflanze} />
            <Text style={styles.fieldLabel}>Aufgabe</Text>
            <View style={styles.chipRow}>
              {GARTEN_AUFGABEN.map(a => (
                <TouchableOpacity key={a} style={[styles.chip, aufgabe === a && styles.chipActive]} onPress={() => setAufgabe(a)}>
                  <Text style={[styles.chipText, aufgabe === a && styles.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <DatumPicker value={datum} onChange={setDatum} />
            <TouchableOpacity style={styles.addBtn} onPress={add} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>Speichern</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Text style={styles.cancelText}>Abbrechen</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function Aufgaben() {
  const [ansicht, setAnsicht] = useState<Ansicht>('haushalt');

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Aufgaben</Text>

      <View style={styles.toggle}>
        <TouchableOpacity style={[styles.toggleBtn, ansicht === 'haushalt' && styles.toggleBtnActive]} onPress={() => setAnsicht('haushalt')}>
          <Text style={[styles.toggleText, ansicht === 'haushalt' && styles.toggleTextActive]}>Haushalt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, ansicht === 'garten' && styles.toggleBtnActive]} onPress={() => setAnsicht('garten')}>
          <Text style={[styles.toggleText, ansicht === 'garten' && styles.toggleTextActive]}>Garten</Text>
        </TouchableOpacity>
      </View>

      {ansicht === 'haushalt' ? <HaushaltListe /> : <GartenListe />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, paddingTop: 64, paddingHorizontal: 20 },
  header: { fontFamily: Fonts?.serif, fontStyle: 'italic', fontSize: 28, color: T.ink, marginBottom: 4 },
  subheader: { fontSize: 13, color: T.muted, marginBottom: 12 },

  toggle: { flexDirection: 'row', backgroundColor: T.hairline, borderRadius: 10, marginBottom: 16, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: T.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 14, color: T.muted, fontWeight: '600' },
  toggleTextActive: { color: T.ink },

  separator: { height: 1, backgroundColor: T.hairline },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowTitle: { fontSize: 16, color: T.ink, fontWeight: '600' },
  rowTitleDone: { textDecorationLine: 'line-through', color: T.muted },
  rowMeta: { fontSize: 12, color: T.muted },

  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: T.accent, borderColor: T.accent },
  checkmark: { width: 8, height: 5, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: T.surface, transform: [{ rotate: '-45deg' }, { translateY: -1 }] },

  personChip: { width: 26, height: 26, borderRadius: 13, backgroundColor: T.accentSoft, alignItems: 'center', justifyContent: 'center' },
  personChipDone: { backgroundColor: T.hairline },
  personChipText: { fontSize: 12, fontWeight: '700', color: T.accent },
  personChipTextDone: { color: T.muted },

  deleteBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 14, lineHeight: 20, color: T.muted, fontWeight: '600' },

  addBtn: { backgroundColor: T.accent, borderRadius: 9999, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  addBtnText: { color: T.surface, fontWeight: '600', fontSize: 15 },

  overlay: { flex: 1, backgroundColor: 'rgba(38,37,31,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: T.ink, marginBottom: 4 },
  input: { backgroundColor: T.bg, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: T.hairline, color: T.ink },
  fieldLabel: { fontSize: 13, color: T.muted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: T.hairline },
  chipActive: { backgroundColor: T.accent, borderColor: T.accent },
  chipText: { color: T.muted, fontSize: 14 },
  chipTextActive: { color: T.surface, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelText: { textAlign: 'center', color: T.muted, padding: 10, fontSize: 15 },
  empty: { textAlign: 'center', color: T.muted, marginTop: 40, fontSize: 15 },

  datumField: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  datumText: { fontSize: 15, color: T.ink },
  datumPlaceholder: { fontSize: 15, color: T.muted },
  datumChevron: { fontSize: 11, color: T.muted },
  kalenderBox: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: T.hairline, marginTop: 4 },
});
