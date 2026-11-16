import { z } from "zod";
import { withPagwaveApiAuth } from "@/lib/pagwave-gateway";
import { XPagError, simulateXPagSandbox } from "@/lib/xpag/client";
import { updateActivityStatusByRef } from "@/lib/xpag/store";

const PublicSimulateSchema = z.object({
  request_number: z.string().trim().min(1, "Informe request_number."),
  status: z.enum(["paid", "failed", "expired"]),
  amount: z.number().positive().optional(),
});

export function POST(request: Request) {
  return withPagwaveApiAuth(request, "POST /api/v1/sandbox/simulate", async () => {
    const raw = await request.json().catch(() => null);
    const parsed = PublicSimulateSchema.safeParse(raw);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Parâmetros inválidos para simulação Sandbox.",
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

    return {
      status: 200,
      body: {
        ok: true,
        ...result,
      },
    };
  });
}

