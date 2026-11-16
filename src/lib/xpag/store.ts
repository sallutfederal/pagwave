import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { BACKEND_URL } from "@/lib/backend";
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

export type WalletActivityKind = "cashin" | "cashout" | "conversion" | "med";

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

export type AdminAccountRecord = {
  userId: string;
  email: string;
  name: string;
  role: string;
  kycStatus: string;
  kycLevel: number;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  suspended: boolean;
  notes?: string;
  lastSeenAt: string;
  updatedAt: string;
};

export type AdminSystemConfig = {
  environmentMode: "auto" | "sandbox" | "production";
  feeBps: number;
  disabledCurrencies: string[];
  maintenanceNotice: string;
  globalWebhookUrl: string;
  updatedAt: string;
};

type StoreData = {
  beneficiaries: BeneficiaryRecord[];
  activities: WalletActivityRecord[];
  webhooks: WebhookEventRecord[];
  processedDedupKeys: string[];
  apiKeys: UserApiKeyRecord[];
  apiLogs: ApiRequestLogRecord[];
  accounts: AdminAccountRecord[];
  adminConfig: AdminSystemConfig;
};

const STORE_FILE = path.join(process.cwd(), ".data", "xpag-store.json");
const INTERNAL_SECRET =
  process.env.INTERNAL_SERVICE_SECRET || "pagwave-internal-dev-secret-change-me";

const DEFAULT_ADMIN_CONFIG: AdminSystemConfig = {
  environmentMode: "auto",
  feeBps: 90,
  disabledCurrencies: [],
  maintenanceNotice: "",
  globalWebhookUrl: "",
  updatedAt: new Date(0).toISOString(),
};

const EMPTY_STORE: StoreData = {
  beneficiaries: [],
  activities: [],
  webhooks: [],
  processedDedupKeys: [],
  apiKeys: [],
  apiLogs: [],
  accounts: [],
  adminConfig: { ...DEFAULT_ADMIN_CONFIG },
};

let writeQueue: Promise<unknown> = Promise.resolve();

async function gatewayBackend<T>(
  pathSuffix: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/gateway${pathSuffix}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SECRET,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function readStoreFile(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      beneficiaries: Array.isArray(parsed.beneficiaries) ? parsed.beneficiaries : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      webhooks: Array.isArray(parsed.webhooks) ? parsed.webhooks : [],
      processedDedupKeys: Array.isArray(parsed.processedDedupKeys)
        ? parsed.processedDedupKeys
        : [],
      apiKeys: Array.isArray(parsed.apiKeys) ? parsed.apiKeys : [],
      apiLogs: Array.isArray(parsed.apiLogs) ? parsed.apiLogs : [],
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      adminConfig: parsed.adminConfig
        ? { ...DEFAULT_ADMIN_CONFIG, ...parsed.adminConfig }
        : { ...DEFAULT_ADMIN_CONFIG },
    };
  } catch {
    return {
      beneficiaries: [],
      activities: [],
      webhooks: [],
      processedDedupKeys: [],
      apiKeys: [],
      apiLogs: [],
      accounts: [],
      adminConfig: { ...DEFAULT_ADMIN_CONFIG },
    };
  }
}

async function writeStoreFile(data: StoreData): Promise<void> {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2), "utf8");
}

function withStoreLock<T>(
  fn: (store: StoreData) => Promise<{ next?: StoreData; result: T }>,
): Promise<T> {
  const run = async () => {
    const current = await readStoreFile();
    const { next, result } = await fn(current);
    if (next) await writeStoreFile(next);
    return result;
  };
  const queued = writeQueue.then(run, run);
  writeQueue = queued.then(
    () => undefined,
    () => undefined,
  );
  return queued;
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
  const pg = await gatewayBackend<{ beneficiaries: BeneficiaryRecord[] }>(
    `/beneficiaries/${encodeURIComponent(userId)}`,
  );
  if (pg) return pg.beneficiaries;

  const store = await readStoreFile();
  return store.beneficiaries
    .filter((b) => b.userId === userId)
    .sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) ||
        b.createdAt.localeCompare(a.createdAt),
    );
}

export async function getBeneficiaryById(
  userId: string,
  id: string,
): Promise<BeneficiaryRecord | null> {
  const pg = await gatewayBackend<{ beneficiary: BeneficiaryRecord | null }>(
    `/beneficiaries/${encodeURIComponent(userId)}/${encodeURIComponent(id)}`,
  );
  if (pg) return pg.beneficiary;

  const store = await readStoreFile();
  return store.beneficiaries.find((b) => b.userId === userId && b.id === id) ?? null;
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
  const pg = await gatewayBackend<{ beneficiary: BeneficiaryRecord }>("/beneficiaries", {
    method: "POST",
    body: input,
  });
  if (pg?.beneficiary) return pg.beneficiary;

  return withStoreLock(async (store) => {
    const now = new Date().toISOString();
    const hasExistingSameCurrency = store.beneficiaries.some(
      (b) => b.userId === input.userId && b.currency === input.currency,
    );
    const shouldBeDefault = input.isDefault ?? !hasExistingSameCurrency;

    const nextBeneficiaries = shouldBeDefault
      ? store.beneficiaries.map((b) =>
          b.userId === input.userId && b.currency === input.currency
            ? { ...b, isDefault: false, updatedAt: now }
            : b,
        )
      : [...store.beneficiaries];

    const record: BeneficiaryRecord = {
      id: `ben_${crypto.randomUUID().slice(0, 12)}`,
      userId: input.userId,
      label: input.label.trim(),
      currency: input.currency,
      rail: input.rail,
      summary: input.summary,
      details: input.details,
      isDefault: shouldBeDefault,
      createdAt: now,
      updatedAt: now,
    };

    nextBeneficiaries.unshift(record);
    return { next: { ...store, beneficiaries: nextBeneficiaries }, result: record };
  });
}

export async function setDefaultBeneficiary(
  userId: string,
  id: string,
): Promise<BeneficiaryRecord | null> {
  const pg = await gatewayBackend<{ beneficiary: BeneficiaryRecord | null }>(
    `/beneficiaries/${encodeURIComponent(userId)}/${encodeURIComponent(id)}/default`,
    { method: "PATCH" },
  );
  if (pg) return pg.beneficiary;

  return withStoreLock(async (store) => {
    const target = store.beneficiaries.find((b) => b.userId === userId && b.id === id);
    if (!target) return { result: null };

    const now = new Date().toISOString();
    let updated: BeneficiaryRecord | null = null;
    const beneficiaries = store.beneficiaries.map((b) => {
      if (b.userId !== userId || b.currency !== target.currency) return b;
      const nextDefault = b.id === id;
      const item = { ...b, isDefault: nextDefault, updatedAt: now };
      if (nextDefault) updated = item;
      return item;
    });

    return { next: { ...store, beneficiaries }, result: updated };
  });
}

export async function deleteBeneficiary(userId: string, id: string): Promise<boolean> {
  const pg = await gatewayBackend<{ deleted: boolean }>(
    `/beneficiaries/${encodeURIComponent(userId)}/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (pg) return pg.deleted;

  return withStoreLock(async (store) => {
    const exists = store.beneficiaries.some((b) => b.userId === userId && b.id === id);
    if (!exists) return { result: false };
    const beneficiaries = store.beneficiaries.filter(
      (b) => !(b.userId === userId && b.id === id),
    );
    return { next: { ...store, beneficiaries }, result: true };
  });
}

// ── Wallet Activities & Feed ────────────────────────────────────────────────

export async function recordWalletActivity(
  input: Omit<WalletActivityRecord, "id" | "createdAt" | "updatedAt">,
): Promise<WalletActivityRecord> {
  const pg = await gatewayBackend<{ activity: WalletActivityRecord }>("/activities", {
    method: "POST",
    body: input,
  });
  if (pg?.activity) return pg.activity;

  return withStoreLock(async (store) => {
    const now = new Date().toISOString();
    const record: WalletActivityRecord = {
      ...input,
      id: `act_${crypto.randomUUID().slice(0, 12)}`,
      createdAt: now,
      updatedAt: now,
    };
    const activities = [record, ...store.activities].slice(0, 200);
    return { next: { ...store, activities }, result: record };
  });
}

export async function updateActivityStatusByRef(params: {
  requestNumber?: string;
  transactionId?: string;
  externalId?: string;
  status: string;
  e2e?: string;
  metadata?: Record<string, unknown>;
}) {
  const pg = await gatewayBackend<{ updated: boolean }>("/activities/update-by-ref", {
    method: "POST",
    body: params,
  });
  if (pg) return pg.updated;

  return withStoreLock(async (store) => {
    const now = new Date().toISOString();
    let changed = false;
    const activities = store.activities.map((act) => {
      const match =
        (params.requestNumber && act.requestNumber === params.requestNumber) ||
        (params.transactionId && act.transactionId === params.transactionId) ||
        (params.externalId && act.externalId === params.externalId);
      if (!match) return act;
      changed = true;
      return {
        ...act,
        status: params.status,
        e2e: params.e2e ?? act.e2e,
        metadata: params.metadata ? { ...act.metadata, ...params.metadata } : act.metadata,
        updatedAt: now,
      };
    });

    if (!changed) return { result: false };
    return { next: { ...store, activities }, result: true };
  });
}

export async function listWalletFeed(userId: string) {
  const pg = await gatewayBackend<{
    activities: WalletActivityRecord[];
    webhooks: WebhookEventRecord[];
  }>(`/feed/${encodeURIComponent(userId)}`);
  if (pg) return pg;

  const store = await readStoreFile();
  return {
    activities: store.activities.filter((a) => a.userId === userId),
    webhooks: store.webhooks.slice(0, 40),
  };
}

export async function recordXPagWebhook(input: {
  payload: Record<string, unknown>;
  verifiedSignature: boolean;
}): Promise<{
  duplicate: boolean;
  event: WebhookEventRecord;
  forwardTargets?: Array<{ webhookUrl: string; clientSecret: string }>;
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

  const pg = await gatewayBackend<{
    duplicate: boolean;
    event: WebhookEventRecord;
    forwardTargets: Array<{ webhookUrl: string; secretEncrypted: string }>;
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

  if (pg) {
    const decryptedTargets = pg.forwardTargets
      .map((t) => {
        try {
          return {
            webhookUrl: t.webhookUrl,
            clientSecret: decryptSecret(t.secretEncrypted),
          };
        } catch {
          return null;
        }
      })
      .filter((t): t is { webhookUrl: string; clientSecret: string } => t !== null);

    return {
      duplicate: pg.duplicate,
      event: pg.event,
      forwardTargets: decryptedTargets,
    };
  }

  return withStoreLock<{
    duplicate: boolean;
    event: WebhookEventRecord;
    forwardTargets?: Array<{ webhookUrl: string; clientSecret: string }>;
  }>(async (store) => {
    const duplicate = store.processedDedupKeys.includes(dedupKey);
    const now = new Date().toISOString();

    const event: WebhookEventRecord = {
      id: `whk_${crypto.randomUUID().slice(0, 12)}`,
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
      receivedAt: now,
      payload: p,
    };

    if (duplicate) return { result: { duplicate: true, event } };

    const processedDedupKeys = [dedupKey, ...store.processedDedupKeys].slice(0, 500);
    const webhooks = [event, ...store.webhooks].slice(0, 100);
    const activities = store.activities.map((act) => {
      const matchesByUniqueId =
        (requestNumber && act.requestNumber === requestNumber) ||
        (transactionId && act.transactionId === transactionId) ||
        (origin !== "static" && externalId && act.externalId === externalId);
      if (!matchesByUniqueId) return act;
      return {
        ...act,
        status: type === "med" ? "med_blocked" : type === "med_closed" ? "med_closed" : status,
        e2e: e2e ?? act.e2e,
        updatedAt: now,
      };
    });

    return {
      next: { ...store, processedDedupKeys, webhooks, activities },
      result: { duplicate: false, event },
    };
  });
}

// ── Pagwave Gateway Credentials ─────────────────────────────────────────────

export async function getOrCreateUserApiKey(userId: string): Promise<UserApiKeyRecord> {
  const candidate = buildNewKeyPair(userId);
  const pg = await gatewayBackend<{ credential: UserApiKeyRecord }>("/credentials/ensure", {
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
  if (pg?.credential) return pg.credential;

  const store = await readStoreFile();
  const existing = store.apiKeys.find((k) => k.userId === userId);
  if (existing) return existing;

  return withStoreLock(async (locked) => {
    const again = locked.apiKeys.find((k) => k.userId === userId);
    if (again) return { result: again };
    return {
      next: { ...locked, apiKeys: [candidate, ...locked.apiKeys] },
      result: candidate,
    };
  });
}

export async function rotateUserApiKey(userId: string): Promise<UserApiKeyRecord> {
  const fresh = buildNewKeyPair(userId);
  const pg = await gatewayBackend<{ credential: UserApiKeyRecord }>("/credentials/rotate", {
    method: "POST",
    body: {
      userId,
      clientId: fresh.clientId,
      secretHash: fresh.secretHash,
      secretEncrypted: fresh.secretEncrypted,
      secretPreview: fresh.secretPreview,
    },
  });
  if (pg?.credential) return pg.credential;

  return withStoreLock(async (store) => {
    const existing = store.apiKeys.find((k) => k.userId === userId);
    const rotated = buildNewKeyPair(userId, existing);
    const others = store.apiKeys.filter((k) => k.userId !== userId);
    return { next: { ...store, apiKeys: [rotated, ...others] }, result: rotated };
  });
}

export async function updateUserApiKeyConfig(
  userId: string,
  patch: { label?: string; webhookUrl?: string },
): Promise<UserApiKeyRecord> {
  await getOrCreateUserApiKey(userId);
  const pg = await gatewayBackend<{ credential: UserApiKeyRecord }>(
    `/credentials/${encodeURIComponent(userId)}`,
    { method: "PATCH", body: patch },
  );
  if (pg?.credential) return pg.credential;

  return withStoreLock(async (store) => {
    const now = new Date().toISOString();
    let updated: UserApiKeyRecord | undefined;
    const apiKeys = store.apiKeys.map((k) => {
      if (k.userId !== userId) return k;
      updated = {
        ...k,
        label: patch.label !== undefined ? patch.label.trim() || k.label : k.label,
        webhookUrl:
          patch.webhookUrl !== undefined
            ? patch.webhookUrl.trim() || undefined
            : k.webhookUrl,
        updatedAt: now,
      };
      return updated;
    });

    return { next: { ...store, apiKeys }, result: updated! };
  });
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

  const pgLookup = await gatewayBackend<{
    credential: UserApiKeyRecord | null;
    suspended: boolean;
  }>(`/credentials/by-client/${encodeURIComponent(cleanId)}`);

  if (pgLookup) {
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
    await gatewayBackend(`/credentials/${encodeURIComponent(record.id)}/hit`, {
      method: "POST",
    });
    return { userId: record.userId, key: record };
  }

  const store = await readStoreFile();
  const record = store.apiKeys.find((k) => k.clientId === cleanId);
  if (!record) return null;

  const expectedBuf = Buffer.from(record.secretHash, "utf8");
  const candidateBuf = Buffer.from(hashSecret(cleanSecret), "utf8");
  if (
    expectedBuf.length !== candidateBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, candidateBuf)
  ) {
    return null;
  }

  return withStoreLock(async (locked) => {
    const now = new Date().toISOString();
    let latest: UserApiKeyRecord | undefined;
    const apiKeys = locked.apiKeys.map((k) => {
      if (k.id !== record.id) return k;
      latest = {
        ...k,
        requestCount: (k.requestCount ?? 0) + 1,
        lastUsedAt: now,
        updatedAt: now,
      };
      return latest;
    });
    return {
      next: { ...locked, apiKeys },
      result: latest ? { userId: latest.userId, key: latest } : null,
    };
  });
}

export async function recordApiGatewayLog(
  input: Omit<ApiRequestLogRecord, "id" | "createdAt">,
): Promise<void> {
  const pg = await gatewayBackend("/logs", { method: "POST", body: input });
  if (pg) return;

  await withStoreLock(async (store) => {
    const entry: ApiRequestLogRecord = {
      ...input,
      id: `log_${crypto.randomUUID().slice(0, 12)}`,
      createdAt: new Date().toISOString(),
    };
    return {
      next: { ...store, apiLogs: [entry, ...store.apiLogs].slice(0, 300) },
      result: undefined,
    };
  });
}

export async function listUserApiGatewayLogs(userId: string): Promise<ApiRequestLogRecord[]> {
  const pg = await gatewayBackend<{ logs: ApiRequestLogRecord[] }>(
    `/logs/${encodeURIComponent(userId)}`,
  );
  if (pg) return pg.logs;

  const store = await readStoreFile();
  return store.apiLogs.filter((l) => l.userId === userId).slice(0, 30);
}

export async function findWebhookForwardTargets(refs: {
  requestNumber?: string;
  transactionId?: string;
  externalId?: string;
  origin?: string;
}): Promise<Array<{ webhookUrl: string; clientSecret: string }>> {
  const store = await readStoreFile();
  const matchedActivities = store.activities.filter(
    (act) =>
      (refs.requestNumber && act.requestNumber === refs.requestNumber) ||
      (refs.transactionId && act.transactionId === refs.transactionId) ||
      (refs.origin !== "static" && refs.externalId && act.externalId === refs.externalId),
  );

  const seenUrls = new Set<string>();
  const targets: Array<{ webhookUrl: string; clientSecret: string }> = [];

  for (const act of matchedActivities) {
    const userKey = store.apiKeys.find((k) => k.userId === act.userId);
    const metaUrl =
      typeof act.metadata?.clientWebhookUrl === "string"
        ? act.metadata.clientWebhookUrl
        : undefined;
    const url = metaUrl || userKey?.webhookUrl;
    if (!url || seenUrls.has(url) || !userKey) continue;
    seenUrls.add(url);
    try {
      targets.push({
        webhookUrl: url,
        clientSecret: decryptSecret(userKey.secretEncrypted),
      });
    } catch {
      // Skip corrupted encrypted secrets.
    }
  }

  return targets;
}

// ── Admin Helpers ───────────────────────────────────────────────────────────

export async function syncAccountSnapshot(input: {
  id: string;
  email: string;
  name: string;
  role: string;
  kycStatus: string;
  kycLevel: number;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}): Promise<void> {
  // Accounts now live in PostgreSQL; keep local fallback mirror only if file already exists.
  await withStoreLock(async (store) => {
    const existing = store.accounts.find((a) => a.userId === input.id);
    if (
      existing &&
      existing.email === input.email &&
      existing.name === input.name &&
      existing.role === input.role &&
      existing.kycStatus === input.kycStatus &&
      existing.kycLevel === input.kycLevel &&
      existing.emailVerified === input.emailVerified &&
      existing.twoFactorEnabled === input.twoFactorEnabled
    ) {
      return { result: undefined };
    }

    const now = new Date().toISOString();
    const updated: AdminAccountRecord = {
      userId: input.id,
      email: input.email,
      name: input.name,
      role: input.role,
      kycStatus: input.kycStatus,
      kycLevel: input.kycLevel,
      emailVerified: input.emailVerified,
      twoFactorEnabled: input.twoFactorEnabled,
      suspended: existing?.suspended ?? false,
      notes: existing?.notes,
      lastSeenAt: now,
      updatedAt: now,
    };
    const others = store.accounts.filter((a) => a.userId !== input.id);
    return { next: { ...store, accounts: [updated, ...others] }, result: undefined };
  });
}

export async function getAdminConfig(): Promise<AdminSystemConfig> {
  const pg = await gatewayBackend<{ config: AdminSystemConfig }>("/admin/settings");
  if (pg?.config) return pg.config;

  const store = await readStoreFile();
  return store.adminConfig;
}

export async function updateAdminConfig(
  patch: Partial<Omit<AdminSystemConfig, "updatedAt">>,
): Promise<AdminSystemConfig> {
  const pg = await gatewayBackend<{ config: AdminSystemConfig }>("/admin/settings", {
    method: "PATCH",
    body: patch,
  });
  if (pg?.config) return pg.config;

  return withStoreLock(async (store) => {
    const nextConfig: AdminSystemConfig = {
      ...store.adminConfig,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return { next: { ...store, adminConfig: nextConfig }, result: nextConfig };
  });
}

export async function isAccountSuspended(userId: string): Promise<boolean> {
  const store = await readStoreFile();
  return Boolean(store.accounts.find((a) => a.userId === userId)?.suspended);
}

export async function listAdminUsersWithMetrics() {
  const store = await readStoreFile();
  const knownIds = new Set<string>(store.accounts.map((a) => a.userId));
  for (const k of store.apiKeys) knownIds.add(k.userId);
  for (const b of store.beneficiaries) knownIds.add(b.userId);
  for (const a of store.activities) knownIds.add(a.userId);

  const users = Array.from(knownIds).map((userId) => {
    const acct = store.accounts.find((a) => a.userId === userId);
    const key = store.apiKeys.find((k) => k.userId === userId);
    const txCount = store.activities.filter((a) => a.userId === userId).length;
    const beneficiaryCount = store.beneficiaries.filter((b) => b.userId === userId).length;

    return {
      userId,
      email: acct?.email ?? `usuario_${userId.slice(0, 6)}`,
      name: acct?.name ?? `Conta ${userId.slice(0, 8)}`,
      role: acct?.role ?? "USER",
      kycStatus: acct?.kycStatus ?? "NOT_STARTED",
      kycLevel: acct?.kycLevel ?? 0,
      emailVerified: acct?.emailVerified ?? false,
      twoFactorEnabled: acct?.twoFactorEnabled ?? false,
      suspended: acct?.suspended ?? false,
      notes: acct?.notes ?? "",
      lastSeenAt: acct?.lastSeenAt ?? key?.updatedAt ?? null,
      apiKeyPrefix: key?.clientId ?? null,
      apiRequestCount: key?.requestCount ?? 0,
      txCount,
      beneficiaryCount,
    };
  });

  return users.sort((a, b) => (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? ""));
}

export async function updateAdminUserRecord(
  userId: string,
  patch: {
    kycStatus?: string;
    kycLevel?: number;
    suspended?: boolean;
    notes?: string;
  },
) {
  return withStoreLock(async (store) => {
    const now = new Date().toISOString();
    const existing = store.accounts.find((a) => a.userId === userId);
    const nextRecord: AdminAccountRecord = {
      userId,
      email: existing?.email ?? `usuario_${userId.slice(0, 6)}`,
      name: existing?.name ?? `Conta ${userId.slice(0, 8)}`,
      role: existing?.role ?? "USER",
      kycStatus: patch.kycStatus ?? existing?.kycStatus ?? "NOT_STARTED",
      kycLevel: patch.kycLevel ?? existing?.kycLevel ?? 0,
      emailVerified: existing?.emailVerified ?? false,
      twoFactorEnabled: existing?.twoFactorEnabled ?? false,
      suspended: patch.suspended ?? existing?.suspended ?? false,
      notes: patch.notes ?? existing?.notes,
      lastSeenAt: existing?.lastSeenAt ?? now,
      updatedAt: now,
    };
    const others = store.accounts.filter((a) => a.userId !== userId);
    return { next: { ...store, accounts: [nextRecord, ...others] }, result: nextRecord };
  });
}

export async function getAdminOverviewSnapshot() {
  const pg = await gatewayBackend<{
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
  if (pg) return pg;

  const store = await readStoreFile();
  const volumeByCurrency: Record<
    string,
    { cashin: number; cashout: number; count: number }
  > = {};

  for (const act of store.activities) {
    if (!volumeByCurrency[act.currency]) {
      volumeByCurrency[act.currency] = { cashin: 0, cashout: 0, count: 0 };
    }
    volumeByCurrency[act.currency].count += 1;
    if (act.kind === "cashin" && typeof act.amount === "number") {
      volumeByCurrency[act.currency].cashin += act.amount;
    } else if (act.kind === "cashout" && typeof act.amount === "number") {
      volumeByCurrency[act.currency].cashout += act.amount;
    }
  }

  return {
    totalUsers: (await listAdminUsersWithMetrics()).length,
    activeApiKeys: store.apiKeys.length,
    totalApiRequests: store.apiKeys.reduce((acc, k) => acc + (k.requestCount ?? 0), 0),
    totalBeneficiaries: store.beneficiaries.length,
    totalActivities: store.activities.length,
    cashinCount: store.activities.filter((a) => a.kind === "cashin").length,
    cashoutCount: store.activities.filter((a) => a.kind === "cashout").length,
    conversionCount: store.activities.filter((a) => a.kind === "conversion").length,
    medActiveCount: store.activities.filter((a) => a.status === "med_blocked").length,
    webhookCount: store.webhooks.length,
    volumeByCurrency,
    recentActivities: store.activities.slice(0, 10),
    recentWebhooks: store.webhooks.slice(0, 8),
    adminConfig: store.adminConfig,
  };
}

export async function listAdminGlobalTransactions() {
  const pg = await gatewayBackend<{
    activities: Array<WalletActivityRecord & { ownerEmail: string; ownerName: string }>;
    webhooks: WebhookEventRecord[];
  }>("/admin/transactions");
  if (pg) return pg;

  const store = await readStoreFile();
  const accountMap = new Map(store.accounts.map((a) => [a.userId, a]));

  return {
    activities: store.activities.map((act) => {
      const owner = accountMap.get(act.userId);
      return {
        ...act,
        ownerEmail: owner?.email ?? act.userId,
        ownerName: owner?.name ?? act.userId,
      };
    }),
    webhooks: store.webhooks.slice(0, 80),
  };
}

export async function adminUpdateActivityStatusById(activityId: string, status: string) {
  const pg = await gatewayBackend<{ activity: WalletActivityRecord }>(
    `/admin/transactions/${encodeURIComponent(activityId)}`,
    { method: "PATCH", body: { status } },
  );
  if (pg?.activity) return pg.activity;

  return withStoreLock(async (store) => {
    const now = new Date().toISOString();
    let updated: WalletActivityRecord | null = null;
    const activities = store.activities.map((a) => {
      if (a.id !== activityId) return a;
      updated = { ...a, status, updatedAt: now };
      return updated;
    });
    if (!updated) return { result: null };
    return { next: { ...store, activities }, result: updated };
  });
}

export async function listAdminGlobalIntegrations() {
  const pg = await gatewayBackend("/admin/integrations");
  if (pg) return pg;

  const store = await readStoreFile();
  const accountMap = new Map(store.accounts.map((a) => [a.userId, a]));

  const keys = store.apiKeys.map((k) => {
    const owner = accountMap.get(k.userId);
    return {
      id: k.id,
      userId: k.userId,
      ownerEmail: owner?.email ?? k.userId,
      ownerName: owner?.name ?? k.userId,
      label: k.label,
      clientId: k.clientId,
      secretPreview: k.secretPreview,
      webhookUrl: k.webhookUrl ?? "",
      requestCount: k.requestCount,
      lastUsedAt: k.lastUsedAt ?? null,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
    };
  });

  return {
    keys,
    logs: store.apiLogs.slice(0, 80),
    webhooks: store.webhooks.slice(0, 60),
  };
}

export function __getEmptyStoreForTypes() {
  return EMPTY_STORE;
}
