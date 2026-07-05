import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { T, Fonts } from '@/constants/theme';

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
  Benni:  '#2196F3',
  Leni:   '#E91E63',
  Beide:  '#9C27B0',
  Garten: '#8BC34A',
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

function formatDatum(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
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
    const farbe = e.typ === 'garten' ? FARBEN.Garten : FARBEN[e.person ?? ''] ?? '#999';
    if (!markedDates[calDatum]) markedDates[calDatum] = { dots: [] };
    markedDates[calDatum].dots.push({ color: farbe });
  });

  if (gewaehlt) {
    markedDates[gewaehlt] = {
      ...(markedDates[gewaehlt] ?? {}),
      selected: true,
      selectedColor: T.accent,
      selectedTextColor: T.surface,
    };
  }

  const tagesEintraege = eintraege.filter(e => zuKalenderDatum(e.datum) === gewaehlt);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Kalender</Text>

      {loading ? (
        <ActivityIndicator size="large" color={T.accent} style={{ marginTop: 40 }} />
      ) : (
        <>
          <Calendar
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={day => setGewaehlt(day.dateString)}
            theme={{
              calendarBackground: T.bg,
              backgroundColor: T.bg,
              textSectionTitleColor: T.muted,
              selectedDayBackgroundColor: T.accent,
              selectedDayTextColor: T.surface,
              todayTextColor: T.accent,
              dayTextColor: T.ink,
              textDisabledColor: T.hairline,
              dotColor: T.accent,
              monthTextColor: T.ink,
              arrowColor: T.accent,
              textMonthFontFamily: Fonts?.serif,
              textMonthFontStyle: 'italic',
              textMonthFontSize: 18,
              'stylesheet.calendar.header': {
                header: { borderBottomWidth: 0 },
              },
            } as any}
          />

          {/* Legend */}
          <View style={styles.legende}>
            {Object.entries(FARBEN).map(([name, farbe]) => (
              <View key={name} style={styles.legendeItem}>
                <View style={[styles.legendePunkt, { backgroundColor: farbe }]} />
                <Text style={styles.legendeText}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Divider + day label */}
          <View style={styles.tagesHeader}>
            <Text style={styles.tagesTitle}>{formatDatum(gewaehlt)}</Text>
            {tagesEintraege.length > 0 && (
              <Text style={styles.tagesCount}>{tagesEintraege.length} Einträge</Text>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.agendaContent}>
            {tagesEintraege.length === 0 ? (
              <Text style={styles.empty}>Keine Einträge für diesen Tag.</Text>
            ) : (
              tagesEintraege.map((e, i) => {
                const farbe = e.typ === 'garten' ? FARBEN.Garten : FARBEN[e.person ?? ''] ?? '#999';
                const name = e.typ === 'aufgabe' ? e.titel : e.pflanze;
                const sub = e.typ === 'aufgabe'
                  ? `${e.person ?? ''}${e.done ? ' · erledigt' : ''}`
                  : `${e.aufgabe ?? ''}${e.done ? ' · erledigt' : ''}`;
                return (
                  <View key={e.id} style={[styles.eintragRow, i < tagesEintraege.length - 1 && styles.eintragRowBorder]}>
                    <View style={[styles.eintragDot, { backgroundColor: farbe }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.eintragTitel, e.done && styles.eintragTitelDone]}>{name}</Text>
                      {!!sub && <Text style={styles.eintragSub}>{sub}</Text>}
                    </View>
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
  container: { flex: 1, backgroundColor: T.bg, paddingTop: 60 },
  header: { fontFamily: Fonts?.serif, fontStyle: 'italic', fontSize: 28, color: T.ink, paddingHorizontal: 24, marginBottom: 8 },

  legende: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1, borderTopColor: T.hairline },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendePunkt: { width: 10, height: 10, borderRadius: 5 },
  legendeText: { fontSize: 13, color: T.muted },

  tagesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6, borderTopWidth: 1, borderTopColor: T.hairline },
  tagesTitle: { fontSize: 15, fontWeight: '600', color: T.ink },
  tagesCount: { fontSize: 13, color: T.muted },

  agendaContent: { paddingHorizontal: 20, paddingBottom: 40 },
  eintragRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 14 },
  eintragRowBorder: { borderBottomWidth: 1, borderBottomColor: T.hairline },
  eintragDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  eintragTitel: { fontSize: 15, color: T.ink, fontWeight: '500' },
  eintragTitelDone: { textDecorationLine: 'line-through', color: T.muted, fontWeight: '400' },
  eintragSub: { fontSize: 13, color: T.muted, marginTop: 2 },
  empty: { textAlign: 'center', color: T.muted, marginTop: 40, fontSize: 15 },
});
