/**
 * Unified row extractor — drizzle pg returns { rows: [...] }, drizzle neon
 * returns the array directly. Always returns a properly typed array.
 */
export function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result) {
    const r = (result as { rows?: unknown }).rows;
    if (Array.isArray(r)) return r as T[];
  }
  return [];
}

export function firstRow<T>(result: unknown): T | null {
  return rowsOf<T>(result)[0] ?? null;
}
