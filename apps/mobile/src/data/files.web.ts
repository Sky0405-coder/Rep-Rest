import * as DocumentPicker from 'expo-document-picker';

// Web-Variante: Export als Download, Import über die Dateiauswahl des Browsers.

export async function shareJson(fileName: string, json: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function pickJsonText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  return asset.file ? asset.file.text() : (await fetch(asset.uri)).text();
}
