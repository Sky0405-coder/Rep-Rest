import { z } from 'zod';

export const SUPPORTED_LOCALES = ['de', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Text in mehreren Sprachen. Mindestens eine Sprache muss gesetzt sein. */
export const LocalizedText = z
  .object({
    de: z.string().min(1).optional(),
    en: z.string().min(1).optional(),
  })
  .refine((t) => t.de !== undefined || t.en !== undefined, {
    message: 'Mindestens eine Sprache (de oder en) wird benötigt',
  });
export type LocalizedText = z.infer<typeof LocalizedText>;

/** Liefert den Text in der gewünschten Sprache, sonst in der ersten vorhandenen. */
export function localize(text: LocalizedText | undefined, locale: Locale): string {
  if (!text) return '';
  return text[locale] ?? text.de ?? text.en ?? '';
}
