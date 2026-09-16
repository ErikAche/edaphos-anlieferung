# EDAPHOS Anlieferung – Roadmap

Stand: 2026-09-16. Entstanden aus einer Repo-/Security-Review plus einem "Grillme"-Gespräch zur langfristigen Richtung. Wird bei Bedarf fortgeschrieben, nicht bei jeder Kleinigkeit.

## Aktuelle Priorität: Startphase bei EDAPHOS sauber durchziehen

Kurzfristig zählt nur: das System, das gerade live bei Rosi/EDAPHOS im Einsatz ist, so sicher und funktionsfähig wie möglich machen. Multi-Mandanten-Ausbau und Geschäftsfragen (siehe unten) sind bewusst zurückgestellt, bis diese Phase steht.

### Security-Fahrplan (separate, einzeln deploybare Schritte)

1. ✅ **Next.js 16.2.12 → 16.3.5** (2026-09-16, erledigt) — behob die kritische, unauthentifizierte RCE-Lücke, die auch per Hostinger-Vulnerability-Scan gemeldet wurde. Lokal getestet (Wizard-Anlieferung, `/qr`, Admin-Login-Redirect), dann deployed.
2. ✅ **Rate-Limiting** (2026-09-16, erledigt) auf der öffentlichen Anlieferungs-Route — Postgres-basiert über neue Tabelle `delivery_rate_limit` + `SECURITY DEFINER`-Funktion `check_delivery_rate_limit(ip)`, Schwelle 5 Anlieferungen/Stunde + 15/Tag je IP, aufgerufen ganz am Anfang von `submitDelivery()` (`src/lib/actions/deliveries.ts`) noch vor Unterschrift-Upload und Insert. Tabelle ist komplett gegen direkten Zugriff verriegelt (RLS ohne Policies, nur über die Funktion erreichbar), tägliche Bereinigung via `pg_cron` (2 Tage Aufbewahrung). Verifiziert direkt über die anon-REST-API (gleicher Weg wie die App).
3. **Supabase-Härtung** (ein Schritt): Datei-Größen-/MIME-Type-Constraint auf dem `signatures`-Storage-Bucket (aktuell kann anonym jede Datei hochgeladen werden, nur clientseitig auf PNG geprüft), Leaked-Password-Protection in Supabase Auth aktivieren (aktuell deaktiviert, prüft Admin-Passwörter nicht gegen HaveIBeenPwned). **Noch offen.**
4. ✅ **`npm audit fix`** (2026-09-16, teilweise erledigt) — brace-expansion und nanoid gepatcht. Bewusst NICHT gefixt: die uuid/exceljs-Meldung (moderat) — der einzige Fix-Pfad wäre ein Downgrade von exceljs 4.4.0 auf 3.4.0 (andere API, würde den aktiv genutzten Excel-Export vermutlich brechen), für eine intern verwendete ID-Bibliothek ohne Kontakt zu Nutzereingaben. Akzeptiertes Restrisiko. `pg_net`-Extension aus dem `public`-Schema verschieben ist weiterhin offen (niedrige Priorität).

Geprüft und für unkritisch befunden: RLS-Policies auf allen Tabellen sind sauber (anonym nur `INSERT` auf `deliveries`, alles andere admin-only), `is_admin()` ist zwar laut Security Advisor als `SECURITY DEFINER` auffällig, gibt aber nur ein Bool über den aufrufenden User selbst zurück — kein echtes Datenleck.

### Sonstige offene Punkte (kein aktiver Task, nur festgehalten)

- **Excel-Export-Anpassung**: wartet auf eine Beispiel-Excel-Datei (von wem auch immer die Abrechnung erhält), um das aktuelle Export-Format entsprechend anzupassen. Nichts zu tun, bis die Datei da ist.
- **Dark-Mode-Bug behoben** (2026-09-16): Theme ging bei Reload/Navigation verloren, weil `ThemeToggle` den gespeicherten Zustand nur einmal beim ersten Mount aus dem DOM las, statt ihn aktiv zu setzen. Fix: liest jetzt direkt aus `localStorage` und wendet das Theme per `useLayoutEffect` bei jedem Mount erneut an. Noch nicht live-verifiziert (kein Admin-Zugriff für Claude) — vom User nach Deploy gegenzuchecken.

## Zurückgestellt: Multi-Mandanten-Vision

Reine Vision aktuell, kein konkreter zweiter Kompostierer in Sicht. Bewusst nicht vorab-architekturiert, um nicht auf Verdacht die falsche Flexibilität einzubauen, bevor echte Anforderungen eines zweiten Kunden bekannt sind.

Falls/wenn es konkret wird, wäre das eine grundlegende Architekturänderung, kein inkrementelles Feature:
- Aktuell ist alles single-tenant: eine feste Bezirk/Gemeinde-Liste, eine `settings`-Zeile, `admin_users` ohne Mandanten-Bezug, RLS-Policies prüfen nur global `is_admin()` — jeder Admin sieht aktuell ausnahmslos alle Lieferungen.
- Für echte Mandantentrennung bräuchte es (grob): eine `facilities`/`tenants`-Tabelle, `tenant_id`-Spalten auf `districts`/`municipalities`/`deliveries`/`settings`/`admin_users`, RLS-Policies die zusätzlich auf `tenant_id` scopen, pro Mandant eigenes Branding (Logo/Farben — siehe aktuelles EDAPHOS-Grün/Orange-Schema als Präzedenzfall für Theming), eigene Rechnungs-E-Mail/Resend-Key pro Mandant (Grundgerüst dafür existiert schon in `settings`, müsste aber mandantenscoped werden), eigene QR-Code-URL/Subdomain pro Anlage.
- Entscheidung zur DB-Architektur (eine DB mit `tenant_id`+RLS vs. separate Supabase-Projekte pro Kunde) noch offen — erst relevant, wenn ein echter zweiter Kunde ansteht.

## Zurückgestellt: Geschäftliche/rechtliche Seite einer Kommerzialisierung

Ebenfalls Zukunftsthema, hier nur als Orientierung festgehalten (**keine Rechts-/Steuerberatung** — vor jeder tatsächlichen Anmeldung WKO-Gründerservice oder Steuerberater konsultieren, die Erstberatung beim WKO-Gründerservice ist kostenlos).

**Ausgangslage:** Bestehendes Kleingewerbe für Coaching/Fitnesskonzeptentwicklung. Falls das Anlieferungssystem später an andere Kompostierer verkauft/lizenziert werden soll, ist das gewerberechtlich eine andere Tätigkeit als Coaching.

**Was recherchiert wurde:**
- Softwareentwicklung/IT-Dienstleistungen fallen in Österreich unter das **freie Gewerbe** "Dienstleistungen in der automatischen Datenverarbeitung und Informationstechnik" (§153 GewO 1994) — kein Befähigungsnachweis nötig, Anmeldung übers Gewerbeanmeldeservice der WKO oder online bei der zuständigen Bezirksverwaltungsbehörde. ([JUSLINE §153 GewO](https://www.jusline.at/gesetz/gewo/paragraf/153), [WKO IT-Dienstleistung Unternehmensgründung](https://www.wko.at/information-consulting/unternehmensberatung-buchhaltung-informationstechnologie/it-dienstleistung/unternehmensgruendung))
- Das ist ein **eigenes, zusätzliches Gewerbe** neben dem bestehenden Coaching-Gewerbe — kein automatischer "das läuft einfach mit". Als Einzelunternehmer kann man aber mehrere Gewerbe gleichzeitig anmelden/halten. ([WKO Gewerbearten](https://www.wko.at/gruendung/gewerbearten))
- **Kosten:** Die Anmeldung selbst ist seit der Verwaltungsreform gebührenfrei. Laufend: SVS-Mindestbeitrag (~€160/Monat) + WKO-Grundumlage (~€85–150/Jahr) — das zahlt er für sein bestehendes Gewerbe aber vermutlich schon; ob ein zweites Gewerbe die WKO-Grundumlage zusätzlich erhöht, war in der Recherche nicht eindeutig zu klären — das ist explizit eine der Fragen für die WKO-Erstberatung.
- **Sozialversicherung:** Ein zusätzliches Gewerbe löst laut SVS nicht automatisch eine zweite/getrennte Pflichtversicherung aus — Einnahmen aus beiden Tätigkeiten werden für die SVS gemeinsam betrachtet (eine Person, eine Beitragsgrundlage). Relevante Schwellen für 2026: Versicherungsgrenze für gewerbliche Einzelunternehmer bei ca. €6.613,20 Einkommen bzw. €55.000 Umsatz. ([SVS Unternehmensgründung](https://www.svs.at/cdscontent/?contentid=10007.816607))

**Offene Fragen für die WKO-Erstberatung, wenn es konkret wird:**
- Deckt das bestehende Coaching-Gewerbe eventuell schon "Beratungsleistungen" ab, die eng genug sind, oder braucht es zwingend das zusätzliche IT-Gewerbe?
- Wie wirkt sich ein zweites Gewerbe auf die WKO-Grundumlage konkret aus?
- Wie sollte die Abrechnung/Rechnungsstellung an andere Kompostierer strukturiert werden (Lizenzmodell vs. Dienstleistung vs. SaaS-Abo) — das beeinflusst auch die gewerberechtliche Einordnung.
- Kleinunternehmerregelung (USt-Befreiung) — gemeinsamer Umsatz aus beiden Tätigkeiten zählt zusammen für die Umsatzgrenze, relevant sobald zweites Standbein Umsatz macht.

Sources:
- [§ 153 GewO 1994 – JUSLINE](https://www.jusline.at/gesetz/gewo/paragraf/153)
- [WKO: Unternehmensgründung für Informationstechnologen](https://www.wko.at/information-consulting/unternehmensberatung-buchhaltung-informationstechnologie/it-dienstleistung/unternehmensgruendung)
- [WKO: Arten von Gewerben](https://www.wko.at/gruendung/gewerbearten)
- [SVS: Unternehmensgründung mit Gewerbeschein](https://www.svs.at/cdscontent/?contentid=10007.816607)
