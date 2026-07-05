import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Item = {
  id: string;
  name: string;
  done: boolean;
};

export default function Einkaufsliste() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'einkaufsliste'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Item[];
      setItems(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function addItem() {
    if (input.trim() === '') return;
    await addDoc(collection(db, 'einkaufsliste'), {
      name: input.trim(),
      done: false,
      createdAt: serverTimestamp(),
    });
    setInput('');
  }

  async function toggleItem(id: string, done: boolean) {
    await updateDoc(doc(db, 'einkaufsliste', id), { done: !done });
  }

  async function deleteItem(id: string) {
    await deleteDoc(doc(db, 'einkaufsliste', id));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🛒 Einkaufsliste</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Was brauchst du?"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addItem}
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 40 }} />
      ) : (
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
      )}
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
    marginBottom: 24,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  item: {
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
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    fontSize: 22,
  },
  itemText: {
    fontSize: 16,
  },
  itemDone: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  delete: {
    fontSize: 20,
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 40,
    fontSize: 16,
  },
});
