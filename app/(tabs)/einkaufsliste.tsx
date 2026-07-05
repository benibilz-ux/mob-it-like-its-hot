import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Item = { id: string; name: string; done: boolean };
type Ansicht = 'einkauf' | 'essen';

function Liste({ kollection, placeholder }: { kollection: string; placeholder: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, kollection), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Item[]);
      setLoading(false);
    });
    return unsubscribe;
  }, [kollection]);

  async function addItem() {
    if (input.trim() === '') return;
    await addDoc(collection(db, kollection), { name: input.trim(), done: false, createdAt: serverTimestamp() });
    setInput('');
  }

  async function toggleItem(id: string, done: boolean) {
    await updateDoc(doc(db, kollection, id), { done: !done });
  }

  async function deleteItem(id: string) {
    await deleteDoc(doc(db, kollection, id));
  }

  if (loading) return <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addItem}
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TouchableOpacity onPress={() => toggleItem(item.id, item.done)} style={styles.itemLeft}>
              <Text style={styles.checkbox}>{item.done ? '✅' : '⬜'}</Text>
              <Text style={[styles.itemText, item.done && styles.itemDone]}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteItem(item.id)}>
              <Text style={styles.delete}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Noch nichts auf der Liste.</Text>}
      />
    </View>
  );
}

export default function Food() {
  const [ansicht, setAnsicht] = useState<Ansicht>('einkauf');

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🍽️ Food</Text>

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, ansicht === 'einkauf' && styles.toggleBtnActive]}
          onPress={() => setAnsicht('einkauf')}
        >
          <Text style={[styles.toggleText, ansicht === 'einkauf' && styles.toggleTextActive]}>
            🛒 Einkaufsliste
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, ansicht === 'essen' && styles.toggleBtnActive]}
          onPress={() => setAnsicht('essen')}
        >
          <Text style={[styles.toggleText, ansicht === 'essen' && styles.toggleTextActive]}>
            🍳 Essensliste
          </Text>
        </TouchableOpacity>
      </View>

      {ansicht === 'einkauf' ? (
        <Liste kollection="einkaufsliste" placeholder="Was brauchst du?" />
      ) : (
        <Liste kollection="essensliste" placeholder="Was kochen wir?" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  toggle: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderRadius: 12, marginBottom: 20, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 14, color: '#888', fontWeight: '600' },
  toggleTextActive: { color: '#333' },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  addButton: { backgroundColor: '#4CAF50', borderRadius: 12, width: 50, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  item: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eee' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkbox: { fontSize: 22 },
  itemText: { fontSize: 16 },
  itemDone: { textDecorationLine: 'line-through', color: '#aaa' },
  delete: { fontSize: 20 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
});
