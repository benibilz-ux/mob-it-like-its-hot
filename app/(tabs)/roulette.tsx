import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';

const STANDARD_AUFGABEN = ['Staubsaugen', 'Abwasch', 'Müll rausbringen', 'Bad putzen', 'Einkaufen'];
const PERSONEN = ['Benni', 'Lena'];

export default function Roulette() {
  const [aufgaben, setAufgaben] = useState<string[]>(STANDARD_AUFGABEN);
  const [neueAufgabe, setNeueAufgabe] = useState('');
  const [ergebnis, setErgebnis] = useState<{ aufgabe: string; person: string } | null>(null);
  const [spinning, setSpinning] = useState(false);

  function drehen() {
    if (aufgaben.length === 0) return;
    setSpinning(true);
    setErgebnis(null);

    setTimeout(() => {
      const zufallsAufgabe = aufgaben[Math.floor(Math.random() * aufgaben.length)];
      const zufallsPerson = PERSONEN[Math.floor(Math.random() * PERSONEN.length)];
      setErgebnis({ aufgabe: zufallsAufgabe, person: zufallsPerson });
      setSpinning(false);
    }, 1500);
  }

  function aufgabeHinzufuegen() {
    if (neueAufgabe.trim() === '') return;
    setAufgaben([...aufgaben, neueAufgabe.trim()]);
    setNeueAufgabe('');
  }

  function aufgabeEntfernen(index: number) {
    setAufgaben(aufgaben.filter((_, i) => i !== index));
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🎲 Aufgaben-Roulette</Text>
      <Text style={styles.subheader}>Wer macht was? Das Glück entscheidet!</Text>

      <TouchableOpacity
        style={[styles.drehenButton, spinning && styles.drehenButtonDisabled]}
        onPress={drehen}
        disabled={spinning}
      >
        <Text style={styles.drehenText}>{spinning ? '🎰 Drehe...' : '🎲 Drehen!'}</Text>
      </TouchableOpacity>

      {ergebnis && (
        <View style={styles.ergebnisCard}>
          <Text style={styles.ergebnisEmoji}>{ergebnis.person === 'Benni' ? '👨' : '👩'}</Text>
          <Text style={styles.ergebnisName}>{ergebnis.person}</Text>
          <Text style={styles.ergebnisText}>muss heute</Text>
          <Text style={styles.ergebnisAufgabe}>{ergebnis.aufgabe}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aufgaben im Topf:</Text>
        {aufgaben.map((aufgabe, index) => (
          <View key={index} style={styles.aufgabeRow}>
            <Text style={styles.aufgabeText}>• {aufgabe}</Text>
            <TouchableOpacity onPress={() => aufgabeEntfernen(index)}>
              <Text style={styles.remove}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Neue Aufgabe..."
            value={neueAufgabe}
            onChangeText={setNeueAufgabe}
            onSubmitEditing={aufgabeHinzufuegen}
          />
          <TouchableOpacity style={styles.addButton} onPress={aufgabeHinzufuegen}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    textAlign: 'center',
    marginBottom: 8,
  },
  subheader: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  drehenButton: {
    backgroundColor: '#FF5722',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FF5722',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  drehenButtonDisabled: {
    backgroundColor: '#ffaa99',
  },
  drehenText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  ergebnisCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  ergebnisEmoji: { fontSize: 48, marginBottom: 8 },
  ergebnisName: { fontSize: 24, fontWeight: 'bold', color: '#FF5722' },
  ergebnisText: { fontSize: 16, color: '#666', marginVertical: 4 },
  ergebnisAufgabe: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#444',
  },
  aufgabeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aufgabeText: { fontSize: 15, color: '#333' },
  remove: { fontSize: 16, color: '#aaa', paddingHorizontal: 8 },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#FF5722',
    borderRadius: 12,
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
