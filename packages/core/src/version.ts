/**
 * Vergleicht Versionsnummern wie "1.2.3" oder "1.2.3-dev.4" (führendes "v" erlaubt).
 * Ergebnis < 0, wenn a älter ist als b. Eine Vorabversion ist älter als die
 * gleiche Version ohne Zusatz (1.2.3-dev.4 < 1.2.3).
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [main = '', pre] = v.trim().replace(/^v/i, '').split('-', 2);
    const nums = main.split('.').map((n) => Number.parseInt(n, 10) || 0);
    return { nums: [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0], pre };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) {
    const d = x.nums[i]! - y.nums[i]!;
    if (d !== 0) return d;
  }
  if (x.pre === y.pre) return 0;
  if (x.pre === undefined) return 1;
  if (y.pre === undefined) return -1;
  return x.pre.localeCompare(y.pre, undefined, { numeric: true });
}
