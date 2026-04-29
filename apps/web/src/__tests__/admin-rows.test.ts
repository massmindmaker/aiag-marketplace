import { describe, it, expect } from 'vitest';
import { rowsOf, firstRow } from '@/lib/admin/rows';

describe('rowsOf', () => {
  it('extracts rows from drizzle pg result shape', () => {
    expect(rowsOf<{ a: number }>({ rows: [{ a: 1 }, { a: 2 }] })).toEqual([{ a: 1 }, { a: 2 }]);
  });
  it('returns plain arrays unchanged', () => {
    expect(rowsOf<number>([1, 2, 3])).toEqual([1, 2, 3]);
  });
  it('returns empty for null / undefined / non-row objects', () => {
    expect(rowsOf(null)).toEqual([]);
    expect(rowsOf(undefined)).toEqual([]);
    expect(rowsOf({ foo: 'bar' })).toEqual([]);
  });
});

describe('firstRow', () => {
  it('returns first element', () => {
    expect(firstRow<{ a: number }>({ rows: [{ a: 1 }] })).toEqual({ a: 1 });
  });
  it('returns null for empty', () => {
    expect(firstRow({ rows: [] })).toBeNull();
    expect(firstRow(null)).toBeNull();
  });
});
