import { SUPPORTED_LOCALES, type Locale } from '@workout/core';
import { getLocales } from 'expo-localization';
import i18n, { type TFunction } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import de from './de.json';
import en from './en.json';

export function systemLocale(): Locale {
  const code = getLocales()[0]?.languageCode;
  return (SUPPORTED_LOCALES as readonly string[]).includes(code ?? '') ? (code as Locale) : 'en';
}

// eslint-disable-next-line import/no-named-as-default-member
void i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: systemLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

/** Aktuelle Sprache für Inhalte (Übungsnamen etc.). */
export function useLocale(): Locale {
  const { i18n: instance } = useTranslation();
  return (instance.resolvedLanguage ?? 'en') as Locale;
}

export function formatDuration(seconds: number, t: TFunction): string {
  if (seconds < 60) return t('duration.seconds', { count: seconds });
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? t('duration.minutes', { count: m }) : t('duration.minutesSeconds', { m, s: String(s).padStart(2, '0') });
}

export default i18n;

/** Übersetzt einen Tag, unbekannte Tags bleiben wie sie sind. */
export function tagLabel(tag: string, t: TFunction): string {
  return t(`tags.${tag}`, { defaultValue: tag });
}

export function applyLanguage(setting: 'system' | Locale): void {
  const lng = setting === 'system' ? systemLocale() : setting;
  // eslint-disable-next-line import/no-named-as-default-member
  if (i18n.language !== lng) void i18n.changeLanguage(lng);
}

/** 754 → "12:34" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
