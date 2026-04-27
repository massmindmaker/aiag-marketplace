import { wrap, escapeHtml } from './_layout.js';

export type PaymentReceiptData = {
  name?: string;
  amount: number;
  currency?: string;
  description: string;
  paymentId: string;
  date: string; // ISO
  receiptUrl?: string;
};

export function paymentReceipt(data: PaymentReceiptData) {
  const currency = data.currency ?? 'RUB';
  const subject = `Чек об оплате — ${data.amount} ${currency}`;
  const greet = data.name ? `Здравствуйте, ${escapeHtml(data.name)}!` : 'Здравствуйте!';
  const formattedDate = new Date(data.date).toLocaleString('ru-RU');
  const html = wrap({
    title: subject,
    preheader: `Получен платёж на ${data.amount} ${currency}.`,
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:22px;color:#fafafa;font-weight:600;">${greet}</h1>
      <p style="margin:0 0 16px;">Спасибо за оплату. Подтверждаем получение платежа.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:16px 0;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#a3a3a3;font-size:13px;">Описание</td><td style="padding:8px 0;text-align:right;color:#fafafa;">${escapeHtml(data.description)}</td></tr>
        <tr><td style="padding:8px 0;color:#a3a3a3;font-size:13px;">Сумма</td><td style="padding:8px 0;text-align:right;color:#f59e0b;font-weight:600;font-size:18px;">${data.amount} ${escapeHtml(currency)}</td></tr>
        <tr><td style="padding:8px 0;color:#a3a3a3;font-size:13px;">Дата</td><td style="padding:8px 0;text-align:right;color:#fafafa;">${escapeHtml(formattedDate)}</td></tr>
        <tr><td style="padding:8px 0;color:#a3a3a3;font-size:13px;">ID платежа</td><td style="padding:8px 0;text-align:right;color:#fafafa;font-family:ui-monospace,monospace;font-size:12px;">${escapeHtml(data.paymentId)}</td></tr>
      </table>
      ${data.receiptUrl ? `<p style="margin:16px 0;"><a href="${escapeHtml(data.receiptUrl)}" style="color:#f59e0b;">Скачать фискальный чек</a></p>` : ''}
      <p style="margin:24px 0 0;color:#737373;font-size:13px;">Сохраните это письмо как подтверждение оплаты.</p>
    `,
  });
  const text = `${greet}

Платёж получен.
Описание: ${data.description}
Сумма: ${data.amount} ${currency}
Дата: ${formattedDate}
ID: ${data.paymentId}
${data.receiptUrl ? `Чек: ${data.receiptUrl}` : ''}`;
  return { subject, html, text };
}
