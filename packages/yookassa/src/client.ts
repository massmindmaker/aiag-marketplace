import type {
  YooKassaConfig,
  CreateYooKassaPaymentRequest,
  YooKassaPaymentObject,
  YooKassaCreatePaymentParams,
  YooKassaPaymentResult,
  YooKassaWebhookEvent,
  YooKassaRefundResult,
} from './types';
import {
  buildBasicAuth,
  generateIdempotenceKey,
  rublesToAmountString,
  amountStringToRubles,
  isYooKassaWebhookShapeValid,
  mapYooKassaStatus,
} from './utils';

const DEFAULT_API_URL = 'https://api.yookassa.ru/v3';

export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

/**
 * YooKassa REST client with idempotency, basic auth, and webhook verification.
 */
export class YooKassaClient {
  private readonly shopId: string;
  private readonly secretKey: string;
  private readonly apiUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(config: YooKassaConfig, fetchImpl: FetchLike = fetch as unknown as FetchLike) {
    this.shopId = config.shopId;
    this.secretKey = config.secretKey;
    this.apiUrl = config.apiUrl || DEFAULT_API_URL;
    this.fetchImpl = fetchImpl;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
    idempotenceKey?: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: buildBasicAuth(this.shopId, this.secretKey),
      'Content-Type': 'application/json',
    };
    if (method === 'POST') {
      headers['Idempotence-Key'] = idempotenceKey || generateIdempotenceKey();
    }

    const res = await this.fetchImpl(`${this.apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`YooKassa API ${res.status} ${res.statusText}: ${text}`);
    }
    return (await res.json()) as T;
  }

  /** Low-level: create payment (POST /payments). */
  async createPaymentRaw(
    payload: CreateYooKassaPaymentRequest,
    idempotenceKey?: string
  ): Promise<YooKassaPaymentObject> {
    return this.request<YooKassaPaymentObject>(
      'POST',
      '/payments',
      payload as unknown as Record<string, unknown>,
      idempotenceKey
    );
  }

  /** Low-level: get payment by id. */
  async getPayment(paymentId: string): Promise<YooKassaPaymentObject> {
    return this.request<YooKassaPaymentObject>('GET', `/payments/${paymentId}`);
  }

  /** Low-level: refund (POST /refunds). */
  async refundRaw(
    paymentId: string,
    amountRub: number,
    description?: string,
    idempotenceKey?: string
  ): Promise<YooKassaRefundResult> {
    return this.request<YooKassaRefundResult>(
      'POST',
      '/refunds',
      {
        payment_id: paymentId,
        amount: { value: rublesToAmountString(amountRub), currency: 'RUB' },
        description,
      },
      idempotenceKey
    );
  }

  /**
   * High-level: create payment.
   * Supports bank_card and sbp methods. The orderId is used as Idempotence-Key
   * (passed in header) AND stored in metadata.order_id for back-reference.
   */
  async createPayment(
    params: YooKassaCreatePaymentParams
  ): Promise<YooKassaPaymentResult> {
    const payload: CreateYooKassaPaymentRequest = {
      amount: {
        value: rublesToAmountString(params.amount),
        currency: 'RUB',
      },
      description: params.description,
      capture: params.capture ?? true,
      confirmation:
        params.paymentMethod === 'sbp'
          ? { type: 'qr' }
          : { type: 'redirect', return_url: params.returnUrl },
      payment_method_data: params.paymentMethod
        ? { type: params.paymentMethod }
        : undefined,
      save_payment_method: params.savePaymentMethod,
      metadata: { ...(params.metadata || {}), order_id: params.orderId },
    };

    if (params.email || params.phone) {
      payload.receipt = {
        customer: { email: params.email, phone: params.phone },
        items: [
          {
            description: params.description || 'Payment',
            quantity: '1.00',
            amount: payload.amount,
            vat_code: 1, // НДС не облагается / без НДС
          },
        ],
      };
    }

    try {
      const obj = await this.createPaymentRaw(payload, params.orderId);
      return {
        success: obj.status !== 'canceled',
        paymentId: obj.id,
        status: obj.status,
        amount: amountStringToRubles(obj.amount.value),
        paymentUrl: obj.confirmation?.confirmation_url,
        confirmationData: obj.confirmation?.confirmation_data,
        raw: obj,
      };
    } catch (e) {
      return {
        success: false,
        paymentId: '',
        status: 'canceled',
        amount: params.amount,
        errorMessage: (e as Error).message,
      };
    }
  }

  /**
   * Refund (full or partial). Pass amount in rubles.
   */
  async refundPayment(
    paymentId: string,
    amountRub: number,
    description?: string
  ): Promise<YooKassaRefundResult> {
    return this.refundRaw(paymentId, amountRub, description);
  }

  /**
   * Verify webhook by re-fetching payment from API. Returns the canonical
   * YooKassaPaymentObject if successful, throws otherwise.
   *
   * NOTE: YooKassa webhooks are not HMAC-signed. Production usage should also
   * IP-whitelist the request source (see utils.YOOKASSA_WEBHOOK_IPS_V4).
   */
  async verifyAndFetch(
    payload: unknown
  ): Promise<{ event: YooKassaWebhookEvent; object: YooKassaPaymentObject }> {
    if (!isYooKassaWebhookShapeValid(payload)) {
      throw new Error('YooKassa webhook: invalid payload shape');
    }
    const event = payload as YooKassaWebhookEvent;
    // Refunds: skip re-fetch of payment (would 404 the refund id).
    if (event.event.startsWith('refund.')) {
      return { event, object: event.object };
    }
    const fresh = await this.getPayment(event.object.id);
    return { event, object: fresh };
  }
}

export function createYooKassaClient(
  config: YooKassaConfig,
  fetchImpl?: FetchLike
): YooKassaClient {
  return new YooKassaClient(config, fetchImpl);
}

export { mapYooKassaStatus };
