import { wrap, button, escapeHtml } from './_layout.js';

export type ResetPasswordData = { url: string; name?: string };

export function resetPassword(data: ResetPasswordData) {
  const subject = 'Восстановление пароля — AI-Aggregator';
  const greet = data.name ? `Привет, ${escapeHtml(data.name)}!` : 'Здравствуйте!';
  const html = wrap({
    title: subject,
    preheader: 'Сброс пароля для вашего аккаунта.',
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:22px;color:#fafafa;font-weight:600;">${greet}</h1>
      <p style="margin:0 0 16px;">Мы получили запрос на сброс пароля для вашего аккаунта в AI-Aggregator.</p>
      ${button(data.url, 'Сбросить пароль')}
      <p style="margin:0 0 8px;color:#a3a3a3;font-size:13px;">Или скопируйте ссылку:</p>
      <p style="margin:0;word-break:break-all;color:#f59e0b;font-size:13px;font-family:ui-monospace,monospace;">${escapeHtml(data.url)}</p>
      <p style="margin:24px 0 0;color:#737373;font-size:13px;">Ссылка действительна 1 час. Если вы не запрашивали сброс — просто проигнорируйте письмо, ваш пароль останется прежним.</p>
    `,
  });
  const text = `${greet}

Запрос на сброс пароля. Перейдите по ссылке (действительна 1 час):
${data.url}

Если вы не запрашивали сброс — проигнорируйте письмо.`;
  return { subject, html, text };
}
