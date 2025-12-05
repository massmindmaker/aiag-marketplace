import { createTinkoffClient, TinkoffAcquiring } from '@aiag/tinkoff';

// Create a global instance to reuse
const globalForTinkoff = globalThis as unknown as {
  tinkoff: TinkoffAcquiring | undefined;
};

export const tinkoff =
  globalForTinkoff.tinkoff ??
  createTinkoffClient({
    terminalKey: process.env.TINKOFF_TERMINAL_KEY!,
    secretKey: process.env.TINKOFF_SECRET_KEY!,
    apiUrl: process.env.TINKOFF_API_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForTinkoff.tinkoff = tinkoff;
}

export { generateOrderId, formatAmount } from '@aiag/tinkoff';
