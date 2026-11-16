import type { Decimal } from '@prisma/client/runtime/library';

import { prisma } from '../config/database.js';
import { toDecimal } from './decimal.js';

/**
 * Latest known price of one unit of every currency, in USD.
 *
 * Built from the most recent `X → USD` row in `exchange_rates`. Currencies
 * without a rate are left out, so callers must handle a missing entry
 * instead of silently treating it as 1.
 */
export async function getUsdRates(): Promise<Map<string, Decimal>> {
  const rows = await prisma.exchangeRate.findMany({
    where: { toCurrency: { code: 'USD' } },
    orderBy: { validAt: 'desc' },
    include: { fromCurrency: { select: { code: true } } },
  });

  const rates = new Map<string, Decimal>([['USD', toDecimal(1)]]);

  for (const row of rows) {
    // Rows are ordered newest first: keep only the first one per currency.
    if (!rates.has(row.fromCurrency.code)) {
      rates.set(row.fromCurrency.code, row.rate);
    }
  }

  return rates;
}
