/**
 * Minimal Telegram alert sender using Bot API sendMessage.
 * No external deps — uses fetch.
 */

export type Severity = 'critical' | 'warning' | 'info' | 'resolved';

export type SendAlertResult = { ok: true; messageId?: number } | { ok: false; error: string };

const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: '🚨',
  warning: '⚠️',
  info: 'ℹ️',
  resolved: '✅',
};

export async function sendAlert(
  text: string,
  severity: Severity = 'info'
): Promise<SendAlertResult> {
  const token = process.env.TELEGRAM_ALERT_BOT_TOKEN ?? '';
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID ?? '';

  const emoji = SEVERITY_EMOJI[severity] ?? '';
  const formatted = `${emoji} <b>[${severity.toUpperCase()}]</b>\n${text}`;

  if (!token || !chatId) {
    // Graceful no-op: log to console
    // eslint-disable-next-line no-console
    console.log(`[telegram-alert/mock] ${formatted}`);
    return { ok: true };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatted,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: { message_id?: number };
      description?: string;
    };
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.description ?? `HTTP ${res.status}` };
    }
    return { ok: true, messageId: json.result?.message_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
