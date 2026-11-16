import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { privateJson } from "@/server/api";

const SubmitKycSchema = z.object({
  type: z.enum([
    "IDENTITY_FRONT",
    "IDENTITY_BACK",
    "PASSPORT",
    "SELFIE",
    "PROOF_OF_ADDRESS",
    "CORPORATE_REGISTRATION",
    "TAX_ID",
  ]),
  fileUrl: z.string().trim().min(3, "Informe o link ou identificador do arquivo."),
  documentNumber: z.string().trim().max(100).optional(),
});

export function GET() {
  return privateJson(() => backendFetch("/auth/kyc"));
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = SubmitKycSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Dados de KYC inválidos." },
      { status: 400 },
    );
  }

  return privateJson(() =>
    backendFetch("/auth/kyc", {
      method: "POST",
      body: parsed.data,
    }),
  );
}

