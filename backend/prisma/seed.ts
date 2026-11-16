import bcrypt from 'bcryptjs';

import { prisma } from '../src/config/database.js';

/**
 * Idempotent seed: safe to run many times.
 *
 *   npm run db:seed
 *
 * Creates the reference data the API needs to work (currencies, fees,
 * withdrawal limits, exchange rates) and a demo account to log in with.
 */

const DEMO_EMAIL = 'demo@pagwave.com';
const DEMO_PASSWORD = 'Demo@1234';

type CurrencySeed = {
  code: string;
  name: string;
  symbol: string;
  type: 'FIAT' | 'CRYPTO';
  decimals: number;
  network?: 'TRON' | 'SOLANA' | 'ETHEREUM';
  minimumDeposit?: string;
  minimumWithdrawal?: string;
  withdrawalFee?: string;
};

const currencies: CurrencySeed[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', type: 'FIAT', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', type: 'FIAT', decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', type: 'FIAT', decimals: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', type: 'FIAT', decimals: 2 },
  { code: 'COP', name: 'Colombian Peso', symbol: 'COP$', type: 'FIAT', decimals: 2 },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'ARS$', type: 'FIAT', decimals: 2 },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs', type: 'FIAT', decimals: 2 },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$', type: 'FIAT', decimals: 0 },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.D', type: 'FIAT', decimals: 2 },
  {
    code: 'USDT',
    name: 'Tether USD',
    symbol: '₮',
    type: 'CRYPTO',
    decimals: 6,
    network: 'TRON',
    minimumDeposit: '10',
    minimumWithdrawal: '20',
    withdrawalFee: '1',
  },
  {
    code: 'USDC',
    name: 'USD Coin',
    symbol: '$',
    type: 'CRYPTO',
    decimals: 6,
    network: 'SOLANA',
    minimumDeposit: '10',
    minimumWithdrawal: '20',
    withdrawalFee: '1',
  },
];

/**
 * Reference prices: how many units of each currency equal 1 USD.
 * Static development values — production must feed `exchange_rates`
 * from a live provider (Binance, CoinGecko, ECB, ...).
 */
const unitsPerUsd: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  BRL: 5.2,
  USDT: 1,
  USDC: 1,
};

const SPREAD = '0.005'; // 0.5% platform spread

async function seedCurrencies() {
  for (const currency of currencies) {
    const data = {
      name: currency.name,
      symbol: currency.symbol,
      type: currency.type,
      decimals: currency.decimals,
      network: currency.network ?? null,
      minimumDeposit: currency.minimumDeposit ?? '0',
      minimumWithdrawal: currency.minimumWithdrawal ?? '0',
      withdrawalFee: currency.withdrawalFee ?? '0',
      isActive: true,
    };

    await prisma.currency.upsert({
      where: { code: currency.code },
      update: data,
      create: { code: currency.code, ...data },
    });
  }
}

async function seedFees() {
  const fees = [
    // Internal transfers are free; the platform earns on exchange and withdrawals.
    { transactionType: 'TRANSFER_OUT', flatFee: '0', percentFee: '0', minFee: '0', maxFee: null },
    { transactionType: 'EXCHANGE', flatFee: '0', percentFee: '0.005', minFee: '0', maxFee: null },
    { transactionType: 'WITHDRAWAL', flatFee: '1', percentFee: '0.01', minFee: '1', maxFee: '50' },
  ] as const;

  for (const currency of currencies) {
    for (const fee of fees) {
      const data = {
        flatFee: fee.flatFee,
        percentFee: fee.percentFee,
        minFee: fee.minFee,
        maxFee: fee.maxFee,
        isActive: true,
      };

      await prisma.feeConfig.upsert({
        where: {
          transactionType_currencyCode: {
            transactionType: fee.transactionType,
            currencyCode: currency.code,
          },
        },
        update: data,
        create: { transactionType: fee.transactionType, currencyCode: currency.code, ...data },
      });
    }
  }
}

async function seedWithdrawalLimits() {
  // Limits are expressed in USD-equivalent units and scaled per currency.
  const tiers = [
    { kycLevel: 0, daily: 0, monthly: 0, single: 0 },
    { kycLevel: 1, daily: 1_000, monthly: 5_000, single: 500 },
    { kycLevel: 2, daily: 10_000, monthly: 50_000, single: 5_000 },
    { kycLevel: 3, daily: 100_000, monthly: 1_000_000, single: 50_000 },
  ];

  for (const currency of currencies) {
    const scale = unitsPerUsd[currency.code] ?? 1;

    for (const tier of tiers) {
      const data = {
        dailyLimit: (tier.daily * scale).toFixed(2),
        monthlyLimit: (tier.monthly * scale).toFixed(2),
        singleTxMax: (tier.single * scale).toFixed(2),
      };

      await prisma.withdrawalLimit.upsert({
        where: { kycLevel_currencyCode: { kycLevel: tier.kycLevel, currencyCode: currency.code } },
        update: data,
        create: { kycLevel: tier.kycLevel, currencyCode: currency.code, ...data },
      });
    }
  }
}

async function seedExchangeRates() {
  const rows = await prisma.currency.findMany({
    where: { code: { in: Object.keys(unitsPerUsd) } },
  });
  const byCode = new Map(rows.map(row => [row.code, row]));

  // `exchange_rates` has no natural unique key and is append-only in production,
  // so only the rows this seed owns are replaced.
  await prisma.exchangeRate.deleteMany({ where: { source: 'seed' } });

  const validAt = new Date();
  const data = [];

  for (const from of Object.keys(unitsPerUsd)) {
    for (const to of Object.keys(unitsPerUsd)) {
      if (from === to) continue;

      const fromCurrency = byCode.get(from);
      const toCurrency = byCode.get(to);
      if (!fromCurrency || !toCurrency) continue;

      // 1 FROM = (unitsPerUsd[TO] / unitsPerUsd[FROM]) TO
      const rate = unitsPerUsd[to] / unitsPerUsd[from];

      data.push({
        fromCurrencyId: fromCurrency.id,
        toCurrencyId: toCurrency.id,
        rate: rate.toFixed(12),
        spread: SPREAD,
        source: 'seed',
        validAt,
      });
    }
  }

  await prisma.exchangeRate.createMany({ data });
}

async function seedDemoAccount() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { role: 'ADMIN' },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Pagwave',
          lastName: 'Admin',
          displayName: 'Pagwave Admin',
          avatarHash: 'PA',
          country: 'BRA',
          kycStatus: 'APPROVED',
          kycLevel: 2,
          kycApprovedAt: new Date(),
        },
      },
    },
  });

  const openingBalances: Record<string, string> = {
    USD: '2500.00',
    EUR: '800.00',
    BRL: '12000.00',
    USDT: '1500.000000',
  };

  const wallets = new Map<string, string>();

  for (const [code, balance] of Object.entries(openingBalances)) {
    const currency = await prisma.currency.findUniqueOrThrow({ where: { code } });
    const type = currency.type === 'CRYPTO' ? 'CRYPTO' : 'FIAT';

    const wallet = await prisma.wallet.upsert({
      where: {
        unique_user_currency_wallet: { userId: user.id, currencyId: currency.id, type },
      },
      update: {},
      create: {
        userId: user.id,
        currencyId: currency.id,
        type,
        label: `${code} Wallet`,
        isDefault: code === 'USD',
        balance,
        availableBalance: balance,
      },
    });

    wallets.set(code, wallet.id);
  }

  // A small history so the dashboard has something to show.
  const history = [
    {
      ref: 'TXN-SEED000001',
      type: 'DEPOSIT',
      currency: 'BRL',
      amount: '12000.00',
      description: 'Deposit via PIX',
      daysAgo: 12,
    },
    {
      ref: 'TXN-SEED000002',
      type: 'DEPOSIT',
      currency: 'USD',
      amount: '2500.00',
      description: 'Deposit via WIRE',
      daysAgo: 9,
    },
    {
      ref: 'TXN-SEED000003',
      type: 'DEPOSIT',
      currency: 'USDT',
      amount: '1500.000000',
      description: 'Deposit via CRYPTO',
      daysAgo: 6,
    },
    {
      ref: 'TXN-SEED000004',
      type: 'DEPOSIT',
      currency: 'EUR',
      amount: '800.00',
      description: 'Deposit via WIRE',
      daysAgo: 3,
    },
  ] as const;

  for (const entry of history) {
    const createdAt = new Date(Date.now() - entry.daysAgo * 24 * 60 * 60 * 1000);

    await prisma.transaction.upsert({
      where: { referenceId: entry.ref },
      update: {},
      create: {
        referenceId: entry.ref,
        userId: user.id,
        type: entry.type,
        status: 'COMPLETED',
        toWalletId: wallets.get(entry.currency),
        amount: entry.amount,
        fee: '0',
        netAmount: entry.amount,
        currencyCode: entry.currency,
        description: entry.description,
        completedAt: createdAt,
        createdAt,
      },
    });
  }
}

async function main() {
  console.log('Seeding Pagwave database...');

  await seedCurrencies();
  console.log('  currencies ........ ok');

  await seedFees();
  console.log('  fee configs ....... ok');

  await seedWithdrawalLimits();
  console.log('  withdrawal limits . ok');

  await seedExchangeRates();
  console.log('  exchange rates .... ok');

  await seedDemoAccount();
  console.log(`  demo account ...... ok  (${DEMO_EMAIL} / ${DEMO_PASSWORD})`);

  console.log('Done.');
}

main()
  .catch(error => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
