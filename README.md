# Rep & Rest

Plan und Architektur: [PLAN.md](PLAN.md)

## Struktur
```
apps/mobile            Expo-App (Android, iOS, Web → später Linux via Tauri)
packages/core          Datenmodell (Zod), Import/Export, Workout-Engine (Timeline + Player)
packages/sport-packs   Mitgelieferte Übungen und Workouts pro Sportart
scripts/               Hilfsskripte (Android-Umgebung, Emulator)
```

## Voraussetzungen
- Node 22, pnpm 10
- Android SDK unter `~/Android/Sdk`, JDK 17 unter `~/.local/lib/jdk-17`
  (andere Pfade über `ANDROID_HOME` bzw. `WORKOUT_JAVA_HOME`)

## Befehle
```sh
pnpm install          # Abhängigkeiten
pnpm android          # Emulator starten (falls nötig), App bauen und installieren
pnpm mobile           # nur Metro starten (App ist schon installiert)
pnpm web              # Web-Version im Browser
pnpm test             # Tests aller Pakete
pnpm typecheck        # Typprüfung aller Pakete
pnpm lint             # Lint
```

Die Ordner `apps/mobile/android` und `apps/mobile/ios` werden generiert (`expo prebuild`)
und nicht von Hand bearbeitet. Native Einstellungen gehören in `apps/mobile/app.json`.

## Build & Deployment
- **CI** (`.github/workflows/ci.yml`): Tests, Typprüfung und Lint bei jedem Push und PR.
- Bei Push auf `main` wird die Web-Version als Image gebaut und nach
  `ghcr.io/sky0405-coder/rep-rest-web` gepusht (`latest` und Commit-SHA).
- **Coolify**: [`deploy/docker-compose.yml`](deploy/docker-compose.yml) als Docker-Compose-Ressource
  eintragen. Der Container läuft auf dem Server unter Port `WEB_PORT` (Standard `8093`).
  Cloudflare Tunnel: Public Hostname `represt.k-node.de` → `http://localhost:8093`.
- Automatisches Redeploy: Repo-Secrets `COOLIFY_WEBHOOK` und `COOLIFY_TOKEN` setzen.
  Ohne die beiden Secrets wird der Schritt übersprungen.
