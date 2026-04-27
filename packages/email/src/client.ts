/**
 * Unisender Go REST API transactional client.
 * Docs: https://godocs.unisender.ru/web-api-ref#email-send
 */
import pino from 'pino';

const log = pino({ name: 'email-client', level: process.env.LOG_LEVEL ?? 'info' });

const UNISENDER_GO_URL =
  process.env.UNISENDER_GO_URL ??
  'https://go1.unisender.ru/ru/transactional/api/v1/email/send.json';

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
};

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

export async function sendViaUnisender(args: SendArgs): Promise<SendResult> {
  const apiKey = process.env.UNISENDER_GO_API_KEY ?? '';
  const fromEmail = args.fromEmail ?? process.env.EMAIL_FROM ?? 'no-reply@ai-aggregator.ru';
  const fromName = args.fromName ?? process.env.EMAIL_FROM_NAME ?? 'AI-Aggregator';
  const replyTo = args.replyTo ?? process.env.EMAIL_REPLY_TO;

  // Graceful mock: if API key not configured, log and return success.
  if (!apiKey) {
    log.warn(
      { to: args.to, subject: args.subject },
      'UNISENDER_GO_API_KEY not set — email mocked (console)'
    );
    return { ok: true, id: 'console-mock' };
  }

  const body: Record<string, unknown> = {
    message: {
      recipients: [{ email: args.to }],
      body: {
        html: args.html,
        plaintext: args.text,
      },
      subject: args.subject,
      from_email: fromEmail,
      from_name: fromName,
      ...(replyTo ? { reply_to: replyTo } : {}),
    },
  };

  try {
    const res = await fetch(UNISENDER_GO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => ({}))) as {
      job_id?: string;
      failed_emails?: Record<string, string>;
      error?: string;
      message?: string;
    };

    if (!res.ok || json.error) {
      const error = json.error ?? json.message ?? `HTTP ${res.status}`;
      log.error({ to: args.to, status: res.status, error }, 'Unisender send failed');
      return { ok: false, error };
    }

    const id = json.job_id ?? 'unknown';
    log.info({ to: args.to, id }, 'Email sent via Unisender');
    return { ok: true, id };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    log.error({ to: args.to, error }, 'Unisender send threw');
    return { ok: false, error };
  }
}
