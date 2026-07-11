import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { T, Fonts } from '@/constants/theme';

type Item = { id: string; name: string; done: boolean };
type Ansicht = 'einkauf' | 'essen';

function Checkbox({ done, onPress }: { done: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.checkbox, done && styles.checkboxDone]}>
      {done && <View style={styles.checkmark} />}
    </TouchableOpacity>
  );
}

function Liste({ kollection, placeholder }: { kollection: string; placeholder: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [erledigtOffen, setErledigtOffen] = useState(true);

  useEffect(() => {
    const q = query(collection(db, kollection), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Item[]));
  }, [kollection]);

  const offen = items.filter(i => !i.done).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const erledigt = items.filter(i => i.done).sort((a, b) => a.name.localeCompare(b.name, 'de'));

  async function add() {
    if (!input.trim()) return;
    await addDoc(collection(db, kollection), { name: input.trim(), done: false, createdAt: serverTimestamp() });
    setInput('');
  }

  type Zeile =
    | { type: 'item'; item: Item }
    | { type: 'header-erledigt'; count: number };

  const zeilen: Zeile[] = [
    ...offen.map(item => ({ type: 'item' as const, item })),
    ...(erledigt.length > 0
      ? [
          { type: 'header-erledigt' as const, count: erledigt.length },
          ...(erledigtOffen ? erledigt.map(item => ({ type: 'item' as const, item })) : []),
        ]
      : []),
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={T.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={add}
        />
        <TouchableOpacity style={styles.addBtn} onPress={add} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={zeilen}
        keyExtractor={(z, i) => z.type === 'item' ? z.item.id : `header-${i}`}
        ItemSeparatorComponent={({ leadingItem }: any) =>
          leadingItem?.type === 'header-erledigt' ? null : <View style={styles.separator} />
        }
        renderItem={({ item: zeile }) => {
          if (zeile.type === 'header-erledigt') {
            return (
              <TouchableOpacity style={styles.gruppenHeader} onPress={() => setErledigtOffen(v => !v)} activeOpacity={0.7}>
                <Text style={styles.gruppenHeaderText}>Erledigt ({zeile.count})</Text>
                <Text style={styles.gruppenHeaderChevron}>{erledigtOffen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
            );
          }
          const item = zeile.item;
          return (
            <View style={styles.row}>
              <Checkbox done={item.done} onPress={() => updateDoc(doc(db, kollection, item.id), { done: !item.done })} />
              <Text style={[styles.rowText, item.done && styles.rowTextDone]}>{item.name}</Text>
              <TouchableOpacity onPress={() => deleteDoc(doc(db, kollection, item.id))}>
                <View style={styles.deleteBtn}><Text style={styles.deleteBtnText}>×</Text></View>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Noch nichts auf der Liste.</Text>}
      />
    </View>
  );
}

export default function Food() {
  const [ansicht, setAnsicht] = useState<Ansicht>('einkauf');

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Food</Text>

      <View style={styles.toggle}>
        <TouchableOpacity style={[styles.toggleBtn, ansicht === 'einkauf' && styles.toggleBtnActive]} onPress={() => setAnsicht('einkauf')}>
          <Text style={[styles.toggleText, ansicht === 'einkauf' && styles.toggleTextActive]}>Einkaufsliste</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, ansicht === 'essen' && styles.toggleBtnActive]} onPress={() => setAnsicht('essen')}>
          <Text style={[styles.toggleText, ansicht === 'essen' && styles.toggleTextActive]}>Essensliste</Text>
        </TouchableOpacity>
      </View>

      {ansicht === 'einkauf'
        ? <Liste kollection="einkaufsliste" placeholder="Eintrag hinzufügen…" />
        : <Liste kollection="essensliste"   placeholder="Was kochen wir?" />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, paddingTop: 64, paddingHorizontal: 20 },
  header: { fontFamily: Fonts?.serif, fontStyle: 'italic', fontSize: 28, color: T.ink, marginBottom: 16 },

  toggle: { flexDirection: 'row', backgroundColor: T.hairline, borderRadius: 10, marginBottom: 16, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: T.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 14, color: T.muted, fontWeight: '600' },
  toggleTextActive: { color: T.ink },

  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  input: {
    flex: 1, backgroundColor: T.surface, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 15,
    borderWidth: 1, borderColor: T.hairline, color: T.ink,
  },
  addBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: T.surface, fontSize: 26, fontWeight: 'bold' },

  gruppenHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, marginTop: 8,
    borderTopWidth: 1, borderTopColor: T.hairline,
  },
  gruppenHeaderText: { fontSize: 13, fontWeight: '600', color: T.muted },
  gruppenHeaderChevron: { fontSize: 11, color: T.muted },

  separator: { height: 1, backgroundColor: T.hairline },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowText: { flex: 1, fontSize: 16, color: T.ink, fontWeight: '600' },
  rowTextDone: { textDecorationLine: 'line-through', color: T.muted, fontWeight: '400' },

  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: T.accent, borderColor: T.accent },
  checkmark: { width: 8, height: 5, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: T.surface, transform: [{ rotate: '-45deg' }, { translateY: -1 }] },

  deleteBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 14, lineHeight: 20, color: T.muted, fontWeight: '600' },
  empty: { textAlign: 'center', color: T.muted, marginTop: 40, fontSize: 15 },
});
