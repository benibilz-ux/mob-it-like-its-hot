import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

LocaleConfig.locales['de'] = {
  monthNames: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  monthNamesShort: ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'],
  dayNames: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
  dayNamesShort: ['So','Mo','Di','Mi','Do','Fr','Sa'],
  today: 'Heute',
};
LocaleConfig.defaultLocale = 'de';

type Eintrag = {
  id: string;
  titel?: string;
  pflanze?: string;
  person?: string;
  aufgabe?: string;
  datum: string;
  done: boolean;
  typ: 'aufgabe' | 'garten';
};

const FARBEN: Record<string, string> = {
  Benni: '#2196F3',
  Lena:  '#E91E63',
  Beide: '#9C27B0',
  garten: '#8BC34A',
};

function zuKalenderDatum(datum: string): string {
  const parts = datum.split('.');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function heute(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Kalender() {
  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [gewaehlt, setGewaehlt] = useState(heute());

  useEffect(() => {
    let aufgabenDaten: Eintrag[] = [];
    let gartenDaten: Eintrag[] = [];
    let aufgabenGeladen = false;
    let gartenGeladen = false;

    function merge() {
      if (aufgabenGeladen && gartenGeladen) {
        setEintraege([...aufgabenDaten, ...gartenDaten]);
        setLoading(false);
      }
    }

    const u1 = onSnapshot(query(collection(db, 'aufgaben')), snap => {
      aufgabenDaten = snap.docs
        .map(d => ({ id: d.id, ...d.data(), typ: 'aufgabe' as const }))
        .filter((a: any) => a.datum);
      aufgabenGeladen = true;
      merge();
    });

    const u2 = onSnapshot(query(collection(db, 'gartenkalender')), snap => {
      gartenDaten = snap.docs
        .map(d => ({ id: d.id, ...d.data(), typ: 'garten' as const }))
        .filter((a: any) => a.datum);
      gartenGeladen = true;
      merge();
    });

    return () => { u1(); u2(); };
  }, []);

  const markedDates: Record<string, any> = {};
  eintraege.forEach(e => {
    const calDatum = zuKalenderDatum(e.datum);
    if (!calDatum) return;
    const farbe = e.typ === 'garten' ? FARBEN.garten : FARBEN[e.person ?? ''] ?? '#999';
    if (!markedDates[calDatum]) markedDates[calDatum] = { dots: [] };
    markedDates[calDatum].dots.push({ color: farbe });
  });

  if (gewaehlt) {
    markedDates[gewaehlt] = {
      ...(markedDates[gewaehlt] ?? {}),
      selected: true,
      selectedColor: '#E3F2FD',
      selectedTextColor: '#000',
    };
  }

  const tagesEintraege = eintraege.filter(e => zuKalenderDatum(e.datum) === gewaehlt);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📅 Kalender</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 40 }} />
      ) : (
        <>
          <Calendar
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={day => setGewaehlt(day.dateString)}
            theme={{
              todayTextColor: '#2196F3',
              selectedDayBackgroundColor: '#E3F2FD',
              arrowColor: '#2196F3',
            }}
          />

          <View style={styles.legende}>
            {Object.entries(FARBEN).map(([name, farbe]) => (
              <View key={name} style={styles.legendeItem}>
                <View style={[styles.legendePunkt, { backgroundColor: farbe }]} />
                <Text style={styles.legendeText}>{name === 'garten' ? '🌱 Garten' : name}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.tagesTitle}>
            {gewaehlt ? gewaehlt.split('-').reverse().join('.') : ''}
          </Text>

          <ScrollView>
            {tagesEintraege.length === 0 ? (
              <Text style={styles.empty}>Keine Einträge für diesen Tag.</Text>
            ) : (
              tagesEintraege.map(e => {
                const farbe = e.typ === 'garten' ? FARBEN.garten : FARBEN[e.person ?? ''] ?? '#999';
                const name = e.typ === 'aufgabe' ? e.titel : e.pflanze;
                const sub = e.typ === 'aufgabe'
                  ? `${e.person ?? ''}${e.done ? ' ✅' : ''}`
                  : `${e.aufgabe ?? ''}${e.done ? ' ✅' : ''}`;
                return (
                  <View key={e.id} style={[styles.eintrag, { borderLeftColor: farbe }]}>
                    <Text style={styles.eintragTitel}>{name}</Text>
                    <Text style={styles.eintragSub}>{sub}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  legende: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'white' },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendePunkt: { width: 12, height: 12, borderRadius: 6 },
  legendeText: { fontSize: 13, color: '#444' },
  tagesTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  eintrag: { backgroundColor: 'white', borderRadius: 10, padding: 14, marginHorizontal: 16, marginBottom: 10, borderLeftWidth: 5 },
  eintragTitel: { fontSize: 15, fontWeight: 'bold' },
  eintragSub: { fontSize: 13, color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 24, fontSize: 15 },
});
