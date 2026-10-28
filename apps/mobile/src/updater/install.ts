import { Directory, File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';

const FLAG_GRANT_READ_URI_PERMISSION = 1;
const APK_MIME = 'application/vnd.android.package-archive';

function updatesDir(): Directory {
  const dir = new Directory(Paths.cache, 'updates');
  if (!dir.exists) dir.create();
  return dir;
}

/**
 * Lädt die APK in den Cache. Ein vollständiger Download derselben Version wird
 * wiederverwendet, z. B. wenn Android vor der Installation erst nach der Erlaubnis fragt.
 */
export async function downloadApk(
  url: string,
  version: string,
  sizeBytes: number,
  onProgress: (fraction: number) => void,
): Promise<File> {
  const dir = updatesDir();
  const target = new File(dir, `rep-rest-${version}.apk`);
  if (target.exists && target.size === sizeBytes) return target;
  for (const entry of dir.list()) entry.delete();
  const task = File.createDownloadTask(url, target, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0) onProgress(bytesWritten / totalBytes);
    },
  });
  const file = await task.downloadAsync();
  if (!file) throw new Error('Download abgebrochen');
  return file;
}

/** Öffnet den Android-Installer. Beim ersten Mal fragt Android nach der Erlaubnis für "Unbekannte Apps". */
export async function openInstaller(apk: File): Promise<void> {
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: apk.contentUri,
    type: APK_MIME,
    flags: FLAG_GRANT_READ_URI_PERMISSION,
  });
}
