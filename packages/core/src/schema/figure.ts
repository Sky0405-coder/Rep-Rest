import { z } from 'zod';

/** Gelenke der Strichfigur. Koordinaten liegen in einem 100×100-Feld, Boden bei y≈94. */
export const JOINTS = [
  'head',
  'neck',
  'hip',
  'lElbow',
  'lHand',
  'rElbow',
  'rHand',
  'lKnee',
  'lFoot',
  'rKnee',
  'rFoot',
] as const;
export type Joint = (typeof JOINTS)[number];

const Point = z.tuple([z.number().min(-20).max(120), z.number().min(-20).max(120)]);
export type Point = z.infer<typeof Point>;

export const Pose = z.object(Object.fromEntries(JOINTS.map((j) => [j, Point])) as Record<Joint, typeof Point>);
export type Pose = z.infer<typeof Pose>;

/** Linie für Hilfsobjekte wie Wand, Bank oder Board: [x1, y1, x2, y2]. */
const PropLine = z.tuple([z.number(), z.number(), z.number(), z.number()]);

export const Figure = z.object({
  /** Eine Pose = Standbild, mehrere = Animation reihum. */
  frames: z.array(Pose).min(1).max(8),
  /** Dauer eines kompletten Durchlaufs in Sekunden. */
  period: z.number().positive().max(10).default(1.6),
  props: z.array(PropLine).default([]),
});
export type Figure = z.infer<typeof Figure>;

/** Lineare Interpolation zwischen zwei Posen (t = 0..1). */
export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const out = {} as Pose;
  for (const j of JOINTS) out[j] = [a[j][0] + (b[j][0] - a[j][0]) * t, a[j][1] + (b[j][1] - a[j][1]) * t];
  return out;
}

/** Pose zum Zeitpunkt (Sekunden) mit weichem Übergang zwischen den Frames. */
export function poseAt(figure: Figure, seconds: number): Pose {
  const { frames, period } = figure;
  if (frames.length === 1) return frames[0]!;
  const pos = (((seconds % period) + period) % period) / period * frames.length;
  const i = Math.floor(pos);
  const raw = pos - i;
  // Kurz halten, dann weich überblenden: wirkt natürlicher als gleichmäßige Bewegung.
  const t = raw < 0.35 ? 0 : easeInOut((raw - 0.35) / 0.65);
  return lerpPose(frames[i]!, frames[(i + 1) % frames.length]!, t);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
