import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Native Variante: Export über das Teilen-Menü, Import über den Dateiauswahldialog.

export async function shareJson(fileName: string, json: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  await file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: fileName, UTI: 'public.json' });
}

/** Lässt eine Datei auswählen und liefert ihren Text, oder null bei Abbruch. */
export async function pickJsonText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (result.canceled || !result.assets[0]) return null;
  return new File(result.assets[0].uri).text();
}
