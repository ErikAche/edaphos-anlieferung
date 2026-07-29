# Deployment auf Hostinger

Die Datenbank (Supabase, Frankfurt) bleibt unverändert bestehen — hier geht es
nur darum, die Next.js-App (öffentlicher Wizard + Admin-Dashboard) auf
Hostinger zu hosten.

## 1. Hosting-Plan wählen

Node.js-Apps laufen bei Hostinger nur auf folgenden Plänen:

- **Business Web Hosting** oder **Web Apps Hosting** (verwaltet, empfohlen)
- Cloud Startup/Professional/Enterprise
- VPS (mehr Kontrolle, aber manuelle Einrichtung nötig)

**Empfehlung:** Web Apps Hosting (verwaltet) — beinhaltet üblicherweise eine
**kostenlose Domain für das erste Jahr**, automatisches SSL, und übernimmt
Build/Start der App automatisch. Für diese App (wenig Traffic, ein Tablet +
gelegentliche Smartphone-Zugriffe) reicht der kleinste Node.js-fähige Plan.

## 2. Domain

Wenn der gewählte Plan eine Gratis-Domain enthält, kannst du sie direkt beim
Hosting-Kauf mitbestellen — spart einen separaten Kauf. Vorschläge für den
Domainnamen (final von dir zu entscheiden):

- `edaphos.at`
- `edaphos-anlieferung.at`
- `anlieferung-edaphos.at`

## 3. App deployen

Zwei Wege, beide über das Hostinger hPanel unter **Websites → Add Website →
Node.js Apps**:

### Option A: GitHub-Integration (empfohlen, automatische Deploys bei jedem Push)

1. Falls noch nicht vorhanden: GitHub-Account anlegen, dieses Repository
   dorthin pushen (`git init`, `git add`, `git commit`, `git remote add
   origin ...`, `git push`).
2. In Hostinger: **Import Git Repository** wählen, GitHub autorisieren,
   Repository auswählen.
3. Build-Einstellungen (werden meist automatisch erkannt):
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
   - **Node-Version:** 20.x oder 22.x (LTS)
4. Umgebungsvariablen aus `.env.example` eintragen (siehe unten).
5. Deploy klicken.

### Option B: ZIP-Upload (falls kein GitHub gewünscht)

1. Lokal: `npm run build` ausführen.
2. Projektordner (ohne `node_modules`, `.next/cache`) als ZIP packen.
3. In Hostinger: **Upload** wählen, ZIP hochladen.
4. Gleiche Build-/Start-Commands und Umgebungsvariablen wie oben setzen.

## 4. Umgebungsvariablen (im Hostinger-Panel eintragen)

```
NEXT_PUBLIC_SUPABASE_URL=https://chddzvcjexposwxaodpe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_TfX31TAWQbCvaji0l5AgPQ_wD11Omc6
```

(Werte auch in `.env.example` hinterlegt — `.env.local` bleibt lokal und wird
nicht mit hochgeladen/committed.)

## 5. Nach dem ersten Deploy

- `https://<deine-domain>/` → öffentlicher Wizard (auf dem Tablet als
  Startseite einrichten)
- `https://<deine-domain>/qr` → QR-Code-Seite ausdrucken/aushängen
- `https://<deine-domain>/admin/login` → Admin-Login
- Admin-Passwort ändern (aktuell noch das anfangs gesetzte Passwort)
- Sobald die Domain aktiv ist: Domain bei **Resend** (resend.com → Domains)
  verifizieren, danach die Absenderadresse in der Supabase Edge Function
  `monthly-export` von `onboarding@resend.dev` auf z. B.
  `abrechnung@deine-domain.at` umstellen (aktuell funktioniert der
  automatische Mailversand nur im Resend-Testmodus an die eigene
  Resend-Account-Adresse).
