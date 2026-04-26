import { describe, it, expect, vi } from 'vitest';
import { moderate } from '../moderation';

describe('moderation middleware (local-first)', () => {
  it('blocks on Yandex primary flag', async () => {
    const primary = vi.fn().mockResolvedValue({ flagged: true, categories: ['adult'] });
    const fallback = vi.fn();
    const openai = vi.fn();
    const res = await moderate('...', {
      primary,
      fallback,
      openai,
      userConsents: { transborder: false },
    });
    expect(primary).toHaveBeenCalledOnce();
    expect(res.blocked).toBe(true);
    expect(res.provider).toBe('yandex');
    expect(res.reason).toContain('adult');
    expect(fallback).not.toHaveBeenCalled();
    expect(openai).not.toHaveBeenCalled();
  });

  it('does NOT call OpenAI Moderation if user has no transborder consent', async () => {
    const primary = vi.fn().mockResolvedValue({ flagged: false });
    const fallback = vi.fn();
    const openai = vi.fn();
    const res = await moderate('neutral prompt', {
      primary,
      fallback,
      openai,
      userConsents: { transborder: false },
    });
    expect(openai).not.toHaveBeenCalled();
    expect(res.blocked).toBe(false);
  });

  it('calls OpenAI Moderation as extra layer only if transborder consent active', async () => {
    const primary = vi.fn().mockResolvedValue({ flagged: false });
    const fallback = vi.fn();
    const openai = vi.fn().mockResolvedValue({ flagged: true, categories: ['sexual/minors'] });
    const prev = process.env.OPENAI_MODERATION_KEY;
    process.env.OPENAI_MODERATION_KEY = 'sk-test';
    try {
      const res = await moderate('...', {
        primary,
        fallback,
        openai,
        userConsents: { transborder: true },
      });
      expect(openai).toHaveBeenCalled();
      expect(res.blocked).toBe(true);
      expect(res.provider).toBe('openai');
    } finally {
      if (prev === undefined) delete process.env.OPENAI_MODERATION_KEY;
      else process.env.OPENAI_MODERATION_KEY = prev;
    }
  });

  it('fallbacks to self-hosted Llama if Yandex is down', async () => {
    const primary = vi.fn().mockRejectedValue(new Error('503'));
    const fallback = vi.fn().mockResolvedValue({ flagged: false });
    const openai = vi.fn();
    const res = await moderate('test', {
      primary,
      fallback,
      openai,
      userConsents: { transborder: false },
    });
    expect(fallback).toHaveBeenCalled();
    expect(res.blocked).toBe(false);
    expect(res.provider).toBe('llama-selfhost');
  });

  it('fail-open if all local providers down (failOpen=true)', async () => {
    const primary = vi.fn().mockRejectedValue(new Error('503'));
    const fallback = vi.fn().mockRejectedValue(new Error('503'));
    const res = await moderate('test', {
      primary,
      fallback,
      failOpen: true,
      userConsents: { transborder: false },
    });
    expect(res.blocked).toBe(false);
    expect(res.degraded).toBe(true);
  });

  it('throws if all local down and failOpen=false', async () => {
    const primary = vi.fn().mockRejectedValue(new Error('503'));
    const fallback = vi.fn().mockRejectedValue(new Error('503'));
    await expect(
      moderate('test', { primary, fallback, userConsents: { transborder: false } })
    ).rejects.toThrow();
  });
});
