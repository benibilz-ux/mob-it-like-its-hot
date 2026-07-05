# Firebase einrichten

## Schritt 1 — Firebase-Projekt erstellen

1. Gehe zu https://console.firebase.google.com
2. Klicke auf **"Projekt hinzufügen"**
3. Projektname: z.B. `haushaltsapp` → Weiter → Projekt erstellen

## Schritt 2 — Web-App registrieren

1. Im Firebase-Dashboard auf das **`</>`** Symbol klicken ("Web-App hinzufügen")
2. App-Spitzname: z.B. `HaushaltsApp` → **"App registrieren"**
3. Du siehst jetzt ein `firebaseConfig`-Objekt — das brauchst du im nächsten Schritt

## Schritt 3 — Konfiguration eintragen

Öffne die Datei `lib/firebase.ts` und ersetze die Platzhalterwerte mit deinen echten Werten:

```ts
const firebaseConfig = {
  apiKey: 'AIzaSy...',           // dein apiKey
  authDomain: 'meinprojekt.firebaseapp.com',
  projectId: 'meinprojekt',
  storageBucket: 'meinprojekt.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc...',
};
```

## Schritt 4 — Firestore-Datenbank erstellen

1. Im Firebase-Dashboard links auf **"Firestore Database"** klicken
2. **"Datenbank erstellen"** → **"Im Testmodus starten"** (für den Anfang OK)
3. Standort wählen: `europe-west3` (Frankfurt) → Fertig

## Schritt 5 — App neu starten

```
npx expo start --tunnel
```

Die App verbindet sich jetzt mit Firebase. Daten die du auf einem Handy eingibst, erscheinen sofort auf dem anderen!
