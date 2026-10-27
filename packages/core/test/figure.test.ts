import { describe, expect, it } from 'vitest';
import { Figure, JOINTS, poseAt, type Pose } from '../src';

const pose = (y: number): Pose => Object.fromEntries(JOINTS.map((j) => [j, [50, y]])) as Pose;

describe('Figur', () => {
  const fig = Figure.parse({ frames: [pose(10), pose(30)], period: 2 });

  it('hält die Pose am Anfang eines Frames und blendet dann über', () => {
    expect(poseAt(fig, 0).head).toEqual([50, 10]);
    expect(poseAt(fig, 0.2).head).toEqual([50, 10]);
    expect(poseAt(fig, 1).head).toEqual([50, 30]);
    const mid = poseAt(fig, 0.7).head[1];
    expect(mid).toBeGreaterThan(10);
    expect(mid).toBeLessThan(30);
  });

  it('läuft im Kreis und zeigt Standbilder unverändert', () => {
    expect(poseAt(fig, 2).head).toEqual([50, 10]);
    expect(poseAt(Figure.parse({ frames: [pose(5)] }), 123).head).toEqual([50, 5]);
  });
});
