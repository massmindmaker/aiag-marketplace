import { createHash } from 'crypto';

/**
 * Generate token for Tinkoff API request
 * Token = SHA-256(concatenation of sorted key-value pairs + Password)
 */
export function generateToken(params: Record<string, unknown>, secretKey: string): string {
  // Filter out Receipt and DATA fields, add Password
  const tokenParams: Record<string, string> = { Password: secretKey };

  for (const [key, value] of Object.entries(params)) {
    if (key === 'Receipt' || key === 'DATA' || key === 'Token') {
      continue;
    }
    if (value !== undefined && value !== null) {
      tokenParams[key] = String(value);
    }
  }

  // Sort by key and concatenate values
  const sortedKeys = Object.keys(tokenParams).sort();
  const concatenated = sortedKeys.map((key) => tokenParams[key]).join('');

  // Generate SHA-256 hash
  return createHash('sha256').update(concatenated).digest('hex');
}

/**
 * Verify webhook token
 */
export function verifyWebhookToken(
  payload: Record<string, unknown>,
  receivedToken: string,
  secretKey: string
): boolean {
  const calculatedToken = generateToken(payload, secretKey);
  return calculatedToken.toLowerCase() === receivedToken.toLowerCase();
}

/**
 * Convert rubles to kopecks
 */
export function rublesToKopecks(rubles: number): number {
  return Math.round(rubles * 100);
}

/**
 * Convert kopecks to rubles
 */
export function kopecksToRubles(kopecks: number): number {
  return kopecks / 100;
}

/**
 * Format amount for display
 */
export function formatAmount(rubles: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  }).format(rubles);
}

/**
 * Generate unique order ID
 */
export function generateOrderId(prefix = 'order'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Check if payment status is final
 */
export function isFinalStatus(status: string): boolean {
  const finalStatuses = [
    'CONFIRMED',
    'REVERSED',
    'PARTIAL_REVERSED',
    'REFUNDED',
    'PARTIAL_REFUNDED',
    'REJECTED',
    'CANCELED',
    'DEADLINE_EXPIRED',
    'AUTH_FAIL',
  ];
  return finalStatuses.includes(status);
}

/**
 * Check if payment is successful
 */
export function isSuccessfulStatus(status: string): boolean {
  return status === 'CONFIRMED' || status === 'AUTHORIZED';
}

/**
 * Check if payment needs confirmation (two-stage)
 */
export function needsConfirmation(status: string): boolean {
  return status === 'AUTHORIZED';
}
