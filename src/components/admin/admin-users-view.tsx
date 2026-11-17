"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  FileCheck2,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

type AdminUserRow = {
  userId: string;
  email: string;
  name: string;
  role: string;
  status?: string;
  kycStatus: string;
  kycLevel: number;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  suspended: boolean;
  lastSeenAt: string | null;
  apiKeyPrefix: string | null;
  apiRequestCount: number;
  txCount: number;
  beneficiaryCount: number;
};

type AdminKycDoc = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: string;
  status: string;
  fileUrl: string;
  fileName?: string | null;
  fileSize?: number | null;
  reviewNote: string | null;
  createdAt: string;
};

export function AdminUsersView() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [kycDocs, setKycDocs] = useState<AdminKycDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        users?: AdminUserRow[];
        kycDocuments?: AdminKycDoc[];
        message?: string;
      } | null;
      if (cancelled) return;
      if (res.ok && json?.ok && json.users) {
        setUsers(json.users);
        setKycDocs(json.kycDocuments ?? []);
        setErrorMsg(null);
      } else {
        setErrorMsg(json?.message || "Erro ao carregar lista de usuários.");
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === "ALL" || u.role.toUpperCase() === roleFilter;
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.userId.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, query, roleFilter]);

  const patchAdminUser = async (payload: Record<string, unknown>, busyKey: string, okText: string) => {
    setBusyId(busyKey);
    setErrorMsg(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Não foi possível atualizar.");
        return;
      }
      setNotice(okText);
      setRefreshTick((t) => t + 1);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1 max-w-sm">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail ou ID"
              className="bg-surface-subtle border-line text-foreground h-10 rounded-full pl-10 text-xs"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="bg-surface-subtle border-line h-10 w-40 rounded-full px-3.5 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as roles</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
              <SelectItem value="USER">USER</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            setRefreshTick((t) => t + 1);
          }}
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {notice ? (
        <Card className="border-emerald-400/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
          {notice}
        </Card>
      ) : null}

      {errorMsg ? (
        <Card className="border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
          {errorMsg}
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-white/10 bg-surface-subtle">
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">KYC</th>
                <th className="px-4 py-3 font-medium">Uso da Plataforma</th>
                <th className="px-4 py-3 font-medium text-right">Status & Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                    {loading ? "Carregando usuários..." : "Nenhuma conta encontrada."}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isBusy = busyId === u.userId;
                  return (
                    <tr key={u.userId} className="hover:bg-surface-subtle/50">
                      <td className="px-4 py-3">
                        <p className="text-foreground font-semibold">{u.name}</p>
                        <p className="text-muted-foreground">{u.email}</p>
                        <p className="text-muted-foreground text-[10px]">
                          E-mail: {u.emailVerified ? "Verificado" : "Pendente"} · 2FA:{" "}
                          {u.twoFactorEnabled ? "Ativo" : "Off"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={u.role}
                          disabled={isBusy}
                          onValueChange={(nextRole) =>
                            void patchAdminUser(
                              { userId: u.userId, role: nextRole },
                              u.userId,
                              `Role de ${u.email} alterada para ${nextRole}.`,
                            )
                          }
                        >
                          <SelectTrigger className="bg-surface-subtle border-line h-8 w-36 rounded-lg px-2.5 font-mono text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">USER</SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                            <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={u.kycStatus}
                          disabled={isBusy}
                          onValueChange={(nextStatus) =>
                            void patchAdminUser(
                              {
                                userId: u.userId,
                                kycStatus: nextStatus,
                                kycLevel:
                                  nextStatus === "APPROVED"
                                    ? Math.max(u.kycLevel, 2)
                                    : u.kycLevel,
                              },
                              u.userId,
                              `KYC de ${u.email} atualizado para ${nextStatus}.`,
                            )
                          }
                        >
                          <SelectTrigger className="bg-surface-subtle border-line h-8 w-36 rounded-lg px-2.5 text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOT_STARTED">NOT_STARTED</SelectItem>
                            <SelectItem value="PENDING">PENDING</SelectItem>
                            <SelectItem value="IN_REVIEW">IN_REVIEW</SelectItem>
                            <SelectItem value="APPROVED">APPROVED</SelectItem>
                            <SelectItem value="REJECTED">REJECTED</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-muted-foreground mt-1 text-[10px]">
                          Nível KYC: {u.kycLevel}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">
                        <p>
                          API:{" "}
                          <span className="text-foreground font-mono">
                            {u.apiKeyPrefix || "Sem chave"}
                          </span>
                        </p>
                        <p>
                          {u.apiRequestCount} reqs · {u.txCount} ops · {u.beneficiaryCount} destinos
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {u.suspended ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() =>
                                void patchAdminUser(
                                  { userId: u.userId, suspended: false },
                                  u.userId,
                                  `Conta ${u.email} reativada.`,
                                )
                              }
                              className="h-8 border-emerald-500/30 text-xs text-emerald-300"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Reativar
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() =>
                                void patchAdminUser(
                                  { userId: u.userId, suspended: true },
                                  u.userId,
                                  `Conta ${u.email} suspensa e sessões encerradas.`,
                                )
                              }
                              className="h-8 border-red-500/30 text-xs text-red-300 hover:bg-red-500/15"
                            >
                              <Ban className="size-3.5" />
                              Suspender
                            </Button>
                          )}
                          <span
                            title={u.suspended ? "Conta suspensa" : "Conta ativa"}
                            className={cn(
                              "inline-flex size-7 items-center justify-center rounded-full",
                              u.suspended
                                ? "bg-red-500/15 text-red-300"
                                : "bg-emerald-500/15 text-emerald-300",
                            )}
                          >
                            <ShieldCheck className="size-3.5" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* KYC Documents Review Queue */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <FileCheck2 className="text-accent size-4" />
          <h3 className="text-foreground text-sm font-semibold">
            Fila de Documentos KYC ({kycDocs.length})
          </h3>
        </div>

        {kycDocs.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-xs">
            Nenhum documento KYC enviado até o momento.
          </p>
        ) : (
          <div className="space-y-2.5">
            {kycDocs.map((doc) => (
              <div
                key={doc.id}
                className="border-line bg-surface-subtle flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-foreground font-semibold">
                    {doc.userName} ({doc.userEmail}) —{" "}
                    <span className="font-mono text-accent">{doc.type}</span>
                  </p>
                  <p className="text-muted-foreground truncate font-mono text-[11px]">
                    Arquivo: {doc.fileName ?? doc.fileUrl}
                    {doc.fileSize ? ` (${Math.max(1, Math.round(doc.fileSize / 1024))} KB)` : ""}
                    {doc.fileUrl.startsWith("/") || doc.fileUrl.startsWith("http") ? (
                      <>
                        {" · "}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent underline underline-offset-2"
                        >
                          Visualizar
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold",
                      doc.status === "APPROVED"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : doc.status === "REJECTED"
                          ? "bg-red-500/15 text-red-300"
                          : "bg-amber-500/15 text-amber-300",
                    )}
                  >
                    {doc.status}
                  </span>

                  {doc.status !== "APPROVED" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === doc.id}
                      onClick={() =>
                        void patchAdminUser(
                          { docId: doc.id, kycStatus: "APPROVED", kycLevel: 2 },
                          doc.id,
                          `Documento KYC de ${doc.userEmail} aprovado.`,
                        )
                      }
                      className="h-8 border-emerald-500/30 text-emerald-300"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Aprovar
                    </Button>
                  ) : null}

                  {doc.status !== "REJECTED" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === doc.id}
                      onClick={() =>
                        void patchAdminUser(
                          {
                            docId: doc.id,
                            kycStatus: "REJECTED",
                            reviewNote: "Documento ilegível ou expirado.",
                          },
                          doc.id,
                          `Documento KYC de ${doc.userEmail} reprovado.`,
                        )
                      }
                      className="h-8 border-red-500/30 text-red-300"
                    >
                      <XCircle className="size-3.5" />
                      Reprovar
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
