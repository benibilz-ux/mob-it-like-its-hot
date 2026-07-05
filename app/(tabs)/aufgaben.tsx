import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Modal, ActivityIndicator, Switch } from 'react-native';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Turnus = 'wöchentlich' | '2-wöchentlich' | 'monatlich';

type Aufgabe = {
  id: string;
  titel: string;
  person: string;
  done: boolean;
  datum: string;
  wiederkehrend: boolean;
  turnus: Turnus | '';
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

export default function Aufgaben() {
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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Aufgabe[];
      setAufgaben(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function addAufgabe() {
    if (titel.trim() === '') return;
    await addDoc(collection(db, 'aufgaben'), {
      titel: titel.trim(),
      person,
      done: false,
      datum: datum.trim(),
      wiederkehrend,
      turnus: wiederkehrend ? turnus : '',
      createdAt: serverTimestamp(),
    });
    resetForm();
    setModalVisible(false);
  }

  async function toggleDone(aufgabe: Aufgabe) {
    await updateDoc(doc(db, 'aufgaben', aufgabe.id), { done: !aufgabe.done });
    if (!aufgabe.done && aufgabe.wiederkehrend && aufgabe.datum && aufgabe.turnus) {
      await addDoc(collection(db, 'aufgaben'), {
        titel: aufgabe.titel,
        person: aufgabe.person,
        done: false,
        datum: naechesDatum(aufgabe.datum, aufgabe.turnus as Turnus),
        wiederkehrend: true,
        turnus: aufgabe.turnus,
        createdAt: serverTimestamp(),
      });
    }
  }

  async function deleteAufgabe(id: string) {
    await deleteDoc(doc(db, 'aufgaben', id));
  }

  function resetForm() {
    setTitel('');
    setPerson(PERSONEN[0]);
    setDatum('');
    setWiederkehrend(false);
    setTurnus('wöchentlich');
  }

  const offen = aufgaben.filter(a => !a.done);
  const erledigt = aufgaben.filter(a => a.done);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🧹 Aufgaben</Text>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Aufgabe hinzufügen</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={[...offen, ...erledigt]}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => toggleDone(item)} style={styles.cardLeft}>
                <Text style={styles.checkbox}>{item.done ? '✅' : '⬜'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.titel, item.done && styles.done]}>{item.titel}</Text>
                  <Text style={styles.meta}>
                    {personEmoji(item.person)} {item.person}
                    {item.datum ? `  📅 ${item.datum}` : ''}
                    {item.wiederkehrend ? `  🔁 ${item.turnus}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteAufgabe(item.id)}>
                <Text style={styles.delete}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Keine Aufgaben — alles erledigt! 🎉</Text>}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Neue Aufgabe</Text>

            <TextInput
              style={styles.input}
              placeholder="Was muss gemacht werden?"
              value={titel}
              onChangeText={setTitel}
            />

            <TextInput
              style={styles.input}
              placeholder="Datum (z.B. 25.06.2026)"
              value={datum}
              onChangeText={setDatum}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Für wen?</Text>
            <View style={styles.row}>
              {PERSONEN.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, person === p && styles.chipActive]}
                  onPress={() => setPerson(p)}
                >
                  <Text style={person === p ? styles.chipTextActive : styles.chipText}>
                    {personEmoji(p)} {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Wiederkehrend</Text>
              <Switch
                value={wiederkehrend}
                onValueChange={setWiederkehrend}
                trackColor={{ true: '#2196F3' }}
              />
            </View>

            {wiederkehrend && (
              <>
                <Text style={styles.label}>Turnus</Text>
                <View style={styles.row}>
                  {TURNUS_OPTIONEN.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, turnus === t && styles.chipActive]}
                      onPress={() => setTurnus(t)}
                    >
                      <Text style={turnus === t ? styles.chipTextActive : styles.chipText}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={addAufgabe}>
              <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { resetForm(); setModalVisible(false); }}>
              <Text style={styles.cancel}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function personEmoji(person: string) {
  if (person === 'Benni') return '👨';
  if (person === 'Lena') return '👩';
  return '👫';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  addButton: { backgroundColor: '#2196F3', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eee' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkbox: { fontSize: 22 },
  titel: { fontSize: 16, fontWeight: 'bold' },
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
  chipText: { color: '#444', fontSize: 14 },
  chipTextActive: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#2196F3', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancel: { textAlign: 'center', color: '#888', padding: 10 },
});
