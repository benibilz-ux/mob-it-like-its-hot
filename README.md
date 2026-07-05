# Mob it like it's hot 🏠

Haushalts-App für Benni & Leni — gebaut mit Expo / React Native und Firebase Firestore.

## Features (v1.0)

### Startbildschirm
- Begrüßung nach Tageszeit und Datum
- Offene Aufgaben-Zähler (nur fällige und überfällige Aufgaben) mit Benni/Leni-Aufteilung
- Dankbarkeits-Kachel — wöchentlicher gemeinsamer Text, Echtzeit-Sync via Firestore
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

---

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

---

## Installation & Verteilung

### Benni (Android)
Die App ist als APK installiert. Kein laufender PC nötig — direkt starten.

Bei einem Update: siehe Abschnitt "Update einspielen" unten.

### Leni (iPhone)
Leni nutzt **Expo Go** (kostenlose App aus dem App Store).

**Einmalige Einrichtung:**
1. Expo Go aus dem App Store installieren
2. In Expo Go mit dem Expo-Account `benjito00` einloggen
3. Projekt öffnen: QR-Code auf expo.dev scannen oder Link `exp://u.expo.dev/e254d9f6-e62a-4366-8127-5a81e442ab2c?channel-name=production` verwenden
4. Expo Go merkt sich das Projekt — beim nächsten Mal reicht ein Tap

**Hinweis:** Leni muss Expo Go öffnen und das Projekt antippen — ein direktes Homescreen-Icon ist ohne Apple Developer Account (99 €/Jahr) nicht möglich.

---

## Entwicklung starten (Dev-Modus)

```bash
npm install
npx expo start --tunnel
```

> `--tunnel` ist erforderlich, weil LAN-Verbindung im Heimnetz nicht funktioniert (ngrok-Tunnel).
> Falls ngrok beim ersten Versuch ein Timeout meldet: kurz warten und erneut starten.
> Falls Port 8081 belegt ist: Expo fragt automatisch nach Port 8082 → Y bestätigen.

---

## Update einspielen

Wenn Code-Änderungen fertig sind, in dieser Reihenfolge vorgehen:

### Schritt 1 — Änderungen committen und pushen
```bash
git add <geänderte Dateien>
git commit -m "Beschreibung der Änderung"
git push origin main
```

### Schritt 2 — Leni (iPhone/Expo Go) sofort updaten
```bash
eas update --branch production --message "Kurze Beschreibung"
```
→ Leni bekommt das Update automatisch beim nächsten Öffnen der App in Expo Go.

### Schritt 3 — Benni (Android APK) updaten
Nur nötig wenn sich native Teile geändert haben (selten). Bei reinen Code-Änderungen reicht Schritt 2 auch für Android.

```bash
eas build -p android --profile preview
```
→ Download-Link erscheint im Terminal oder auf expo.dev → APK auf dem Handy installieren.

> **Wann braucht man einen neuen APK-Build?**
> Nur wenn neue native Packages installiert wurden (z.B. `npx expo install xyz`).
> Normale Code-Änderungen (Screens, Logik, Design) werden per `eas update` eingespielt — kein neuer Build nötig.

---

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
eas.json               # EAS Build-Profile (preview → APK, production → AAB)
```

## Firebase

Das Projekt verwendet Firebase Firestore (`haushaltsapp-6bcf9`).  
Collections: `aufgaben`, `gartenkalender`, `einkaufsliste`, `essensliste`, `einstellungen`

Die Firebase-Konfiguration liegt in `lib/firebase.ts` (nicht in `.gitignore`, da keine sensitiven Secrets — nur öffentliche App-Config).

## Expo / EAS

- Expo-Account: `benjito00`
- Projekt-ID: `e254d9f6-e62a-4366-8127-5a81e442ab2c`
- EAS Dashboard: https://expo.dev/accounts/benjito00/projects/HaushaltsApp
- Android Package: `com.benibilz.haushaltsapp`
- EAS Update Branch: `production`
