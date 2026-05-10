import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';

type Aufgabe = {
  id: string;
  titel: string;
  person: string;
  done: boolean;
};

const PERSONEN = ['Benni', 'Lena', 'Beide'];

export default function Aufgaben() {
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [titel, setTitel] = useState('');
  const [person, setPerson] = useState(PERSONEN[0]);

  function addAufgabe() {
    if (titel.trim() === '') return;
    setAufgaben([...aufgaben, { id: Date.now().toString(), titel: titel.trim(), person, done: false }]);
    setTitel('');
    setPerson(PERSONEN[0]);
    setModalVisible(false);
  }

  function toggleDone(id: string) {
    setAufgaben(aufgaben.map(a => a.id === id ? { ...a, done: !a.done } : a));
  }

  function deleteAufgabe(id: string) {
    setAufgaben(aufgaben.filter(a => a.id !== id));
  }

  const offen = aufgaben.filter(a => !a.done);
  const erledigt = aufgaben.filter(a => a.done);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🧹 Aufgaben</Text>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Aufgabe hinzufügen</Text>
      </TouchableOpacity>

      <FlatList
        data={[...offen, ...erledigt]}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => toggleDone(item.id)} style={styles.cardLeft}>
              <Text style={styles.checkbox}>{item.done ? '✅' : '⬜'}</Text>
              <View>
                <Text style={[styles.titel, item.done && styles.done]}>{item.titel}</Text>
                <Text style={styles.person}>{personEmoji(item.person)} {item.person}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteAufgabe(item.id)}>
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

            <TextInput
              style={styles.input}
              placeholder="Was muss gemacht werden?"
              value={titel}
              onChangeText={setTitel}
            />

            <Text style={styles.label}>Für wen?</Text>
            <View style={styles.personenRow}>
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

            <TouchableOpacity style={styles.saveButton} onPress={addAufgabe}>
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

function personEmoji(person: string) {
  if (person === 'Benni') return '👨';
  if (person === 'Lena') return '👩';
  return '👫';
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
    backgroundColor: '#2196F3',
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
  titel: { fontSize: 16, fontWeight: 'bold' },
  done: { textDecorationLine: 'line-through', color: '#aaa' },
  person: { fontSize: 13, color: '#666', marginTop: 2 },
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
  personenRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
  },
  chipActive: {
    backgroundColor: '#2196F3',
  },
  chipText: { color: '#444', fontSize: 14 },
  chipTextActive: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  saveButton: {
    backgroundColor: '#2196F3',
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
