import { describe, expect, it } from 'vitest';
import { compareVersions } from '../src';

describe('compareVersions', () => {
  it('vergleicht numerisch statt als Text', () => {
    expect(compareVersions('0.10.0', '0.9.9')).toBeGreaterThan(0);
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    expect(compareVersions('v0.2.1', '0.2.0')).toBeGreaterThan(0);
  });

  it('Vorabversionen sind älter als das Release', () => {
    expect(compareVersions('0.3.0-dev.5', '0.3.0')).toBeLessThan(0);
    expect(compareVersions('0.3.0-dev.10', '0.3.0-dev.9')).toBeGreaterThan(0);
    expect(compareVersions('0.3.0', '0.2.9-beta.1')).toBeGreaterThan(0);
  });
});
