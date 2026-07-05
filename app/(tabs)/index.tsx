import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const features = [
  { emoji: '🍽️', title: 'Food', color: '#4CAF50', route: '/einkaufsliste' },
  { emoji: '🧹', title: 'Aufgaben', color: '#2196F3', route: '/aufgaben' },
  { emoji: '🎲', title: 'Roulette', color: '#FF5722', route: '/roulette' },
  { emoji: '📅', title: 'Kalender', color: '#9C27B0', route: '/kalender' },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Guten Morgen! ☀️';
  if (hour < 18) return 'Hallo ihr zwei! 👋';
  return 'Guten Abend! 🌙';
}

export default function HomeScreen() {
  const router = useRouter();
  const [essenInput, setEssenInput] = useState('');
  const [einkaufInput, setEinkaufInput] = useState('');

  async function addEssen() {
    if (essenInput.trim() === '') return;
    await addDoc(collection(db, 'essensliste'), { name: essenInput.trim(), done: false, createdAt: serverTimestamp() });
    setEssenInput('');
  }

  async function addEinkauf() {
    if (einkaufInput.trim() === '') return;
    await addDoc(collection(db, 'einkaufsliste'), { name: einkaufInput.trim(), done: false, createdAt: serverTimestamp() });
    setEinkaufInput('');
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>🔥 Mob it like it's hot</Text>
        <Text style={styles.subheader}>{greeting()}</Text>

        <View style={styles.grid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.title}
              style={[styles.card, { backgroundColor: feature.color }]}
              onPress={() => router.push(feature.route as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{feature.emoji}</Text>
              <Text style={styles.cardTitle}>{feature.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.quickInput}>
        <View style={styles.quickRow}>
          <TextInput
            style={styles.quickField}
            placeholder="Was kochen wir?"
            value={essenInput}
            onChangeText={setEssenInput}
            onSubmitEditing={addEssen}
            returnKeyType="done"
          />
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: '#FF9800' }]} onPress={addEssen}>
            <Text style={styles.quickBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickRow}>
          <TextInput
            style={styles.quickField}
            placeholder="Was kaufen wir ein?"
            value={einkaufInput}
            onChangeText={setEinkaufInput}
            onSubmitEditing={addEinkauf}
            returnKeyType="done"
          />
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: '#4CAF50' }]} onPress={addEinkauf}>
            <Text style={styles.quickBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 10 },
  header: { fontSize: 28, fontWeight: 'bold', marginTop: 60, marginBottom: 8, textAlign: 'center' },
  subheader: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  card: { width: 150, height: 150, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  emoji: { fontSize: 48, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  quickInput: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  quickRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  quickField: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, borderWidth: 1, borderColor: '#e0e0e0' },
  quickBtn: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickBtnText: { color: 'white', fontSize: 26, fontWeight: 'bold' },
});
