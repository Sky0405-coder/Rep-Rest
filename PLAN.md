# Rep & Rest – Plan

> **Name: Rep & Rest** · Slogan: **Drill & Destress** · Logo: **R²D²** (gestapelt, `design/logo.svg`;
> Icons neu erzeugen mit `python3 design/generate-icons.py`).
> Paket-ID: `de.knode.represt` (Android und iOS, nicht mehr ändern).

---

## 1. Ziele & Entscheidungen

| Thema | Entscheidung |
|---|---|
| Kern (P0) | Übungen mit Timer, kurzer Sound am Ende, Bild/Karikatur auf dem Screen |
| Kern (P0) | Workouts aus Bausteinen bauen, JSON-Import/-Export |
| Datenhaltung | **Offline first** mit Sync zum eigenen Server |
| Plattformen | **Android zuerst**, iOS bei jeder Entscheidung mitbedacht, **Linux** über Expo-Web + Tauri |
| Backend | **Eigenes TypeScript-Backend**, selbst gehostet auf **Coolify** |
| Updates | **Komplett selbst gehostet**: OTA-Server, APK-Update-Check, Tauri-Updater |
| Login | **E-Mail + Passwort** (weitere Methoden später) |
| Sprachen | **Deutsch + Englisch** von Anfang an |
| Verteilung | Zuerst Freunde (APK/AppImage), später eventuell Play Store / App Store |
| Sport-Packs | Allgemein, Apnoe & Atem, Surf, Surfskate, weitere später |

---

## 2. Tech-Stack

### App (`apps/mobile`)
| Bereich | Wahl |
|---|---|
| Framework | React Native + **Expo** (TypeScript), Expo Router |
| Ziele | Android (APK), iOS (später), Web-Build → **Tauri 2** für Linux (AppImage, .deb) |
| Lokale DB | SQLite (expo-sqlite, im Web als WASM/OPFS) + **Drizzle ORM** |
| State | Zustand, TanStack Query |
| Audio/Timer | expo-audio, expo-keep-awake, expo-notifications, expo-haptics, expo-speech (Sprachansage) |
| i18n | i18next + react-i18next, Inhalte als `{ de, en }` |
| Validierung | Zod (aus `packages/core`) |

Was ich früh testen muss: SQLite im Web-Build und die Audio-Latenz unter Tauri. Hintergrund-Audio bei gesperrtem Bildschirm gibt es nur auf Mobile, am Desktop wird es nicht gebraucht.

### Backend (`apps/server`)
| Bereich | Wahl |
|---|---|
| HTTP | **Hono** (Node), REST + OpenAPI |
| DB | **Postgres** + Drizzle (Migrations) |
| Auth | **Better Auth** (E-Mail + Passwort, Sessions/Tokens, erweiterbar auf Google/Apple/Magic Link) |
| Dateien | **MinIO** (S3-kompatibel) für Bilder, Videos, APKs, OTA-Bundles |
| Updates | Eigener Server nach dem **Expo-Updates-Protokoll** (Integration von expo-open-ota oder eigener Endpoint), dazu Endpoints für APK- und Tauri-Updates |
| Deploy | Docker-Compose in **Coolify**: `server`, `postgres`, `minio` |

### Monorepo (pnpm + Turborepo)
```
lineup/
  apps/
    mobile/        # Expo-App (Android, iOS, Web)
    desktop/       # Tauri-Hülle um den Web-Build
    server/        # Hono-API, Auth, Sync, Updates
    admin/         # Web-Admin (später, bis dahin Seed-Skripte)
  packages/
    core/          # Zod-Schemas, Typen, Workout-Engine, Sync-Protokoll (App + Server)
    sport-packs/   # general/, breath/, surf/, surfskate/ (JSON + Assets)
  docker-compose.yml
```
Vorteil: Schemas, Typen und Validierung gibt es nur einmal. App und Server können sich beim Format nicht widersprechen.

---

## 3. Datenmodell

### 3.1 Übung
```ts
Exercise {
  id: string                 // "general.pushup"
  sportPack: string          // "general" | "breath" | "surf" | "surfskate"
  name: LocalizedText        // { de: "Liegestütz", en: "Push-up" }
  description?: LocalizedText
  cues?: LocalizedText[]     // kurze Tipps: "Core anspannen"
  media: { image?: AssetRef; animation?: AssetRef; video?: AssetRef }
  tags: string[]             // "core", "balance", "paddeln", "mobility"
  equipment: string[]        // "none", "balanceboard", "surfskate", "band"
  defaults: { mode: "time" | "reps"; duration?: number; reps?: number }
  sides?: "both" | "left_right"
  safety?: LocalizedText     // z. B. bei Apnoe-Übungen
}
```

### 3.2 Bausteine
| Baustein | Bedeutung |
|---|---|
| `exercise` | Übung auf Zeit oder Wiederholungen (Weiter per Tap) |
| `rest` | Pause |
| `repeat` | Kinder N-mal (Runden), optional Pause zwischen den Runden |
| `group` | Abschnitt (Warm-up, Hauptteil, Cool-down) |
| `interval` | Kurzform Work/Rest × Runden (Tabata, EMOM) |
| `note` | Text-Screen ohne Timer |
| `breath_pattern` *(Pack breath)* | Atemrhythmus, z. B. 4-4-4-4 Box Breathing, mit animiertem Kreis |
| `breath_table` *(Pack breath)* | CO₂/O₂-Tabelle: Hold-/Atemzeiten pro Runde, auch relativ zur persönlichen Bestzeit |
| `max_hold` *(Pack breath)* | Static-Hold-Messung mit Stoppuhr, optional Kontraktionen per Tap |
| `session` *(Pack surfskate)* | Freie Session mit Intervall-Ansagen |

Pack-Bausteine werden per ID in der App registriert (Code liegt im Bundle). Unbekannte Bausteine zeigt die App als „nicht unterstützt“ an, statt abzustürzen.

### 3.3 JSON-Format (Import/Export)
```json
{
  "format": "lineup.workout",
  "version": 1,
  "workout": {
    "id": "b1f…",
    "name": { "de": "Pop-up Power 15", "en": "Pop-up Power 15" },
    "sportPack": "surf",
    "blocks": [
      { "type": "group", "name": { "de": "Aufwärmen", "en": "Warm-up" }, "blocks": [
        { "type": "exercise", "ref": "general.jumping_jacks", "duration": 45 }
      ]},
      { "type": "repeat", "times": 4, "restBetween": 60, "blocks": [
        { "type": "exercise", "ref": "surf.popup", "reps": 10 },
        { "type": "rest", "duration": 15 },
        { "type": "exercise", "ref": "surf.paddle_superman", "duration": 40 }
      ]}
    ]
  },
  "customExercises": []
}
```
Import per Datei, Share-Sheet, Zwischenablage, QR-Code oder Link. Die Validierung läuft über Zod und liefert verständliche Fehlermeldungen. Über `version` sind spätere Migrationen möglich.

---

## 4. Workout-Engine (`packages/core`)
1. **Flatten:** Block-Baum → lineare Timeline (Runden aufgelöst, links/rechts verdoppelt).
2. **State-Machine:** `countdown → work → rest → … → done`, mit Pause, Weiter, Zurück und +10 s.
3. **Zeitbasis:** Restzeit aus Zeitstempeln berechnen, nicht über Ticks. Dadurch kein Drift, auch nach Zeit im Hintergrund.
4. **Cues als Events:** Beeps bei 3-2-1, Gong am Ende, Vibration, Sprachansage. Die UI bzw. Plattform spielt sie ab.
5. Reines TypeScript ohne UI, vollständig mit Unit-Tests abgedeckt (Vitest).

---

## 5. Offline-first-Sync
- Jeder Datensatz hat: `id` (UUID, auf dem Client erzeugt), `updated_at`, `deleted` (Löschmarker), `owner_id`.
- Der Client schreibt immer lokal und merkt sich geänderte Datensätze in einer `outbox`.
- **Push:** `POST /sync/push` mit allen Änderungen aus der Outbox.
- **Pull:** `GET /sync/pull?since=<cursor>` liefert alles seit dem letzten Abgleich (eigene Daten und offizielle Inhalte).
- Konflikte: Last-Write-Wins pro Datensatz. Workouts sind Dokumente, deshalb reicht das.
- Auslöser: App-Start, App kommt in den Vordergrund, nach dem Speichern, Netz wieder da, manuell per Pull-to-Refresh.
- Ohne Account funktioniert alles lokal. Beim ersten Login werden die lokalen Daten zum Account hochgeladen.

---

## 6. Backend-Funktionen

| Feature | Beschreibung |
|---|---|
| Auth | Registrierung/Login mit E-Mail + Passwort, Passwort-Reset (SMTP nötig), **Account-Löschung** (Store-Pflicht) |
| Sync | wie in Abschnitt 5 |
| Katalog | Offizielle Übungen, Workouts und Programme, gepflegt per Seed-Skript, später im Admin |
| Sport-Packs | Versioniert vom Server, Inhalts-Updates ohne App-Update |
| Teilen | Workout als Link oder Code teilen, der Empfänger importiert es mit einem Tap |
| App-Config | Feature-Flags, Mindestversion, Ankündigungen |
| Updates | siehe Abschnitt 7 |

### Tabellen
```
users / sessions / accounts        (Better Auth)
profiles(id, display_name, locale, settings_json)
sport_packs(id, version, manifest_json, published)
exercises(id, sport_pack_id, owner_id NULL=offiziell, data_json, updated_at, deleted)
workouts(id, owner_id, sport_pack_id, data_json, visibility, updated_at, deleted)
programs(id, data_json, published)
activity_log(id, user_id, workout_id, started_at, duration, completed, extra_json, updated_at, deleted)
personal_records(id, user_id, kind, value, recorded_at)   -- z. B. Static-Hold-Bestzeit
shares(code, workout_id, created_by, expires_at)
app_config(key, value_json)
releases(platform, channel, version, runtime_version, url, sha256, notes, created_at)
```

---

## 7. Updates (selbst gehostet)

| Ebene | Mechanismus |
|---|---|
| **JS/UI (Android/iOS)** | `expo-updates` zeigt auf den eigenen Update-Server. Bundles liegen in MinIO, Channels `dev` / `beta` / `prod`, Code signiert |
| **Native APK (Android, Sideload)** | Die App fragt `GET /releases/android/latest`. Bei neuer Version: Download, SHA-256-Prüfung, Installation über den System-Installer. Für den späteren Play-Store-Build wird das abgeschaltet |
| **Linux (Tauri)** | Tauri-Updater-Plugin, Manifest vom eigenen Server, signiert |
| **Inhalte** | Sport-Packs und Katalog per Sync, versioniert |
| **Zwangs-Update** | `app_config.min_version`. Ist die installierte Version älter, kommt ein Hinweis „Bitte aktualisieren“ |

Builds: APK lokal oder in CI (GitHub Actions / Forgejo) mit `expo prebuild` + Gradle, also ohne EAS-Cloud. Ein Release-Skript lädt die Artefakte hoch und trägt sie in `releases` ein.

---

## 8. Sport-Packs

### Allgemein (`general`)
Basis für Kraft, Core, Mobility, Cardio und Dehnen. Etwa 40 Übungen zum Start, Seed aus **wger** (CC-BY-SA, Quellenangabe) plus eigene Bilder.

### Apnoe & Atem (`breath`)
- CO₂-Tabelle (Hold bleibt gleich, Atempause wird kürzer) und O₂-Tabelle (Hold wird länger), auf Wunsch aus der persönlichen Bestzeit erzeugt
- Static-Hold-Messung mit Bestzeit-Verlauf, Kontraktionen per Tap
- Box Breathing, 4-7-8, Coherent Breathing (5,5/5,5), Entspannungsatmung vor dem Hold
- Visualisierung: animierter Kreis für den Atemrhythmus, sanfte Töne statt Gong
- **Sicherheit:** Hinweis beim ersten Start, den man bestätigen muss. Nur an Land, nie im Wasser oder in der Badewanne, nie allein, keine Hyperventilation, nicht bei Herzproblemen oder in der Schwangerschaft.

### Surf (`surf`)
Paddel-Kraft und -Ausdauer, Pop-up-Drills, Balanceboard, Mobility (Schultern, Brustwirbelsäule, Hüfte), Schnellstart-Warm-up am Strand, Session-Log (Spot, Dauer, Board, Bewertung). Später eventuell Forecast-Infos.

### Surfskate (`surfskate`)
Drill-Karten (Pumpen, Bottom Turn, Cutback, Carve, Snap) mit GIF/Video und Cues, Session-Modus mit Intervall-Ansagen, Skill-Progressionen in Level 1–5, Off-Board-Training. Später eventuell ein Pump-Zähler über die Sensoren im Handy.

### Bilder
Einheitlicher Stil (SVG-Strichfigur, gleiche Farben und Perspektive). Fallback ohne Bild: Icon der Kategorie plus Name. Für den Store nur Bilder mit sauberer Lizenz.

---

## 9. Screens
Home · Bibliothek · Player · Builder · Import/Export · Verlauf & Bestzeiten · Einstellungen · Login/Account

Player: großes Bild, riesige Restzeit, „Als Nächstes“, Fortschrittsbalken, große Buttons (bedienbar mit nassen Händen und aus 2 m Abstand). Bei Atemübungen ersetzt der animierte Kreis das Bild.

---

## 10. Roadmap

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **0 – Setup** ✅ | Monorepo, Expo-App (Android + Web), `core` mit Zod-Schemas, Vitest, Lint, i18n-Grundgerüst | Grundgerüst läuft auf Android und im Browser |
| **1 – MVP lokal** ✅ | Engine + Player (Timer, Sounds, Bild), Pack `general`, Builder, JSON-Import/-Export, SQLite, Verlauf | **Persönlich nutzbar**, offline |
| **2 – Backend** | Hono + Postgres + Better Auth + MinIO auf Coolify, Login, Sync, Katalog, Teilen, Account-Löschung | Sync zwischen Geräten, Freunde können mitmachen |
| **3 – Updates & Linux** | Eigener OTA-Server, APK-Update-Check, Tauri-Linux-Build + Updater, Release-Skript | Verteilung an Freunde ohne Store |
| **4 – Breath-Pack** | Tabellen, Max-Hold, Atemmuster, Bestzeiten, Sicherheitshinweise | Apnoe-Training |
| **5 – Surf & Surfskate** | Packs, Drill-Karten, Session-Modus, Session-Log, Progressionen | Surf-Fokus |
| **6 – Store-Reife** | Datenschutz/Impressum, Bildlizenzen, Play-Store-Build, iOS + Apple-Login | Bereit für den Store |

---

## 11. Noch zu klären (später)
- SMTP-Server für Passwort-Reset (eigener Mailserver oder ein Dienst wie Brevo/Mailjet)
- Domain für die API (z. B. `api.lineup.k-node.de`?)
- Git-Hosting/CI: GitHub Actions oder eigenes Forgejo/Gitea auf Coolify?
