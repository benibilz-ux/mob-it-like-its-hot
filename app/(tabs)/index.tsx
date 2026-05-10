import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

const features = [
  { emoji: '🛒', title: 'Einkaufsliste', color: '#4CAF50', route: '/einkaufsliste' },
  { emoji: '🧹', title: 'Aufgaben', color: '#2196F3', route: '/aufgaben' },
  { emoji: '🌱', title: 'Gartenkalender', color: '#8BC34A', route: '/gartenkalender' },
  { emoji: '🎲', title: 'Roulette', color: '#FF5722', route: '/roulette' },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Guten Morgen! ☀️';
  if (hour < 18) return 'Hallo ihr zwei! 👋';
  return 'Guten Abend! 🌙';
}

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  card: {
    width: 150,
    height: 150,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
