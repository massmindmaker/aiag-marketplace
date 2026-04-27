import { wrap, button, escapeHtml } from './_layout.js';

export type VerifyEmailData = { url: string; name?: string };

export function verifyEmail(data: VerifyEmailData) {
  const subject = 'Подтвердите email — AI-Aggregator';
  const greet = data.name ? `Привет, ${escapeHtml(data.name)}!` : 'Привет!';
  const html = wrap({
    title: subject,
    preheader: 'Подтвердите ваш email, чтобы активировать аккаунт.',
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:22px;color:#fafafa;font-weight:600;">${greet}</h1>
      <p style="margin:0 0 16px;">Спасибо за регистрацию в AI-Aggregator. Чтобы активировать аккаунт, подтвердите свой email.</p>
      ${button(data.url, 'Подтвердить email')}
      <p style="margin:0 0 8px;color:#a3a3a3;font-size:13px;">Или скопируйте ссылку в браузер:</p>
      <p style="margin:0;word-break:break-all;color:#f59e0b;font-size:13px;font-family:ui-monospace,monospace;">${escapeHtml(data.url)}</p>
      <p style="margin:24px 0 0;color:#737373;font-size:13px;">Ссылка действует 24 часа.</p>
    `,
  });
  const text = `${greet}

Подтвердите email для активации аккаунта в AI-Aggregator:
${data.url}

Ссылка действует 24 часа.`;
  return { subject, html, text };
}
