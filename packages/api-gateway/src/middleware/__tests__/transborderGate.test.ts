import { describe, it, expect } from 'vitest';
import {
  isForeignProvider,
  checkTransborderGate,
  FOREIGN_PROVIDERS,
} from '../transborderGate';

describe('isForeignProvider', () => {
  it('identifies OpenAI/Anthropic/Fal as foreign', () => {
    expect(isForeignProvider('openai/gpt-4o')).toBe(true);
    expect(isForeignProvider('anthropic/claude-4.7')).toBe(true);
    expect(isForeignProvider('fal/flux-pro')).toBe(true);
  });

  it('identifies Yandex/Sber as RF-local', () => {
    expect(isForeignProvider('yandex/yandexgpt-pro')).toBe(false);
    expect(isForeignProvider('sber/gigachat-pro')).toBe(false);
    expect(isForeignProvider('gigachat')).toBe(false);
  });

  it('handles bare org name without slash', () => {
    expect(isForeignProvider('openai')).toBe(true);
    expect(isForeignProvider('yandex')).toBe(false);
  });

  it('FOREIGN_PROVIDERS set contains expected orgs', () => {
    expect(FOREIGN_PROVIDERS.has('openai')).toBe(true);
    expect(FOREIGN_PROVIDERS.has('anthropic')).toBe(true);
    expect(FOREIGN_PROVIDERS.has('yandex')).toBe(false);
  });
});

describe('checkTransborderGate', () => {
  it('allows RF-local model regardless of consent', () => {
    const res = checkTransborderGate('yandex/yandexgpt-pro', { transborder: false });
    expect(res.allowed).toBe(true);
  });

  it('allows foreign model if transborder consent active', () => {
    const res = checkTransborderGate('openai/gpt-4o', { transborder: true });
    expect(res.allowed).toBe(true);
  });

  it('blocks foreign model without consent with 403-style error', () => {
    const res = checkTransborderGate('openai/gpt-4o', { transborder: false });
    expect(res.allowed).toBe(false);
    expect(res.error).toBe('transborder_consent_required');
    expect(res.explanation).toMatch(/трансграничн.{2}\s+передач/i);
    expect(res.consentUrl).toBe('/account/settings#consents');
  });
});
