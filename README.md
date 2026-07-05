# Mob it like it's hot 🏠

Haushalts-App für Benni & Leni — gebaut mit Expo / React Native und Firebase Firestore.

## Features (v1.0)

### Startbildschirm
- Begrüßung nach Tageszeit und Datum
- Offene Aufgaben-Zähler (nur fällige und überfällige Aufgaben) mit Benni/Leni-Aufteilung
- Dankbarkeits-Kachel — wöchentlicher gemeinsamer Text, Echtzeit-sync via Firestore
- Schnell-Eingabe für Einkaufsliste und Essensliste (Bottom-Sheet-Modal)

### Food
- Einkaufsliste und Essensliste in einem Tab (Toggle)
- Einträge abhaken und löschen
- Echtzeit-Sync auf beiden Handys

### Aufgaben
- Haushalt- und Garten-Aufgaben (Toggle)
- Zuweisung an Benni, Leni oder Beide
- Fälligkeitsdatum und wiederkehrende Aufgaben (wöchentlich, 2-wöchentlich, monatlich)
- Erledigte Aufgaben werden automatisch archiviert; wiederkehrende Aufgaben erzeugen beim Abhaken einen neuen Eintrag

### POWERHOUR-Roulette
- Aufgaben-Pool frei befüllbar
- Rad drehen → zufällige Aufgabe wird zufälliger Person (B/L) zugelost
- Zugeloste Aufgaben wandern aus dem Topf in die "Zugelost"-Liste
- Zuweisung per Klick auf das Personen-Icon wieder auflösbar

### Kalender
- Monatsansicht mit farbigen Punktmarkierungen (Benni, Leni, Beide, Garten)
- Tag antippen → Tagesansicht aller Einträge

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Expo (SDK 54, managed workflow) |
| Navigation | expo-router (file-based) |
| Datenbank | Firebase Firestore (Echtzeit-Sync) |
| UI | React Native (kein Expo UI Kitten, keine externen Komponentenlibs) |
| Kalender | react-native-calendars |
| Icons | @expo/vector-icons (MaterialIcons) |

## Design

Minimalistisches Apple-inspiriertes Design mit eigenem Token-System (`constants/theme.ts`):

| Token | Wert |
|---|---|
| `T.bg` | `#F5F1E8` (Beige) |
| `T.surface` | `#FDFCF9` (Weiß) |
| `T.ink` | `#26251F` (Fast-Schwarz) |
| `T.accent` | `#2A46D6` (Royal Blue) |
| `T.muted` | `rgba(38,37,31,0.55)` |
| `T.hairline` | `rgba(38,37,31,0.16)` |

## Entwicklung starten

```bash
npm install
npx expo start --tunnel
```

> `--tunnel` ist erforderlich, weil LAN-Verbindung im Heimnetz nicht funktioniert (ngrok-Tunnel).
> Falls ngrok beim ersten Versuch ein Timeout meldet: kurz warten und erneut starten.

QR-Code mit Expo Go (Android) scannen.

## Projektstruktur

```
app/
  (tabs)/
    index.tsx          # Startbildschirm
    einkaufsliste.tsx  # Food (Einkaufsliste + Essensliste)
    aufgaben.tsx       # Aufgaben (Haushalt + Garten)
    roulette.tsx       # POWERHOUR-Roulette
    kalender.tsx       # Kalender
    _layout.tsx        # Tab-Navigation
constants/
  theme.ts             # Design-Tokens (T, Fonts, Colors)
lib/
  firebase.ts          # Firebase-Konfiguration
components/
  ui/
    icon-symbol.tsx    # SF Symbols → MaterialIcons Mapping
```

## Firebase

Das Projekt verwendet Firebase Firestore (`haushaltsapp-6bcf9`).  
Collections: `aufgaben`, `gartenkalender`, `einkaufsliste`, `essensliste`, `einstellungen`

Die Firebase-Konfiguration liegt in `lib/firebase.ts` (nicht in `.gitignore`, da keine sensitiven Secrets — nur öffentliche App-Config).
