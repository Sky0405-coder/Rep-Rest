import type { File } from 'expo-file-system';

// Im Web gibt es keine APK-Installation; die Web-Version aktualisiert sich beim Neuladen.
export async function downloadApk(): Promise<File> {
  throw new Error('Nicht unterstützt');
}

export async function openInstaller(): Promise<void> {
  throw new Error('Nicht unterstützt');
}
