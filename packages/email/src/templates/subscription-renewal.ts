import { wrap, button, escapeHtml } from './_layout.js';

export type SubscriptionRenewalData = {
  name?: string;
  planName: string;
  amount: number;
  currency?: string;
  renewalDate: string; // ISO
  manageUrl?: string;
};

export function subscriptionRenewal(data: SubscriptionRenewalData) {
  const currency = data.currency ?? 'RUB';
  const subject = `Подписка ${data.planName} продлевается ${new Date(data.renewalDate).toLocaleDateString('ru-RU')}`;
  const greet = data.name ? `Здравствуйте, ${escapeHtml(data.name)}!` : 'Здравствуйте!';
  const formattedDate = new Date(data.renewalDate).toLocaleDateString('ru-RU');
  const manageUrl = data.manageUrl ?? 'https://ai-aggregator.ru/account/billing';
  const html = wrap({
    title: subject,
    preheader: `Автопродление подписки ${data.planName} — ${formattedDate}.`,
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:22px;color:#fafafa;font-weight:600;">${greet}</h1>
      <p style="margin:0 0 16px;">Напоминаем: ваша подписка <strong style="color:#fafafa;">${escapeHtml(data.planName)}</strong> будет автоматически продлена.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#a3a3a3;font-size:13px;">План</td><td style="padding:8px 0;text-align:right;color:#fafafa;">${escapeHtml(data.planName)}</td></tr>
        <tr><td style="padding:8px 0;color:#a3a3a3;font-size:13px;">Сумма продления</td><td style="padding:8px 0;text-align:right;color:#f59e0b;font-weight:600;">${data.amount} ${escapeHtml(currency)}</td></tr>
        <tr><td style="padding:8px 0;color:#a3a3a3;font-size:13px;">Дата списания</td><td style="padding:8px 0;text-align:right;color:#fafafa;">${escapeHtml(formattedDate)}</td></tr>
      </table>
      ${button(manageUrl, 'Управлять подпиской')}
      <p style="margin:24px 0 0;color:#737373;font-size:13px;">Чтобы отменить продление, перейдите по ссылке выше до даты списания.</p>
    `,
  });
  const text = `${greet}

Подписка ${data.planName} будет продлена ${formattedDate} на сумму ${data.amount} ${currency}.

Управление подпиской: ${manageUrl}`;
  return { subject, html, text };
}
