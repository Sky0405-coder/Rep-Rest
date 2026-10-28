# Rep & Rest

Plan und Architektur: [PLAN.md](PLAN.md)

## Struktur
```
apps/mobile            Expo-App (Android, iOS, Web → später Linux via Tauri)
  modules/workout-session  Natives Android-Modul: Töne und Countdown-Benachrichtigung bei gesperrtem Bildschirm
                           (die Töne in res/raw sind Kopien von assets/sounds, bei Änderungen beide ersetzen)
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
- Automatisches Redeploy: Repo-Secrets `COOLIFY_DEPLOY_URL` und `COOLIFY_TOKEN` (sind gesetzt).
  Ohne die beiden Secrets wird der Schritt übersprungen.

## Android-Releases
- Tag pushen, z. B. `git tag v0.1.0 && git push origin v0.1.0`. Dann baut
  `.github/workflows/android-release.yml` eine signierte APK und hängt sie an ein GitHub Release.
  Tags mit Bindestrich (`v0.2.0-beta.1`) werden als Pre-Release markiert.
- Manueller Testbuild ohne Release: Actions → „Android Release“ → „Run workflow“ (APK als Artefakt).
- **In-App-Updates:** Die Android-App fragt beim Start `releases/latest` auf GitHub ab, lädt eine neuere APK
  herunter und öffnet den Android-Installer. Für Play-Store-Builds mit `STORE_BUILD=1` bauen, dann ist das abgeschaltet.
- Signierschlüssel: Repo-Secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`.
  **Der Schlüssel darf nie verloren gehen**, sonst lassen sich installierte Apps nicht mehr updaten.
