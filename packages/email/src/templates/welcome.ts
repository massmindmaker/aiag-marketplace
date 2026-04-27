import { wrap, button, escapeHtml } from './_layout.js';

export type WelcomeData = { name?: string; dashboardUrl?: string };

export function welcome(data: WelcomeData) {
  const subject = 'Добро пожаловать в AI-Aggregator';
  const greet = data.name ? `Привет, ${escapeHtml(data.name)}!` : 'Привет!';
  const dashUrl = data.dashboardUrl ?? 'https://ai-aggregator.ru/dashboard';
  const html = wrap({
    title: subject,
    preheader: 'Ваш аккаунт активирован — начинайте работу.',
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:22px;color:#fafafa;font-weight:600;">${greet}</h1>
      <p style="margin:0 0 16px;">Аккаунт в AI-Aggregator активирован. Теперь вам доступны:</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#d4d4d4;">
        <li style="margin:6px 0;">Каталог из 100+ AI-моделей</li>
        <li style="margin:6px 0;">Единый API с автоматической балансировкой</li>
        <li style="margin:6px 0;">Дашборд с расходами и метриками</li>
        <li style="margin:6px 0;">Бесплатные кредиты для старта</li>
      </ul>
      ${button(dashUrl, 'Перейти в дашборд')}
      <p style="margin:24px 0 0;color:#737373;font-size:13px;">Если возникнут вопросы — пишите на support@ai-aggregator.ru.</p>
    `,
  });
  const text = `${greet}

Добро пожаловать в AI-Aggregator!

Дашборд: ${dashUrl}
Поддержка: support@ai-aggregator.ru`;
  return { subject, html, text };
}
