import { createHash, randomUUID } from 'crypto';

/**
 * Convert rubles (number) to YooKassa decimal string "X.XX".
 */
export function rublesToAmountString(rubles: number): string {
  return rubles.toFixed(2);
}

/**
 * Parse YooKassa amount string to rubles number.
 */
export function amountStringToRubles(value: string): number {
  return parseFloat(value);
}

/**
 * Generate idempotence key for YooKassa request (UUID v4).
 */
export function generateIdempotenceKey(): string {
  return randomUUID();
}

/**
 * YooKassa Basic auth header value.
 */
export function buildBasicAuth(shopId: string, secretKey: string): string {
  const token = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Verify webhook authenticity.
 *
 * YooKassa does NOT sign webhooks with HMAC. Authenticity is verified by:
 *   1) Whitelisting source IPs (185.71.76.0/27, 185.71.77.0/27, 77.75.153.0/25,
 *      77.75.154.128/25, 77.75.156.11, 77.75.156.35, 2a02:5180::/32)
 *   2) Re-fetching payment by ID via API to confirm status (recommended).
 *
 * This helper only does shape validation — call `verifyByFetch` from the client
 * for full verification.
 */
export function isYooKassaWebhookShapeValid(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  if (p.type !== 'notification') return false;
  if (typeof p.event !== 'string') return false;
  const obj = p.object as Record<string, unknown> | undefined;
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.id !== 'string') return false;
  if (typeof obj.status !== 'string') return false;
  return true;
}

/**
 * Whitelist of YooKassa webhook source IPs.
 * Source: https://yookassa.ru/developers/using-api/webhooks#ip
 */
export const YOOKASSA_WEBHOOK_IPS_V4: readonly string[] = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.154.128/25',
  '77.75.156.11',
  '77.75.156.35',
];

/**
 * Simple IPv4 in-CIDR check (no library deps).
 */
export function ipv4InCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) return ip === cidr;
  const [base, bitsStr] = cidr.split('/');
  const bits = parseInt(bitsStr, 10);
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  if (ipInt === null || baseInt === null) return false;
  if (bits === 0) return true;
  const mask = (~0 << (32 - bits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

export function isYooKassaIp(ip: string): boolean {
  return YOOKASSA_WEBHOOK_IPS_V4.some((cidr) => ipv4InCidr(ip, cidr));
}

/**
 * Hash a string with SHA-256 (utility for logging/dedupe).
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Map YooKassa status → internal payment status.
 */
export function mapYooKassaStatus(
  status: string
):
  | 'pending'
  | 'authorized'
  | 'confirmed'
  | 'cancelled'
  | 'failed' {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'waiting_for_capture':
      return 'authorized';
    case 'succeeded':
      return 'confirmed';
    case 'canceled':
      return 'cancelled';
    default:
      return 'failed';
  }
}
