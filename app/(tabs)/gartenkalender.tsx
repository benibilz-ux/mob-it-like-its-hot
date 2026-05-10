import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';

type Eintrag = {
  id: string;
  pflanze: string;
  aufgabe: string;
  datum: string;
  done: boolean;
};

const AUFGABEN = ['🌱 Pflanzen', '💧 Gießen', '✂️ Schneiden', '🌾 Ernten', '🌿 Düngen'];

export default function Gartenkalender() {
  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [pflanze, setPflanze] = useState('');
  const [aufgabe, setAufgabe] = useState(AUFGABEN[0]);
  const [datum, setDatum] = useState('');

  function addEintrag() {
    if (pflanze.trim() === '' || datum.trim() === '') return;
    setEintraege([
      ...eintraege,
      { id: Date.now().toString(), pflanze: pflanze.trim(), aufgabe, datum: datum.trim(), done: false },
    ]);
    setPflanze('');
    setDatum('');
    setAufgabe(AUFGABEN[0]);
    setModalVisible(false);
  }

  function toggleDone(id: string) {
    setEintraege(eintraege.map(e => e.id === id ? { ...e, done: !e.done } : e));
  }

  function deleteEintrag(id: string) {
    setEintraege(eintraege.filter(e => e.id !== id));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🌱 Gartenkalender</Text>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Aufgabe hinzufügen</Text>
      </TouchableOpacity>

      <FlatList
        data={eintraege.sort((a, b) => a.datum.localeCompare(b.datum))}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => toggleDone(item.id)} style={styles.cardLeft}>
              <Text style={styles.checkbox}>{item.done ? '✅' : '⬜'}</Text>
              <View>
                <Text style={[styles.pflanze, item.done && styles.done]}>{item.pflanze}</Text>
                <Text style={styles.aufgabe}>{item.aufgabe}</Text>
                <Text style={styles.datum}>📅 {item.datum}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteEintrag(item.id)}>
              <Text style={styles.delete}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Noch keine Gartenaufgaben.</Text>}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Neue Aufgabe</Text>

            <TextInput
              style={styles.input}
              placeholder="Pflanze (z.B. Tomaten)"
              value={pflanze}
              onChangeText={setPflanze}
            />

            <Text style={styles.label}>Aufgabe:</Text>
            <View style={styles.aufgabenRow}>
              {AUFGABEN.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.aufgabeChip, aufgabe === a && styles.aufgabeChipActive]}
                  onPress={() => setAufgabe(a)}
                >
                  <Text style={aufgabe === a ? styles.chipTextActive : styles.chipText}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Datum (z.B. 15.05.2026)"
              value={datum}
              onChangeText={setDatum}
            />

            <TouchableOpacity style={styles.saveButton} onPress={addEintrag}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#8BC34A',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: { fontSize: 22 },
  pflanze: { fontSize: 16, fontWeight: 'bold' },
  done: { textDecorationLine: 'line-through', color: '#aaa' },
  aufgabe: { fontSize: 13, color: '#666', marginTop: 2 },
  datum: { fontSize: 13, color: '#888', marginTop: 2 },
  delete: { fontSize: 20 },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: { fontSize: 14, color: '#666' },
  aufgabenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aufgabeChip: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
  },
  aufgabeChipActive: {
    backgroundColor: '#8BC34A',
  },
  chipText: { color: '#444', fontSize: 13 },
  chipTextActive: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  saveButton: {
    backgroundColor: '#8BC34A',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancel: {
    textAlign: 'center',
    color: '#888',
    padding: 10,
  },
});
