/**
 * Utility function for recursively finding blocks/statements by UUID
 * 
 * This module provides a reusable function for recursively searching
 * blocks and statements by UUID in program structures.
 */

/**
 * Recursively searches for a block/statement by UUID
 * @param block The block to search in
 * @param targetUuid The UUID to search for
 * @returns The found statement or null if not found
 */
export function findBlockRecursively(block: any[], targetUuid: string): any {
  for (const stmt of block) {
    if (stmt._uuid === targetUuid) {
      return stmt;
    }
    if (stmt.block && Array.isArray(stmt.block)) {
      const found = findBlockRecursively(stmt.block, targetUuid);
      if (found) return found;
    }
  }
  return null;
}
