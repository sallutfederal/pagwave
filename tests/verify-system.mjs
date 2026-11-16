import assert from "node:assert/strict";
import crypto from "node:crypto";
import { describe, it } from "node:test";

const WEB_URL = process.env.WEB_URL || "http://localhost:3000";
const XPAG_SECRET = process.env.XPAG_CLIENT_SECRET || "202620262026202620262026";

async function loginSession(email = "demo@pagwave.com", password = "Demo@1234") {
  const res = await fetch(`${WEB_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(res.status, 200, "Login demo deve retornar HTTP 200");
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");
  assert.ok(cookieHeader.includes("pw_access"), "Deve receber cookie pw_access de sessão");
  return cookieHeader;
}

describe("Pagwave End-to-End Verification", () => {
  it("bloqueia /api/admin/* sem sessão e permite para ADMIN", async () => {
    const unauth = await fetch(`${WEB_URL}/api/admin/users`);
    assert.equal(unauth.status, 401);

    const cookie = await loginSession();
    const res = await fetch(`${WEB_URL}/api/admin/users`, {
      headers: { Cookie: cookie },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);
    assert.ok(
      json.users.some((u) => u.email === "demo@pagwave.com"),
      "Admin users deve listar contas do PostgreSQL",
    );

    const profRes = await fetch(`${WEB_URL}/api/auth/profile`, {
      headers: { Cookie: cookie },
    });
    assert.equal(profRes.status, 200);

    const kycRes = await fetch(`${WEB_URL}/api/auth/kyc`, {
      headers: { Cookie: cookie },
    });
    assert.equal(kycRes.status, 200);
  });

  it("gera credencial exclusiva Pagwave e autentica POST /api/v1/cashin -> XPag", async () => {
    const bad = await fetch(`${WEB_URL}/api/v1/cashin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": "pw_live_invalido",
        "X-Client-Secret": "segredo_errado",
      },
      body: JSON.stringify({ currency: "BRL", amount: 50 }),
    });
    assert.equal(bad.status, 401);

    const cookie = await loginSession();
    const keyRes = await fetch(`${WEB_URL}/api/integrations/keys?reveal=1`, {
      headers: { Cookie: cookie },
    });
    assert.equal(keyRes.status, 200);
    const keyJson = await keyRes.json();
    assert.equal(keyJson.ok, true);
    assert.ok(keyJson.credential.clientId.startsWith("pw_live_"));
    assert.ok(keyJson.credential.secret.startsWith("pw_sec_"));

    const chargeRes = await fetch(`${WEB_URL}/api/v1/cashin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": keyJson.credential.clientId,
        "X-Client-Secret": keyJson.credential.secret,
      },
      body: JSON.stringify({
        currency: "BRL",
        amount: 25,
        description: "Teste E2E",
      }),
    });
    assert.equal(chargeRes.status, 200);
    const charge = await chargeRes.json();
    assert.equal(charge.ok, true);
    assert.ok(charge.request_number || charge.external_id);
  });

  it("valida assinatura HMAC-SHA256 e deduplica webhooks repetidos por e2e", async () => {
    const rawBody = JSON.stringify({
      type: "cashin",
      status: "paid",
      currency: "BRL",
      amount: 15,
      e2e: `E2E_TEST_${Date.now()}`,
    });

    const invalid = await fetch(`${WEB_URL}/api/webhooks/xpag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": "assinatura_invalida",
      },
      body: rawBody,
    });
    assert.equal(invalid.status, 401);

    const sig = crypto
      .createHmac("sha256", XPAG_SECRET)
      .update(rawBody, "utf8")
      .digest("hex");

    const first = await fetch(`${WEB_URL}/api/webhooks/xpag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": sig,
      },
      body: rawBody,
    });
    assert.equal(first.status, 200);
    const firstJson = await first.json();
    assert.equal(firstJson.ok, true);
    assert.equal(firstJson.duplicate, false);

    const second = await fetch(`${WEB_URL}/api/webhooks/xpag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": sig,
      },
      body: rawBody,
    });
    assert.equal(second.status, 200);
    const secondJson = await second.json();
    assert.equal(secondJson.duplicate, true);
  });
});
