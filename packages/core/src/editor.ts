import type { Block } from './schema/blocks';

/**
 * Unveränderliche Operationen auf dem Baustein-Baum für den Builder.
 * Ein Pfad ist eine Liste von Indizes durch verschachtelte `blocks`,
 * z. B. [1, 0] = erstes Kind des zweiten Bausteins.
 */
export type BlockPath = readonly number[];

type Container = Block & { blocks: Block[] };

export function hasChildren(block: Block): block is Container {
  return (block.type === 'repeat' || block.type === 'group') && Array.isArray((block as { blocks?: unknown }).blocks);
}

export function getBlock(blocks: readonly Block[], path: BlockPath): Block | undefined {
  let list = blocks;
  let block: Block | undefined;
  for (const i of path) {
    block = list[i];
    if (!block) return undefined;
    list = hasChildren(block) ? block.blocks : [];
  }
  return block;
}

/** Wendet `fn` auf die Liste an, in der das letzte Pfadelement liegt (Elternliste). */
function updateList(blocks: readonly Block[], parentPath: BlockPath, fn: (list: Block[]) => Block[]): Block[] {
  if (parentPath.length === 0) return fn([...blocks]);
  const [head, ...rest] = parentPath;
  return blocks.map((b, i) => {
    if (i !== head) return b;
    if (!hasChildren(b)) throw new Error(`Baustein an Position ${head} hat keine Kinder`);
    return { ...b, blocks: updateList(b.blocks, rest, fn) } as Block;
  });
}

/** Fügt `block` in die Liste unter `parentPath` an Position `index` ein (Standard: ans Ende). */
export function insertBlock(blocks: readonly Block[], parentPath: BlockPath, block: Block, index?: number): Block[] {
  return updateList(blocks, parentPath, (list) => {
    list.splice(index ?? list.length, 0, block);
    return list;
  });
}

export function removeBlock(blocks: readonly Block[], path: BlockPath): Block[] {
  if (path.length === 0) throw new Error('Leerer Pfad');
  const index = path[path.length - 1]!;
  return updateList(blocks, path.slice(0, -1), (list) => {
    list.splice(index, 1);
    return list;
  });
}

export function replaceBlock(blocks: readonly Block[], path: BlockPath, block: Block): Block[] {
  if (path.length === 0) throw new Error('Leerer Pfad');
  const index = path[path.length - 1]!;
  return updateList(blocks, path.slice(0, -1), (list) => {
    list[index] = block;
    return list;
  });
}

/** Verschiebt einen Baustein innerhalb seiner Liste um `delta` Plätze (begrenzt auf die Listengrenzen). */
export function moveBlock(blocks: readonly Block[], path: BlockPath, delta: number): Block[] {
  if (path.length === 0) throw new Error('Leerer Pfad');
  const index = path[path.length - 1]!;
  return updateList(blocks, path.slice(0, -1), (list) => {
    const target = Math.max(0, Math.min(list.length - 1, index + delta));
    const [b] = list.splice(index, 1);
    list.splice(target, 0, b!);
    return list;
  });
}
