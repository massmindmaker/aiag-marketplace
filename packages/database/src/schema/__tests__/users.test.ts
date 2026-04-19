import { describe, it, expect } from 'vitest';
import { users } from '../users';

describe('users schema — 152-FZ consent fields', () => {
  it('should expose consent boolean fields on the users table', () => {
    const keys = Object.keys(users);
    expect(keys).toContain('consentProcessing');
    expect(keys).toContain('consentTransborder');
    expect(keys).toContain('consentMarketing');
  });

  it('should expose consent audit fields on the users table', () => {
    const keys = Object.keys(users);
    expect(keys).toContain('consentTimestamp');
    expect(keys).toContain('consentIpAddress');
    expect(keys).toContain('consentUserAgent');
  });

  it('should mark consent boolean fields as notNull with default false', () => {
    // Drizzle column metadata: notNull and hasDefault are present on column instances
    const processing = (users as any).consentProcessing;
    const transborder = (users as any).consentTransborder;
    const marketing = (users as any).consentMarketing;

    expect(processing.notNull).toBe(true);
    expect(transborder.notNull).toBe(true);
    expect(marketing.notNull).toBe(true);

    expect(processing.hasDefault).toBe(true);
    expect(transborder.hasDefault).toBe(true);
    expect(marketing.hasDefault).toBe(true);
  });
});
