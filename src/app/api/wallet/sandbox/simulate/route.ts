import { z } from "zod";
import { xpagPrivateJson } from "@/lib/xpag/api-helper";
import { XPagError, simulateXPagSandbox } from "@/lib/xpag/client";
import { updateActivityStatusByRef } from "@/lib/xpag/store";

const SimulateSchema = z.object({
  request_number: z.string().trim().min(1, "Informe o request_number da cobrança."),
  status: z.enum(["paid", "failed", "expired"]),
  amount: z.number().positive().optional(),
});

export function POST(request: Request) {
  return xpagPrivateJson(async () => {
    const body = await request.json().catch(() => null);
    const parsed = SimulateSchema.safeParse(body);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Parâmetros inválidos para simulação.",
        400,
        "validation_error",
      );
    }

    const result = await simulateXPagSandbox(parsed.data);

    await updateActivityStatusByRef({
      requestNumber: parsed.data.request_number,
      status: parsed.data.status,
      e2e: typeof result.e2e === "string" ? result.e2e : undefined,
      metadata: result,
    });

    return { ok: true, result };
  });
}

