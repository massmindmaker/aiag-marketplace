/**
 * YooKassa REST API types.
 * Docs: https://yookassa.ru/developers/api
 */

// Payment status as per YooKassa API
export type YooKassaStatus =
  | 'pending'
  | 'waiting_for_capture'
  | 'succeeded'
  | 'canceled';

export type YooKassaPaymentMethodType =
  | 'bank_card'
  | 'sbp'
  | 'yoo_money'
  | 'qiwi'
  | 'sberbank'
  | 'tinkoff_bank'
  | 'apple_pay'
  | 'google_pay';

export interface YooKassaConfig {
  shopId: string;
  secretKey: string;
  apiUrl?: string; // default https://api.yookassa.ru/v3
}

export interface YooKassaAmount {
  value: string; // decimal string e.g. "990.00"
  currency: 'RUB' | 'USD' | 'EUR';
}

export interface YooKassaConfirmation {
  type: 'redirect' | 'embedded' | 'qr' | 'mobile_application';
  return_url?: string;
  confirmation_url?: string;
  confirmation_data?: string; // for SBP/QR — payload string
}

export interface YooKassaPaymentMethodData {
  type: YooKassaPaymentMethodType;
}

export interface YooKassaReceiptItem {
  description: string;
  quantity: string; // decimal string
  amount: YooKassaAmount;
  vat_code: 1 | 2 | 3 | 4 | 5 | 6;
  payment_subject?: string;
  payment_mode?: string;
}

export interface YooKassaReceipt {
  customer?: { email?: string; phone?: string };
  items: YooKassaReceiptItem[];
}

export interface CreateYooKassaPaymentRequest {
  amount: YooKassaAmount;
  description?: string;
  confirmation: YooKassaConfirmation;
  capture?: boolean;
  payment_method_data?: YooKassaPaymentMethodData;
  save_payment_method?: boolean;
  metadata?: Record<string, string>;
  receipt?: YooKassaReceipt;
}

export interface YooKassaPaymentObject {
  id: string;
  status: YooKassaStatus;
  amount: YooKassaAmount;
  income_amount?: YooKassaAmount;
  description?: string;
  recipient: { account_id: string; gateway_id: string };
  payment_method?: {
    type: YooKassaPaymentMethodType;
    id: string;
    saved?: boolean;
    title?: string;
    card?: { last4?: string; first6?: string; expiry_month?: string; expiry_year?: string };
  };
  captured_at?: string;
  created_at: string;
  expires_at?: string;
  confirmation?: YooKassaConfirmation;
  test: boolean;
  refunded_amount?: YooKassaAmount;
  paid: boolean;
  refundable: boolean;
  metadata?: Record<string, string>;
}

// Webhook notification (YooKassa POSTs JSON to your URL)
export interface YooKassaWebhookEvent {
  type: 'notification';
  event:
    | 'payment.succeeded'
    | 'payment.waiting_for_capture'
    | 'payment.canceled'
    | 'refund.succeeded';
  object: YooKassaPaymentObject;
}

// High-level API
export interface YooKassaCreatePaymentParams {
  orderId: string;        // your idempotence-key (also used in metadata.order_id)
  amount: number;         // rubles
  description?: string;
  returnUrl: string;
  paymentMethod?: 'bank_card' | 'sbp';
  email?: string;
  phone?: string;
  metadata?: Record<string, string>;
  savePaymentMethod?: boolean;
  capture?: boolean;
}

export interface YooKassaPaymentResult {
  success: boolean;
  paymentId: string;
  status: YooKassaStatus;
  amount: number;       // rubles
  paymentUrl?: string;
  confirmationData?: string; // SBP payload (sbp:// or qr code base64)
  errorCode?: string;
  errorMessage?: string;
  raw?: YooKassaPaymentObject;
}

export interface YooKassaRefundRequest {
  payment_id: string;
  amount: YooKassaAmount;
  description?: string;
}

export interface YooKassaRefundResult {
  id: string;
  status: 'succeeded' | 'canceled' | 'pending';
  amount: YooKassaAmount;
  payment_id: string;
  created_at: string;
}
