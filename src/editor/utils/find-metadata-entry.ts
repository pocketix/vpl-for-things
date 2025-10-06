const findMetadataEntry = (block: any[], targetUuid: string) => {
  // First check if the entry is in this block
  const directEntry = block.find(stmt => stmt._uuid === targetUuid);
  if (directEntry) return directEntry;

  // If not found directly, search in nested blocks
  for (const stmt of block) {
    if (stmt.block && Array.isArray(stmt.block)) {
      const nestedEntry = findMetadataEntry(stmt.block, targetUuid);
      if (nestedEntry) return nestedEntry;
    }
  }

  return null;
};

export {findMetadataEntry};
