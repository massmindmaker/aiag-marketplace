/**
 * Plan 08 Task 5 — Anti-fraud middleware
 *
 * Лёгкая in-request проверка: если у user есть активный `high`-severity
 * fraud flag (например, chargeback × 2) — блокируем новые платные запросы.
 * Multi-account detection делается оффлайн в worker sweep job.
 */

export interface FraudCheckInput {
  userId: string;
  hasActiveHighSeverityFlag: boolean; // pre-fetched (gateway передаёт)
  chargebackCount30d: number;
}

export interface FraudCheckResult {
  allowed: boolean;
  error?: string;
  reason?: string;
}

export function checkAntiFraud(input: FraudCheckInput): FraudCheckResult {
  if (input.chargebackCount30d >= 2) {
    return {
      allowed: false,
      error: 'account_suspended_chargebacks',
      reason: 'Аккаунт временно заблокирован из-за ≥2 chargeback за 30 дней. Обратитесь в поддержку.',
    };
  }
  if (input.hasActiveHighSeverityFlag) {
    return {
      allowed: false,
      error: 'account_under_review',
      reason: 'Аккаунт на проверке безопасности. Обратитесь в поддержку.',
    };
  }
  return { allowed: true };
}
