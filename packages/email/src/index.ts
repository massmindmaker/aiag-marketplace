/**
 * @aiag/email — transactional email client.
 *
 * Usage:
 *   import { sendEmail } from '@aiag/email';
 *   await sendEmail({ template: 'reset-password', to, data: { url } });
 *
 * If UNISENDER_GO_API_KEY is empty, sends are logged to console and
 * return { ok: true, id: 'console-mock' } (graceful no-op for dev).
 */
import pino from 'pino';
import { sendViaUnisender } from './client.js';
import { verifyEmail, type VerifyEmailData } from './templates/verify-email.js';
import { resetPassword, type ResetPasswordData } from './templates/reset-password.js';
import { welcome, type WelcomeData } from './templates/welcome.js';
import { paymentReceipt, type PaymentReceiptData } from './templates/payment-receipt.js';
import {
  subscriptionRenewal,
  type SubscriptionRenewalData,
} from './templates/subscription-renewal.js';

const log = pino({ name: 'email', level: process.env.LOG_LEVEL ?? 'info' });

export type TemplateName =
  | 'verify-email'
  | 'reset-password'
  | 'welcome'
  | 'payment-receipt'
  | 'subscription-renewal';

export type TemplateDataMap = {
  'verify-email': VerifyEmailData;
  'reset-password': ResetPasswordData;
  welcome: WelcomeData;
  'payment-receipt': PaymentReceiptData;
  'subscription-renewal': SubscriptionRenewalData;
};

const TEMPLATES = {
  'verify-email': verifyEmail,
  'reset-password': resetPassword,
  welcome,
  'payment-receipt': paymentReceipt,
  'subscription-renewal': subscriptionRenewal,
} as const;

export type SendEmailOptions =
  | {
      to: string;
      subject: string;
      html: string;
      text?: string;
      template?: never;
      data?: never;
      fromEmail?: string;
      fromName?: string;
      replyTo?: string;
    }
  | {
      [K in TemplateName]: {
        to: string;
        template: K;
        data: TemplateDataMap[K];
        subject?: never;
        html?: never;
        text?: never;
        fromEmail?: string;
        fromName?: string;
        replyTo?: string;
      };
    }[TemplateName];

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  let subject: string;
  let html: string;
  let text: string;

  if ('template' in opts && opts.template) {
    const renderer = TEMPLATES[opts.template] as (data: unknown) => {
      subject: string;
      html: string;
      text: string;
    };
    if (!renderer) {
      const error = `Unknown template: ${String(opts.template)}`;
      log.error({ template: opts.template }, error);
      return { ok: false, error };
    }
    const rendered = renderer(opts.data);
    subject = rendered.subject;
    html = rendered.html;
    text = rendered.text;
  } else {
    if (!opts.subject || !opts.html) {
      return { ok: false, error: 'subject + html required when template not used' };
    }
    subject = opts.subject;
    html = opts.html;
    text = opts.text ?? stripHtml(opts.html);
  }

  return sendViaUnisender({
    to: opts.to,
    subject,
    html,
    text,
    fromEmail: opts.fromEmail,
    fromName: opts.fromName,
    replyTo: opts.replyTo,
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export { sendViaUnisender } from './client.js';
export * from './templates/verify-email.js';
export * from './templates/reset-password.js';
export * from './templates/welcome.js';
export * from './templates/payment-receipt.js';
export * from './templates/subscription-renewal.js';
