import { describe, expect, it } from 'vitest';
import { getBlock, insertBlock, moveBlock, removeBlock, replaceBlock, type Block } from '../src';

const rest = (d: number): Block => ({ type: 'rest', duration: d });
const tree: Block[] = [rest(1), { type: 'repeat', times: 2, blocks: [rest(2), rest(3)] }, rest(4)];

describe('Builder-Operationen', () => {
  it('liest verschachtelte Pfade', () => {
    expect(getBlock(tree, [1, 1])).toEqual(rest(3));
    expect(getBlock(tree, [5])).toBeUndefined();
    expect(getBlock(tree, [0, 0])).toBeUndefined();
  });

  it('fügt oben und verschachtelt ein, ohne das Original zu ändern', () => {
    const a = insertBlock(tree, [], rest(9), 0);
    expect(a.map((b) => (b as { duration?: number }).duration)).toEqual([9, 1, undefined, 4]);
    const b = insertBlock(tree, [1], rest(9));
    expect(getBlock(b, [1, 2])).toEqual(rest(9));
    expect(getBlock(tree, [1, 2])).toBeUndefined();
  });

  it('entfernt, ersetzt und verschiebt', () => {
    expect(getBlock(removeBlock(tree, [1, 0]), [1, 0])).toEqual(rest(3));
    expect(getBlock(replaceBlock(tree, [2], rest(7)), [2])).toEqual(rest(7));
    const moved = moveBlock(tree, [1, 1], -1);
    expect(getBlock(moved, [1, 0])).toEqual(rest(3));
    expect(moveBlock(tree, [0], -5)).toEqual(tree);
  });

  it('wirft bei Kindern in Bausteinen ohne Kinder', () => {
    expect(() => insertBlock(tree, [0], rest(1))).toThrow();
  });
});
