"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  FileCheck2,
  LogOut,
  RefreshCw,
  ShieldAlert,
  UploadCloud,
  X,
} from "lucide-react";

import { useLogout } from "@/components/auth/logout";
import { LogoLockup } from "@/components/brand/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { prepareKycFileForUpload } from "@/lib/kyc-upload";
import { cn } from "@/lib/utils";

type KycDoc = {
  id: string;
  type: string;
  status: string;
  fileUrl: string;
  fileName?: string | null;
  reviewNote?: string | null;
  createdAt: string;
};

export function KycGateModal({
  email,
  initialStatus,
  initialLevel,
}: {
  email: string;
  initialStatus: string;
  initialLevel: number;
}) {
  const router = useRouter();
  const { logout, pending: loggingOut } = useLogout();
  const [kycStatus, setKycStatus] = useState(initialStatus);
  const [kycLevel, setKycLevel] = useState(initialLevel);
  const [docs, setDocs] = useState<KycDoc[]>([]);
  const [checking, setChecking] = useState(false);

  const [docType, setDocType] = useState("IDENTITY_FRONT");
  const [docNumber, setDocNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const syncKycStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/auth/kyc", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json().catch(() => null)) as {
        kycStatus?: string;
        kycLevel?: number;
        documents?: KycDoc[];
      } | null;
      if (!json) return;
      if (json.kycStatus) setKycStatus(json.kycStatus);
      if (typeof json.kycLevel === "number") setKycLevel(json.kycLevel);
      if (json.documents) setDocs(json.documents);
      if (json.kycStatus === "APPROVED") {
        router.refresh();
      }
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    const poll = () => {
      void fetch("/api/auth/kyc", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then(
          (
            json: {
              kycStatus?: string;
              kycLevel?: number;
              documents?: KycDoc[];
            } | null,
          ) => {
            if (!active || !json) return;
            if (json.kycStatus) setKycStatus(json.kycStatus);
            if (typeof json.kycLevel === "number") setKycLevel(json.kycLevel);
            if (json.documents) setDocs(json.documents);
            if (json.kycStatus === "APPROVED") {
              router.refresh();
            }
          },
        )
        .catch(() => undefined);
    };

    poll();
    const timer = window.setInterval(poll, 12_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedFile) {
      setErrorMsg("Selecione uma foto do documento (JPG, PNG, WebP) ou PDF para continuar.");
      return;
    }

    setSubmitting(true);
    try {
      const prepared = await prepareKycFileForUpload(selectedFile);
      const form = new FormData();
      form.append("type", docType);
      form.append("file", prepared);
      if (docNumber.trim()) {
        form.append("documentNumber", docNumber.trim());
      }

      const res = await fetch("/api/auth/kyc", {
        method: "POST",
        body: form,
      });
      const json = (await res.json().catch(() => null)) as {
        document?: KycDoc;
        message?: string;
      } | null;

      if (!res.ok || !json?.document) {
        setErrorMsg(json?.message || "Não foi possível enviar seu documento agora.");
        return;
      }

      setDocs((prev) => [json.document!, ...prev]);
      setKycStatus("PENDING");
      setDocNumber("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccessMsg(
        "Documento enviado! Aguarde a aprovação de um administrador para liberar o acesso ao sistema.",
      );
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao processar documento KYC.");
    } finally {
      setSubmitting(false);
    }
  }

  const latestRejectionNote = docs.find((d) => d.status === "REJECTED")?.reviewNote;
  const isPending = kycStatus === "PENDING" || kycStatus === "IN_REVIEW";
  const isRejected = kycStatus === "REJECTED";

  return (
    <div className="bg-background app-atmosphere relative flex min-h-dvh flex-col">
      <header className="bg-background/80 border-line sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <LogoLockup size={28} />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loggingOut}
              onClick={() => void logout()}
            >
              <LogOut className="size-3.5" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <Card className="w-full space-y-5 p-6 sm:p-8" role="dialog" aria-modal="true">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-2xl border",
                  isRejected
                    ? "border-red-500/35 bg-red-500/10 text-red-500"
                    : isPending
                      ? "border-amber-500/35 bg-amber-500/10 text-amber-500"
                      : "border-accent/30 bg-accent-soft text-accent",
                )}
              >
                {isRejected ? (
                  <AlertTriangle className="size-5" />
                ) : isPending ? (
                  <Clock className="size-5" />
                ) : (
                  <ShieldAlert className="size-5" />
                )}
              </span>
              <div>
                <h1 className="text-foreground text-lg font-semibold">
                  {isRejected
                    ? "Verificação KYC recusada — reenvio obrigatório"
                    : isPending
                      ? "Verificação KYC em análise"
                      : "Envie seu KYC para liberar o acesso"}
                </h1>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {isRejected
                    ? "Seu envio anterior precisa ser corrigido. Envie um novo documento legível abaixo para que um administrador libere sua conta."
                    : isPending
                      ? `Recebemos seus documentos para a conta ${email}. O acesso ao painel permanece bloqueado até um administrador aprovar sua verificação.`
                      : `Olá (${email}). Por segurança regulatória, o acesso ao sistema fica bloqueado até você enviar seus documentos de identidade (KYC) e receber aprovação do administrador.`}
                </p>
              </div>
            </div>

            <span
              className={cn(
                "rounded-full px-3 py-1 font-mono text-[11px] font-semibold",
                isRejected
                  ? "bg-red-500/15 text-red-600 dark:text-red-300"
                  : isPending
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "bg-surface-subtle text-muted-foreground border-line border",
              )}
            >
              {kycStatus} · {kycLevel}/3
            </span>
          </div>

          {latestRejectionNote && isRejected ? (
            <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs text-red-700 dark:text-red-200">
              <strong>Motivo informado pelo administrador:</strong> {latestRejectionNote}
            </div>
          ) : null}

          {errorMsg ? (
            <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-200">
              {errorMsg}
            </div>
          ) : null}

          {successMsg ? (
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-200">
              {successMsg}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  Tipo de documento
                </span>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="bg-surface-subtle border-line h-10 w-full rounded-xl px-3 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDENTITY_FRONT">RG / CNH (Frente)</SelectItem>
                    <SelectItem value="IDENTITY_BACK">RG / CNH (Verso)</SelectItem>
                    <SelectItem value="PASSPORT">Passaporte</SelectItem>
                    <SelectItem value="SELFIE">Selfie segurando o documento</SelectItem>
                    <SelectItem value="PROOF_OF_ADDRESS">Comprovante de residência</SelectItem>
                    <SelectItem value="CORPORATE_REGISTRATION">Contrato Social / CNPJ</SelectItem>
                    <SelectItem value="TAX_ID">Comprovante Fiscal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <span className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  Número do documento (CPF / RG / CNPJ)
                </span>
                <Input
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="Informe o número"
                  className="bg-surface-subtle border-line h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <span className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Foto ou PDF do documento (compactado automaticamente no envio)
              </span>
              <input
                ref={fileInputRef}
                id="kyc-gate-file-input"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] ?? null);
                  setErrorMsg(null);
                }}
                className="sr-only"
              />
              {selectedFile ? (
                <div className="bg-surface-subtle border-line flex h-11 items-center justify-between gap-2 rounded-xl border px-3 text-xs">
                  <span className="text-foreground truncate">
                    {selectedFile.name} ({Math.max(1, Math.round(selectedFile.size / 1024))} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    aria-label="Remover arquivo"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="kyc-gate-file-input"
                  className="bg-surface-subtle border-line text-muted-foreground hover:text-foreground hover:border-foreground/30 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-xs font-medium transition-colors"
                >
                  <UploadCloud className="size-4 shrink-0" />
                  <span>Tirar foto ou selecionar arquivo (JPG, PNG, WebP, PDF)...</span>
                </label>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={checking}
                onClick={() => void syncKycStatus()}
              >
                <RefreshCw className={cn("size-3.5", checking && "animate-spin")} />
                {checking ? "Verificando..." : "Verificar aprovação agora"}
              </Button>

              <Button type="submit" disabled={submitting || !selectedFile}>
                <FileCheck2 className="size-4" />
                {submitting
                  ? "Enviando documento..."
                  : isPending
                    ? "Enviar documento complementar"
                    : "Enviar KYC para aprovação"}
              </Button>
            </div>
          </form>

          {docs.length > 0 ? (
            <div className="border-line space-y-2 border-t pt-4">
              <p className="text-muted-foreground text-xs font-medium">
                Documentos enviados ({docs.length}):
              </p>
              <div className="max-h-44 space-y-2 overflow-y-auto">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="border-line bg-surface-subtle flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-foreground truncate font-medium">
                        {doc.type} {doc.fileName ? `· ${doc.fileName}` : ""}
                      </p>
                      {doc.reviewNote ? (
                        <p className="text-muted-foreground text-[11px]">{doc.reviewNote}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                          doc.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : doc.status === "REJECTED"
                              ? "bg-red-500/15 text-red-700 dark:text-red-300"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                        )}
                      >
                        {doc.status}
                      </span>
                      {doc.fileUrl.startsWith("/") || doc.fileUrl.startsWith("http") ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent inline-flex items-center gap-1 hover:underline"
                        >
                          Ver <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </main>
    </div>
  );
}
