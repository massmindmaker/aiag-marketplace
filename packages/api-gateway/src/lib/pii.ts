import { createHash } from 'node:crypto';

export const sha256 = (s: string): string =>
  createHash('sha256').update(s).digest('hex');

/**
 * FIX H3.1: Explicit text extraction covering every body field that may
 * carry user content (chat.messages, completions.prompt, embeddings.input,
 * completion.suffix, vision content parts).
 */
export function extractText(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const b = body as Record<string, unknown>;
  const parts: string[] = [];

  // OpenAI chat: messages[].content (string OR array of parts for vision)
  if (Array.isArray(b.messages)) {
    for (const m of b.messages as Array<Record<string, unknown>>) {
      const content = m?.content;
      if (typeof content === 'string') parts.push(content);
      else if (Array.isArray(content)) {
        for (const part of content) {
          if (typeof part === 'string') parts.push(part);
          else if (
            part &&
            typeof part === 'object' &&
            (part as Record<string, unknown>).type === 'text' &&
            typeof (part as Record<string, unknown>).text === 'string'
          ) {
            parts.push((part as Record<string, unknown>).text as string);
          }
          // image_url / audio parts — skipped (non-text)
        }
      }
    }
  }

  // Legacy completions: prompt (string or string[])
  if (typeof b.prompt === 'string') parts.push(b.prompt);
  else if (Array.isArray(b.prompt))
    parts.push(...b.prompt.filter((p): p is string => typeof p === 'string'));

  // Embeddings: input (string or string[])
  if (typeof b.input === 'string') parts.push(b.input);
  else if (Array.isArray(b.input))
    parts.push(...b.input.filter((p): p is string => typeof p === 'string'));

  // Completions suffix
  if (typeof b.suffix === 'string') parts.push(b.suffix);

  return parts.join('\n');
}

// -----------------------------------------------------------------------------
// PII detection patterns
// -----------------------------------------------------------------------------
const PATTERNS: Record<string, RegExp> = {
  email: /[\w.+-]+@[\w-]+\.[\w.-]+/g,
  phone: /(?:\+7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}/g,
  // FIX H3.4: ФИО downgraded to warn-only (high false-positive rate).
  // Note: JS \b is ASCII-only; Cyrillic word boundaries are approximated via
  // lookaround on Cyrillic vs non-Cyrillic chars.
  fio: /(?:^|[^А-Яа-яёЁ])([А-ЯЁ][а-яё]{1,20}\s+[А-ЯЁ][а-яё]{1,20}(?:\s+[А-ЯЁ][а-яё]{1,20})?)(?=[^А-Яа-яёЁ]|$)/g,
  // FIX H3.3: ИНН basic regex (Luhn-checksum validation → Phase 2)
  inn: /(?:^|\D)(\d{10}|\d{12})(?=\D|$)/g,
};

// Kinds that ACTUALLY block requests (when transborder && !allow).
const BLOCKING_KINDS = new Set(['email', 'phone', 'inn']);

export type PiiHit = { kind: string; sample: string; blocking: boolean };

export function detectPii(text: string): PiiHit[] {
  const hits: PiiHit[] = [];
  for (const [kind, rx] of Object.entries(PATTERNS)) {
    for (const m of text.matchAll(rx)) {
      hits.push({ kind, sample: m[0], blocking: BLOCKING_KINDS.has(kind) });
    }
  }
  return hits;
}
