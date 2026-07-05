import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Modal, ActivityIndicator, Switch } from 'react-native';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Ansicht = 'haushalt' | 'garten';
type Turnus = 'wöchentlich' | '2-wöchentlich' | 'monatlich';

// ─── Haushalt ────────────────────────────────────────────────────────────────

type Aufgabe = {
  id: string; titel: string; person: string; done: boolean;
  datum: string; wiederkehrend: boolean; turnus: Turnus | '';
};

const PERSONEN = ['Benni', 'Lena', 'Beide'];
const TURNUS_OPTIONEN: Turnus[] = ['wöchentlich', '2-wöchentlich', 'monatlich'];

function naechesDatum(datum: string, turnus: Turnus): string {
  const [day, month, year] = datum.split('.').map(Number);
  const date = new Date(year, month - 1, day);
  if (turnus === 'wöchentlich') date.setDate(date.getDate() + 7);
  else if (turnus === '2-wöchentlich') date.setDate(date.getDate() + 14);
  else if (turnus === 'monatlich') date.setMonth(date.getMonth() + 1);
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
}

function personEmoji(p: string) {
  if (p === 'Benni') return '👨';
  if (p === 'Lena') return '👩';
  return '👫';
}

function HaushaltListe() {
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [titel, setTitel] = useState('');
  const [person, setPerson] = useState(PERSONEN[0]);
  const [datum, setDatum] = useState('');
  const [wiederkehrend, setWiederkehrend] = useState(false);
  const [turnus, setTurnus] = useState<Turnus>('wöchentlich');

  useEffect(() => {
    const q = query(collection(db, 'aufgaben'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => {
      setAufgaben(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Aufgabe[]);
      setLoading(false);
    });
  }, []);

  async function addAufgabe() {
    if (titel.trim() === '') return;
    await addDoc(collection(db, 'aufgaben'), {
      titel: titel.trim(), person, done: false, datum: datum.trim(),
      wiederkehrend, turnus: wiederkehrend ? turnus : '', createdAt: serverTimestamp(),
    });
    reset(); setModalVisible(false);
  }

  async function toggleDone(a: Aufgabe) {
    await updateDoc(doc(db, 'aufgaben', a.id), { done: !a.done });
    if (!a.done && a.wiederkehrend && a.datum && a.turnus) {
      await addDoc(collection(db, 'aufgaben'), {
        titel: a.titel, person: a.person, done: false,
        datum: naechesDatum(a.datum, a.turnus as Turnus),
        wiederkehrend: true, turnus: a.turnus, createdAt: serverTimestamp(),
      });
    }
  }

  function reset() {
    setTitel(''); setPerson(PERSONEN[0]); setDatum('');
    setWiederkehrend(false); setTurnus('wöchentlich');
  }

  if (loading) return <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Aufgabe hinzufügen</Text>
      </TouchableOpacity>

      <FlatList
        data={[...aufgaben.filter(a => !a.done), ...aufgaben.filter(a => a.done)]}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => toggleDone(item)} style={styles.cardLeft}>
              <Text style={styles.checkbox}>{item.done ? '✅' : '⬜'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitel, item.done && styles.done]}>{item.titel}</Text>
                <Text style={styles.meta}>
                  {personEmoji(item.person)} {item.person}
                  {item.datum ? `  📅 ${item.datum}` : ''}
                  {item.wiederkehrend ? `  🔁 ${item.turnus}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteDoc(doc(db, 'aufgaben', item.id))}>
              <Text style={styles.delete}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Keine Aufgaben — alles erledigt! 🎉</Text>}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Neue Aufgabe</Text>
            <TextInput style={styles.input} placeholder="Was muss gemacht werden?" value={titel} onChangeText={setTitel} />
            <TextInput style={styles.input} placeholder="Datum (z.B. 25.06.2026)" value={datum} onChangeText={setDatum} keyboardType="numeric" />
            <Text style={styles.label}>Für wen?</Text>
            <View style={styles.row}>
              {PERSONEN.map(p => (
                <TouchableOpacity key={p} style={[styles.chip, person === p && styles.chipActive]} onPress={() => setPerson(p)}>
                  <Text style={person === p ? styles.chipTextActive : styles.chipText}>{personEmoji(p)} {p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Wiederkehrend</Text>
              <Switch value={wiederkehrend} onValueChange={setWiederkehrend} trackColor={{ true: '#2196F3' }} />
            </View>
            {wiederkehrend && (
              <>
                <Text style={styles.label}>Turnus</Text>
                <View style={styles.row}>
                  {TURNUS_OPTIONEN.map(t => (
                    <TouchableOpacity key={t} style={[styles.chip, turnus === t && styles.chipActive]} onPress={() => setTurnus(t)}>
                      <Text style={turnus === t ? styles.chipTextActive : styles.chipText}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <TouchableOpacity style={styles.saveButton} onPress={addAufgabe}>
              <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { reset(); setModalVisible(false); }}>
              <Text style={styles.cancel}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Garten ──────────────────────────────────────────────────────────────────

type Eintrag = { id: string; pflanze: string; aufgabe: string; datum: string; done: boolean };
const GARTEN_AUFGABEN = ['🌱 Pflanzen', '💧 Gießen', '✂️ Schneiden', '🌾 Ernten', '🌿 Düngen'];

function GartenListe() {
  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [pflanze, setPflanze] = useState('');
  const [aufgabe, setAufgabe] = useState(GARTEN_AUFGABEN[0]);
  const [datum, setDatum] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'gartenkalender'), orderBy('datum', 'asc'));
    return onSnapshot(q, snap => {
      setEintraege(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Eintrag[]);
      setLoading(false);
    });
  }, []);

  async function addEintrag() {
    if (pflanze.trim() === '' || datum.trim() === '') return;
    await addDoc(collection(db, 'gartenkalender'), {
      pflanze: pflanze.trim(), aufgabe, datum: datum.trim(), done: false, createdAt: serverTimestamp(),
    });
    setPflanze(''); setDatum(''); setAufgabe(GARTEN_AUFGABEN[0]); setModalVisible(false);
  }

  if (loading) return <ActivityIndicator size="large" color="#8BC34A" style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={[styles.addButton, { backgroundColor: '#8BC34A' }]} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Aufgabe hinzufügen</Text>
      </TouchableOpacity>

      <FlatList
        data={eintraege}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => updateDoc(doc(db, 'gartenkalender', item.id), { done: !item.done })} style={styles.cardLeft}>
              <Text style={styles.checkbox}>{item.done ? '✅' : '⬜'}</Text>
              <View>
                <Text style={[styles.cardTitel, item.done && styles.done]}>{item.pflanze}</Text>
                <Text style={styles.meta}>{item.aufgabe}  📅 {item.datum}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteDoc(doc(db, 'gartenkalender', item.id))}>
              <Text style={styles.delete}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Noch keine Gartenaufgaben.</Text>}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Neue Gartenaufgabe</Text>
            <TextInput style={styles.input} placeholder="Pflanze (z.B. Tomaten)" value={pflanze} onChangeText={setPflanze} />
            <Text style={styles.label}>Aufgabe:</Text>
            <View style={styles.row}>
              {GARTEN_AUFGABEN.map(a => (
                <TouchableOpacity key={a} style={[styles.chip, aufgabe === a && styles.chipGartenActive]} onPress={() => setAufgabe(a)}>
                  <Text style={aufgabe === a ? styles.chipTextActive : styles.chipText}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Datum (z.B. 15.05.2026)" value={datum} onChangeText={setDatum} keyboardType="numeric" />
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#8BC34A' }]} onPress={addEintrag}>
              <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
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
      <Text style={styles.header}>🧹 Aufgaben</Text>

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, ansicht === 'haushalt' && styles.toggleBtnActive]}
          onPress={() => setAnsicht('haushalt')}
        >
          <Text style={[styles.toggleText, ansicht === 'haushalt' && styles.toggleTextActive]}>🧹 Haushalt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, ansicht === 'garten' && styles.toggleBtnActive]}
          onPress={() => setAnsicht('garten')}
        >
          <Text style={[styles.toggleText, ansicht === 'garten' && styles.toggleTextActive]}>🌱 Garten</Text>
        </TouchableOpacity>
      </View>

      {ansicht === 'haushalt' ? <HaushaltListe /> : <GartenListe />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  toggle: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderRadius: 12, marginBottom: 16, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 14, color: '#888', fontWeight: '600' },
  toggleTextActive: { color: '#333' },
  addButton: { backgroundColor: '#2196F3', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eee' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkbox: { fontSize: 22 },
  cardTitel: { fontSize: 16, fontWeight: 'bold' },
  done: { textDecorationLine: 'line-through', color: '#aaa' },
  meta: { fontSize: 12, color: '#666', marginTop: 3 },
  delete: { fontSize: 20 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  label: { fontSize: 14, color: '#666' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#2196F3' },
  chipGartenActive: { backgroundColor: '#8BC34A' },
  chipText: { color: '#444', fontSize: 14 },
  chipTextActive: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#2196F3', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancel: { textAlign: 'center', color: '#888', padding: 10 },
});
