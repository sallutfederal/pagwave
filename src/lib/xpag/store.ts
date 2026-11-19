import "server-only";
import crypto from "node:crypto";
import { getBackendBaseUrl } from "@/lib/backend";
import { XPagError } from "@/lib/xpag/client";
import type { XPagCurrency } from "@/lib/xpag/currencies";

export type BeneficiaryRecord = {
  id: string;
  userId: string;
  label: string;
  currency: XPagCurrency;
  rail: string;
  summary: string;
  details: Record<string, string>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WalletActivityKind =
  | "cashin"
  | "cashout"
  | "conversion"
  | "med"
  | "transfer_out"
  | "transfer_in";

export type WalletActivityRecord = {
  id: string;
  userId: string;
  kind: WalletActivityKind;
  currency: string;
  toCurrency?: string;
  amount?: number;
  convertedAmount?: number;
  rail?: string;
  status: string;
  externalId?: string;
  transactionId?: string;
  requestNumber?: string;
  e2e?: string;
  origin?: string;
  destinationSummary?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type WebhookEventRecord = {
  id: string;
  dedupKey: string;
  type: string;
  status: string;
  currency?: string;
  amount?: number;
  e2e?: string;
  externalId?: string;
  transactionId?: string;
  requestNumber?: string;
  origin?: string;
  verifiedSignature: boolean;
  receivedAt: string;
  payload: Record<string, unknown>;
};

export type UserApiKeyRecord = {
  id: string;
  userId: string;
  label: string;
  clientId: string;
  secretHash: string;
  secretEncrypted: string;
  secretPreview: string;
  webhookUrl?: string;
  requestCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiRequestLogRecord = {
  id: string;
  userId: string;
  clientId: string;
  method: string;
  endpoint: string;
  currency?: string;
  statusCode: number;
  ok: boolean;
  errorCode?: string;
  latencyMs: number;
  createdAt: string;
};

export type AdminSystemConfig = {
  environmentMode: "auto" | "sandbox" | "production";
  feeBps: number;
  disabledCurrencies: string[];
  maintenanceNotice: string;
  globalWebhookUrl: string;
  updatedAt: string;
};

const INTERNAL_SECRET =
  process.env.INTERNAL_SERVICE_SECRET || "pagwave-internal-dev-secret-change-me";

async function gatewayStrict<T>(
  pathSuffix: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<T> {
  const cleanSuffix = pathSuffix.replace(/^\//, "");
  const targetUrl = new URL(`gateway/${cleanSuffix}`, `${getBackendBaseUrl()}/`).toString();

  let res: Response;
  try {
    res = await fetch(targetUrl, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SECRET,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new XPagError(
      "Serviço de banco de dados indisponível no momento. Tente novamente.",
      503,
      "ledger_unavailable",
    );
  }

  const json = (await res.json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;

  if (!res.ok) {
    throw new XPagError(
      json?.message || "Operação financeira recusada.",
      res.status,
      json?.error || `http_${res.status}`,
    );
  }

  return json as T;
}

// ── Encryption Helpers ──────────────────────────────────────────────────────

function deriveEncryptionKey(): Buffer {
  const seed =
    process.env.PAGWAVE_KEY_MASTER_SECRET ||
    process.env.XPAG_CLIENT_SECRET ||
    "pagwave-local-key-vault-v1";
  return crypto.createHash("sha256").update(seed).digest();
}

function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptSecret(encoded: string): string {
  const [ivHex, tagHex, dataHex] = encoded.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Encrypted secret format invalid");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    deriveEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret, "utf8").digest("hex");
}

function buildNewKeyPair(
  userId: string,
  existing?: Partial<UserApiKeyRecord>,
): UserApiKeyRecord {
  const now = new Date().toISOString();
  const clientId = `pw_live_${crypto.randomBytes(10).toString("hex")}`;
  const rawSecret = `pw_sec_${crypto.randomBytes(24).toString("hex")}`;
  return {
    id: existing?.id || `key_${crypto.randomUUID().slice(0, 12)}`,
    userId,
    label: existing?.label || "Chave Principal de Produção",
    clientId,
    secretHash: hashSecret(rawSecret),
    secretEncrypted: encryptSecret(rawSecret),
    secretPreview: `pw_sec_••••••••••••${rawSecret.slice(-6)}`,
    webhookUrl: existing?.webhookUrl,
    requestCount: 0,
    lastUsedAt: undefined,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

// ── Beneficiaries (Saved Payout Keys & Crypto Addresses) ────────────────────

export async function listBeneficiaries(userId: string): Promise<BeneficiaryRecord[]> {
  const pg = await gatewayStrict<{ beneficiaries: BeneficiaryRecord[] }>(
    `/beneficiaries/${encodeURIComponent(userId)}`,
  );
  return pg.beneficiaries;
}

export async function getBeneficiaryById(
  userId: string,
  id: string,
): Promise<BeneficiaryRecord | null> {
  const pg = await gatewayStrict<{ beneficiary: BeneficiaryRecord | null }>(
    `/beneficiaries/${encodeURIComponent(userId)}/${encodeURIComponent(id)}`,
  );
  return pg.beneficiary;
}

export async function createBeneficiary(input: {
  userId: string;
  label: string;
  currency: XPagCurrency;
  rail: string;
  summary: string;
  details: Record<string, string>;
  isDefault?: boolean;
}): Promise<BeneficiaryRecord> {
  const pg = await gatewayStrict<{ beneficiary: BeneficiaryRecord }>("/beneficiaries", {
    method: "POST",
    body: input,
  });
  return pg.beneficiary;
}

export async function setDefaultBeneficiary(
  userId: string,
  id: string,
): Promise<BeneficiaryRecord | null> {
  const pg = await gatewayStrict<{ beneficiary: BeneficiaryRecord | null }>(
    `/beneficiaries/${encodeURIComponent(userId)}/${encodeURIComponent(id)}/default`,
    { method: "PATCH" },
  );
  return pg.beneficiary;
}

export async function deleteBeneficiary(userId: string, id: string): Promise<boolean> {
  const pg = await gatewayStrict<{ deleted: boolean }>(
    `/beneficiaries/${encodeURIComponent(userId)}/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  return pg.deleted;
}

// ── Wallet Activities & Feed ────────────────────────────────────────────────

export async function recordWalletActivity(
  input: Omit<WalletActivityRecord, "id" | "createdAt" | "updatedAt">,
): Promise<WalletActivityRecord> {
  const pg = await gatewayStrict<{ activity: WalletActivityRecord }>("/activities", {
    method: "POST",
    body: input,
  });
  return pg.activity;
}

export async function updateActivityStatusByRef(params: {
  requestNumber?: string;
  transactionId?: string;
  externalId?: string;
  status: string;
  e2e?: string;
  metadata?: Record<string, unknown>;
}) {
  const pg = await gatewayStrict<{ updated: boolean }>("/activities/update-by-ref", {
    method: "POST",
    body: params,
  });
  return pg.updated;
}

export async function listWalletFeed(userId: string) {
  return gatewayStrict<{
    activities: WalletActivityRecord[];
    webhooks: WebhookEventRecord[];
  }>(`/feed/${encodeURIComponent(userId)}`);
}

export async function recordXPagWebhook(input: {
  payload: Record<string, unknown>;
  verifiedSignature: boolean;
}): Promise<{
  duplicate: boolean;
  event: WebhookEventRecord;
  forwardTargets?: Array<{ userId: string; webhookUrl: string; clientSecret: string }>;
}> {
  const p = input.payload;
  const type = String(p.type ?? p.event ?? "unknown");
  const status = String(p.status ?? "unknown");
  const e2e = typeof p.e2e === "string" ? p.e2e : undefined;
  const externalId = typeof p.external_id === "string" ? p.external_id : undefined;
  const transactionId =
    typeof p.transaction_id === "string" ? p.transaction_id : undefined;
  const requestNumber =
    typeof p.request_number === "string" ? p.request_number : undefined;
  const origin = typeof p.origin === "string" ? p.origin : undefined;

  const dedupKey = e2e
    ? `${type}:${e2e}:${status}`
    : `${type}:${transactionId ?? requestNumber ?? externalId ?? crypto.randomUUID()}:${status}`;

  const pg = await gatewayStrict<{
    duplicate: boolean;
    event: WebhookEventRecord;
    forwardTargets: Array<{ userId: string; webhookUrl: string; secretEncrypted: string }>;
  }>("/webhooks/record", {
    method: "POST",
    body: {
      dedupKey,
      type,
      status,
      currency: typeof p.currency === "string" ? p.currency : undefined,
      amount: typeof p.amount === "number" ? p.amount : undefined,
      e2e,
      externalId,
      transactionId,
      requestNumber,
      origin,
      verifiedSignature: input.verifiedSignature,
      payload: p,
    },
  });

  const decryptedTargets = pg.forwardTargets
    .map((t) => {
      try {
        return {
          userId: t.userId,
          webhookUrl: t.webhookUrl,
          clientSecret: decryptSecret(t.secretEncrypted),
        };
      } catch {
        return null;
      }
    })
    .filter((t): t is { userId: string; webhookUrl: string; clientSecret: string } => t !== null);

  return {
    duplicate: pg.duplicate,
    event: pg.event,
    forwardTargets: decryptedTargets,
  };
}

export async function notifyWebhookDeliveryFailure(userId: string, url: string): Promise<void> {
  await gatewayStrict("/notifications/webhook-failure", {
    method: "POST",
    body: { userId, url },
  }).catch(() => undefined);
}

// ── Pagwave Gateway Credentials ─────────────────────────────────────────────

export async function getOrCreateUserApiKey(userId: string): Promise<UserApiKeyRecord> {
  const candidate = buildNewKeyPair(userId);
  const pg = await gatewayStrict<{ credential: UserApiKeyRecord }>("/credentials/ensure", {
    method: "POST",
    body: {
      userId,
      label: candidate.label,
      clientId: candidate.clientId,
      secretHash: candidate.secretHash,
      secretEncrypted: candidate.secretEncrypted,
      secretPreview: candidate.secretPreview,
    },
  });
  return pg.credential;
}

export async function rotateUserApiKey(userId: string): Promise<UserApiKeyRecord> {
  const fresh = buildNewKeyPair(userId);
  const pg = await gatewayStrict<{ credential: UserApiKeyRecord }>("/credentials/rotate", {
    method: "POST",
    body: {
      userId,
      clientId: fresh.clientId,
      secretHash: fresh.secretHash,
      secretEncrypted: fresh.secretEncrypted,
      secretPreview: fresh.secretPreview,
    },
  });
  return pg.credential;
}

export async function updateUserApiKeyConfig(
  userId: string,
  patch: { label?: string; webhookUrl?: string },
): Promise<UserApiKeyRecord> {
  await getOrCreateUserApiKey(userId);
  const pg = await gatewayStrict<{ credential: UserApiKeyRecord }>(
    `/credentials/${encodeURIComponent(userId)}`,
    { method: "PATCH", body: patch },
  );
  return pg.credential;
}

export async function revealUserApiSecret(userId: string): Promise<string> {
  const key = await getOrCreateUserApiKey(userId);
  return decryptSecret(key.secretEncrypted);
}

export async function authenticatePagwaveApiKey(
  clientId: string,
  clientSecret: string,
): Promise<{ userId: string; key: UserApiKeyRecord } | null> {
  const cleanId = clientId.trim();
  const cleanSecret = clientSecret.trim();
  if (!cleanId || !cleanSecret) return null;

  const pgLookup = await gatewayStrict<{
    credential: UserApiKeyRecord | null;
    suspended: boolean;
  }>(`/credentials/by-client/${encodeURIComponent(cleanId)}`);

  const record = pgLookup.credential;
  if (!record || pgLookup.suspended) return null;

  const expectedBuf = Buffer.from(record.secretHash, "utf8");
  const candidateBuf = Buffer.from(hashSecret(cleanSecret), "utf8");
  if (
    expectedBuf.length !== candidateBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, candidateBuf)
  ) {
    return null;
  }

  await gatewayStrict(`/credentials/${encodeURIComponent(record.id)}/hit`, {
    method: "POST",
  }).catch(() => undefined);

  return { userId: record.userId, key: record };
}

export async function recordApiGatewayLog(
  input: Omit<ApiRequestLogRecord, "id" | "createdAt">,
): Promise<void> {
  await gatewayStrict("/logs", { method: "POST", body: input }).catch(() => undefined);
}

export async function listUserApiGatewayLogs(userId: string): Promise<ApiRequestLogRecord[]> {
  const pg = await gatewayStrict<{ logs: ApiRequestLogRecord[] }>(
    `/logs/${encodeURIComponent(userId)}`,
  );
  return pg.logs;
}

// ── Admin Helpers ───────────────────────────────────────────────────────────

export async function getAdminConfig(): Promise<AdminSystemConfig> {
  const pg = await gatewayStrict<{ config: AdminSystemConfig }>("/admin/settings");
  return pg.config;
}

export async function updateAdminConfig(
  patch: Partial<Omit<AdminSystemConfig, "updatedAt">>,
): Promise<AdminSystemConfig> {
  const pg = await gatewayStrict<{ config: AdminSystemConfig }>("/admin/settings", {
    method: "PATCH",
    body: patch,
  });
  return pg.config;
}

export async function isAccountSuspended(userId: string): Promise<boolean> {
  const res = await gatewayStrict<{ suspended: boolean }>(
    `/users/${encodeURIComponent(userId)}/status`,
  );
  return res.suspended;
}

export async function getAdminOverviewSnapshot() {
  return gatewayStrict<{
    totalUsers: number;
    activeApiKeys: number;
    totalApiRequests: number;
    totalBeneficiaries: number;
    totalActivities: number;
    cashinCount: number;
    cashoutCount: number;
    conversionCount: number;
    medActiveCount: number;
    webhookCount: number;
    volumeByCurrency: Record<string, { cashin: number; cashout: number; count: number }>;
    recentActivities: WalletActivityRecord[];
    recentWebhooks: WebhookEventRecord[];
    adminConfig: AdminSystemConfig;
  }>("/admin/overview");
}

export async function listAdminGlobalTransactions() {
  return gatewayStrict<{
    activities: Array<WalletActivityRecord & { ownerEmail: string; ownerName: string }>;
    webhooks: WebhookEventRecord[];
  }>("/admin/transactions");
}

export async function adminUpdateActivityStatusById(activityId: string, status: string) {
  const pg = await gatewayStrict<{ activity: WalletActivityRecord }>(
    `/admin/transactions/${encodeURIComponent(activityId)}`,
    { method: "PATCH", body: { status } },
  );
  return pg.activity;
}

export async function listAdminGlobalIntegrations() {
  return gatewayStrict<{
    keys: Array<{
      id: string;
      userId: string;
      ownerEmail: string;
      ownerName: string;
      label: string;
      clientId: string;
      secretPreview: string;
      webhookUrl: string;
      requestCount: number;
      lastUsedAt: string | null;
      createdAt: string;
    }>;
    logs: ApiRequestLogRecord[];
    webhooks: WebhookEventRecord[];
  }>("/admin/integrations");
}

// ── Per-User Database Ledger ────────────────────────────────────────────────

export async function getUserLedgerBalances(userId: string) {
  return gatewayStrict<{
    balances: Record<string, { available: number; blocked: number }>;
    blocked_currencies: string[];
    environmentMode: "auto" | "sandbox" | "production";
    kycLevel: number;
    kycStatus: string;
    updated_at: string;
  }>(`/ledger/${userId}/balances`);
}

export async function reserveCashoutInLedger(input: {
  userId: string;
  currency: XPagCurrency;
  amount: number;
  externalId: string;
  rail?: string;
  description?: string;
}) {
  return gatewayStrict<{ ok: boolean; txId: string; referenceId: string }>(
    "/ledger/reserve-cashout",
    {
      method: "POST",
      body: input,
    },
  );
}

export async function releaseCashoutInLedger(input: {
  userId: string;
  externalId: string;
  reason?: string;
}) {
  return gatewayStrict<{ ok: boolean; released: boolean }>(
    "/ledger/release-cashout",
    {
      method: "POST",
      body: input,
    },
  );
}

export async function settleConversionInLedger(input: {
  userId: string;
  fromCurrency: XPagCurrency;
  toCurrency: XPagCurrency;
  fromAmount: number;
  toAmount: number;
  rate?: number;
  externalId: string;
}) {
  return gatewayStrict<{ ok: boolean }>("/ledger/settle-conversion", {
    method: "POST",
    body: input,
  });
}
