import "server-only";
import crypto from "node:crypto";

const RETRY_DELAYS_MS = [0, 2000, 6000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends a signed webhook POST to a merchant endpoint with bounded exponential retries.
 */
export async function dispatchSignedWebhook(params: {
  url: string;
  clientSecret: string;
  rawBody: string;
}): Promise<boolean> {
  const signature = crypto
    .createHmac("sha256", params.clientSecret)
    .update(params.rawBody, "utf8")
    .digest("hex");

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    const delay = RETRY_DELAYS_MS[attempt];
    if (delay > 0) await sleep(delay);

    try {
      const res = await fetch(params.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Pagwave-Attempt": String(attempt + 1),
        },
        body: params.rawBody,
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return true;
    } catch {
      // Retry on network/timeout errors.
    }
  }

  return false;
}

export function enqueueWebhookDeliveries(
  targets: Array<{ webhookUrl: string; clientSecret: string }>,
  rawBody: string,
) {
  for (const target of targets) {
    void dispatchSignedWebhook({
      url: target.webhookUrl,
      clientSecret: target.clientSecret,
      rawBody,
    });
  }
}

