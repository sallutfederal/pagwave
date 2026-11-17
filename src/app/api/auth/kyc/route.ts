import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { privateJson } from "@/server/api";

const ALLOWED_KYC_TYPES = [
  "IDENTITY_FRONT",
  "IDENTITY_BACK",
  "PASSPORT",
  "SELFIE",
  "PROOF_OF_ADDRESS",
  "CORPORATE_REGISTRATION",
  "TAX_ID",
] as const;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const SubmitKycJsonSchema = z.object({
  type: z.enum(ALLOWED_KYC_TYPES),
  fileUrl: z.string().trim().min(3, "Informe o arquivo do documento."),
  documentNumber: z.string().trim().max(100).optional(),
});

const KycTypeSchema = z.enum(ALLOWED_KYC_TYPES);

export function GET() {
  return privateJson(() => backendFetch("/auth/kyc"));
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) {
      return Response.json(
        { error: "VALIDATION_ERROR", message: "Formulário inválido." },
        { status: 400 },
      );
    }

    const parsedType = KycTypeSchema.safeParse(form.get("type"));
    if (!parsedType.success) {
      return Response.json(
        { error: "VALIDATION_ERROR", message: "Tipo de documento KYC inválido." },
        { status: 400 },
      );
    }

    const fileEntry = form.get("file");
    if (!(fileEntry instanceof File)) {
      return Response.json(
        { error: "VALIDATION_ERROR", message: "Selecione um arquivo para envio." },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(fileEntry.type)) {
      return Response.json(
        { error: "VALIDATION_ERROR", message: "Formato inválido. Envie JPG, PNG, WebP ou PDF." },
        { status: 400 },
      );
    }

    if (fileEntry.size === 0 || fileEntry.size > MAX_FILE_BYTES) {
      return Response.json(
        { error: "VALIDATION_ERROR", message: "O arquivo deve ter no máximo 5 MB." },
        { status: 400 },
      );
    }

    const docNumberRaw = form.get("documentNumber");
    const documentNumber =
      typeof docNumberRaw === "string" && docNumberRaw.trim()
        ? docNumberRaw.trim().slice(0, 100)
        : undefined;

    const bytes = Buffer.from(await fileEntry.arrayBuffer());

    return privateJson(() =>
      backendFetch("/auth/kyc", {
        method: "POST",
        body: {
          type: parsedType.data,
          fileName: fileEntry.name.slice(0, 255),
          mimeType: fileEntry.type,
          fileBase64: bytes.toString("base64"),
          documentNumber,
        },
      }),
    );
  }

  const raw = await request.json().catch(() => null);
  const parsed = SubmitKycJsonSchema.safeParse(raw);
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
