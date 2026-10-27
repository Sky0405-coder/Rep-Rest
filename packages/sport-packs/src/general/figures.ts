import type { Pose } from '@workout/core';

// Strichfiguren für das Pack "Allgemein". Feld 100×100, Boden bei y=94.
// Frontansicht: l* = Bildschirm links. Seitenansicht: Blick nach rechts.

type FigureInput = { frames: Pose[]; period?: number; props?: [number, number, number, number][] };

const FRONT: Pose = {
  head: [50, 15], neck: [50, 26], hip: [50, 54],
  lElbow: [43, 40], lHand: [41, 53], rElbow: [57, 40], rHand: [59, 53],
  lKnee: [46, 74], lFoot: [45, 94], rKnee: [54, 74], rFoot: [55, 94],
};

const SIDE: Pose = {
  head: [51, 15], neck: [50, 26], hip: [50, 54],
  lElbow: [48, 40], lHand: [51, 53], rElbow: [52, 40], rHand: [55, 52],
  lKnee: [49, 74], lFoot: [48, 94], rKnee: [51, 74], rFoot: [52, 94],
};

/** Vierfüßlerstand, Seitenansicht. */
const QUADRUPED: Pose = {
  head: [80, 56], neck: [70, 62], hip: [36, 62],
  lElbow: [69, 77], lHand: [70, 92], rElbow: [71, 77], rHand: [72, 92],
  lKnee: [35, 92], lFoot: [15, 93], rKnee: [37, 92], rFoot: [17, 93],
};

/** Hoher Stütz (Liegestütz oben), Seitenansicht. */
const HIGH_PLANK: Pose = {
  head: [80, 52], neck: [72, 57], hip: [43, 72],
  lElbow: [71, 74], lHand: [72, 92], rElbow: [73, 74], rHand: [74, 92],
  lKnee: [28, 82], lFoot: [13, 92], rKnee: [29, 82], rFoot: [14, 92],
};

const p = (base: Pose, o: Partial<Pose>): Pose => ({ ...base, ...o });

export const generalFigures: Record<string, FigureInput> = {
  'general.jumping_jacks': {
    period: 1,
    frames: [
      FRONT,
      p(FRONT, {
        lElbow: [37, 18], lHand: [32, 5], rElbow: [63, 18], rHand: [68, 5],
        lKnee: [41, 74], lFoot: [35, 94], rKnee: [59, 74], rFoot: [65, 94],
      }),
    ],
  },
  'general.squat': {
    period: 2.2,
    frames: [
      p(SIDE, { lElbow: [60, 32], lHand: [72, 32], rElbow: [61, 34], rHand: [73, 34] }),
      {
        head: [55, 38], neck: [51, 47], hip: [34, 70],
        lElbow: [62, 50], lHand: [75, 50], rElbow: [63, 52], rHand: [76, 52],
        lKnee: [57, 73], lFoot: [52, 94], rKnee: [59, 74], rFoot: [54, 94],
      },
    ],
  },
  'general.pushup': {
    period: 2,
    frames: [
      HIGH_PLANK,
      p(HIGH_PLANK, {
        head: [81, 74], neck: [72, 79], hip: [43, 84],
        lElbow: [60, 80], rElbow: [62, 81], lKnee: [28, 88], rKnee: [29, 88],
      }),
    ],
  },
  'general.plank': {
    frames: [
      {
        head: [80, 69], neck: [71, 74], hip: [43, 80],
        lElbow: [70, 92], lHand: [86, 92], rElbow: [72, 92], rHand: [88, 92],
        lKnee: [28, 86], lFoot: [13, 92], rKnee: [29, 86], rFoot: [14, 92],
      },
    ],
  },
  'general.side_plank': {
    frames: [
      {
        head: [79, 49], neck: [70, 58], hip: [44, 75],
        lElbow: [72, 92], lHand: [86, 92], rElbow: [71, 43], rHand: [72, 28],
        lKnee: [29, 84], lFoot: [14, 92], rKnee: [29, 83], rFoot: [15, 90],
      },
    ],
  },
  'general.lunge': {
    period: 2.4,
    frames: [
      p(SIDE, { lElbow: [43, 44], lHand: [47, 54], rElbow: [44, 45], rHand: [48, 55] }),
      {
        head: [50, 30], neck: [49, 40], hip: [48, 66],
        lElbow: [42, 54], lHand: [46, 65], rElbow: [43, 55], rHand: [47, 66],
        lKnee: [66, 72], lFoot: [68, 94], rKnee: [38, 90], rFoot: [24, 93],
      },
    ],
  },
  'general.mountain_climbers': {
    period: 0.8,
    frames: [
      p(HIGH_PLANK, { lKnee: [60, 76], lFoot: [52, 88] }),
      p(HIGH_PLANK, { rKnee: [61, 76], rFoot: [53, 88] }),
    ],
  },
  'general.glute_bridge': {
    period: 2.2,
    frames: [
      {
        head: [16, 85], neck: [26, 88], hip: [50, 89],
        lElbow: [37, 92], lHand: [48, 92], rElbow: [38, 92], rHand: [49, 92],
        lKnee: [64, 70], lFoot: [70, 93], rKnee: [65, 71], rFoot: [71, 93],
      },
      {
        head: [16, 85], neck: [26, 88], hip: [48, 72],
        lElbow: [37, 92], lHand: [48, 92], rElbow: [38, 92], rHand: [49, 92],
        lKnee: [66, 66], lFoot: [70, 93], rKnee: [67, 67], rFoot: [71, 93],
      },
    ],
  },
  'general.superman': {
    period: 2.4,
    frames: [
      {
        head: [79, 87], neck: [70, 90], hip: [43, 91],
        lElbow: [81, 91], lHand: [93, 91], rElbow: [82, 91], rHand: [94, 91],
        lKnee: [28, 92], lFoot: [12, 92], rKnee: [28, 92], rFoot: [12, 92],
      },
      {
        head: [79, 77], neck: [70, 83], hip: [43, 90],
        lElbow: [81, 77], lHand: [93, 72], rElbow: [82, 78], rHand: [94, 73],
        lKnee: [28, 87], lFoot: [12, 82], rKnee: [28, 88], rFoot: [12, 83],
      },
    ],
  },
  'general.burpee': {
    period: 3.2,
    frames: [
      SIDE,
      {
        head: [62, 58], neck: [56, 64], hip: [40, 74],
        lElbow: [62, 78], lHand: [64, 92], rElbow: [63, 78], rHand: [65, 92],
        lKnee: [56, 80], lFoot: [46, 94], rKnee: [57, 81], rFoot: [47, 94],
      },
      HIGH_PLANK,
      p(SIDE, {
        head: [51, 7], neck: [50, 18], hip: [50, 46],
        lElbow: [50, 6], lHand: [52, -5], rElbow: [53, 7], rHand: [56, -4],
        lKnee: [49, 66], lFoot: [47, 84], rKnee: [51, 66], rFoot: [52, 84],
      }),
    ],
  },
  'general.high_knees': {
    period: 0.8,
    frames: [
      p(FRONT, { lKnee: [44, 58], lFoot: [45, 76], lElbow: [42, 36], lHand: [46, 26], rElbow: [58, 42], rHand: [60, 56] }),
      p(FRONT, { rKnee: [56, 58], rFoot: [55, 76], rElbow: [58, 36], rHand: [54, 26], lElbow: [42, 42], lHand: [40, 56] }),
    ],
  },
  'general.cat_cow': {
    period: 4,
    frames: [
      p(QUADRUPED, { head: [78, 70], neck: [70, 64], hip: [36, 60] }),
      p(QUADRUPED, { head: [82, 48], neck: [71, 60], hip: [36, 66] }),
    ],
  },
  'general.arm_circles': {
    period: 1.2,
    frames: [
      p(FRONT, { lElbow: [38, 26], lHand: [26, 25], rElbow: [62, 26], rHand: [74, 25] }),
      p(FRONT, { lElbow: [38, 22], lHand: [27, 16], rElbow: [62, 22], rHand: [73, 16] }),
      p(FRONT, { lElbow: [38, 26], lHand: [26, 25], rElbow: [62, 26], rHand: [74, 25] }),
      p(FRONT, { lElbow: [38, 30], lHand: [27, 36], rElbow: [62, 30], rHand: [73, 36] }),
    ],
  },
  'general.crunch': {
    period: 2,
    frames: [
      {
        head: [17, 87], neck: [27, 89], hip: [52, 90],
        lElbow: [19, 80], lHand: [15, 88], rElbow: [20, 81], rHand: [16, 89],
        lKnee: [64, 71], lFoot: [74, 93], rKnee: [65, 72], rFoot: [75, 93],
      },
      {
        head: [26, 70], neck: [33, 78], hip: [52, 90],
        lElbow: [31, 66], lHand: [24, 72], rElbow: [32, 67], rHand: [25, 73],
        lKnee: [64, 71], lFoot: [74, 93], rKnee: [65, 72], rFoot: [75, 93],
      },
    ],
  },
  'general.wall_sit': {
    props: [[30, 6, 30, 94]],
    frames: [
      {
        head: [37, 31], neck: [35, 42], hip: [36, 68],
        lElbow: [44, 56], lHand: [55, 64], rElbow: [45, 57], rHand: [56, 65],
        lKnee: [61, 67], lFoot: [61, 94], rKnee: [63, 68], rFoot: [63, 94],
      },
    ],
  },
  'general.calf_raise': {
    period: 1.6,
    frames: [
      SIDE,
      p(SIDE, {
        head: [51, 10], neck: [50, 21], hip: [50, 49],
        lElbow: [48, 35], lHand: [51, 48], rElbow: [52, 35], rHand: [55, 47],
        lKnee: [49, 69], lFoot: [50, 90], rKnee: [51, 69], rFoot: [54, 90],
      }),
    ],
  },
  'general.bird_dog': {
    period: 3,
    frames: [
      QUADRUPED,
      p(QUADRUPED, { rElbow: [82, 60], rHand: [94, 58], lKnee: [20, 64], lFoot: [4, 62] }),
    ],
  },
  'general.side_lunge': {
    period: 2.4,
    frames: [
      p(FRONT, { lElbow: [44, 42], lHand: [49, 50], rElbow: [56, 42], rHand: [51, 50], lFoot: [36, 94], rFoot: [64, 94], lKnee: [41, 74], rKnee: [59, 74] }),
      {
        head: [38, 33], neck: [39, 44], hip: [42, 68],
        lElbow: [36, 54], lHand: [42, 60], rElbow: [46, 54], rHand: [44, 61],
        lKnee: [28, 76], lFoot: [26, 94], rKnee: [58, 81], rFoot: [72, 94],
      },
    ],
  },
  'general.skater_jumps': {
    period: 1.4,
    frames: [
      {
        head: [36, 24], neck: [37, 34], hip: [38, 60],
        lElbow: [28, 44], lHand: [22, 52], rElbow: [46, 40], rHand: [52, 48],
        lKnee: [36, 77], lFoot: [36, 94], rKnee: [48, 76], rFoot: [24, 88],
      },
      {
        head: [64, 24], neck: [63, 34], hip: [62, 60],
        lElbow: [54, 40], lHand: [48, 48], rElbow: [72, 44], rHand: [78, 52],
        lKnee: [52, 76], lFoot: [76, 88], rKnee: [64, 77], rFoot: [64, 94],
      },
    ],
  },
  'general.hip_circles': {
    period: 2.4,
    frames: [
      p(FRONT, { hip: [44, 54], lElbow: [44, 42], lHand: [44, 54], rElbow: [56, 42], rHand: [56, 54], lKnee: [43, 74], rKnee: [52, 74] }),
      p(FRONT, { hip: [56, 54], lElbow: [44, 42], lHand: [44, 54], rElbow: [56, 42], rHand: [56, 54], lKnee: [48, 74], rKnee: [57, 74] }),
    ],
  },
};
