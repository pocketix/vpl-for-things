/**
 * Utility function for finding metadata entries in program blocks
 * 
 * This module provides a reusable function for recursively searching
 * metadata entries by UUID in program blocks.
 */

/**
 * Recursively searches for a metadata entry in a block by UUID
 * @param block The block to search in
 * @param targetUuid The UUID to search for
 * @returns The found statement or null if not found
 */
export function findMetadataEntry(block: any[], targetUuid: string): any {
  const directEntry = block.find(stmt => stmt._uuid === targetUuid);
  if (directEntry) return directEntry;

  for (const stmt of block) {
    if (stmt.block && Array.isArray(stmt.block)) {
      const nestedEntry = findMetadataEntry(stmt.block, targetUuid);
      if (nestedEntry) return nestedEntry;
    }
  }
  return null;
}
