"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  KeyRound,
  LogOut,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  SunMoon,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";

import { PageHeader } from "@/components/layout/page-header";
import { useI18n } from "@/components/locale-provider";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { useSession } from "@/components/session-provider";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";

const THEMES = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Obsidian", icon: Moon },
  { value: "system", label: "Sistema", icon: SunMoon },
] as const;

type KycDoc = {
  id: string;
  type: string;
  status: string;
  fileUrl: string;
  fileName?: string | null;
  fileSize?: number | null;
  reviewNote?: string | null;
  createdAt: string;
};

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-foreground text-[15px] font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 mb-4 text-xs">{description}</p>
      {children}
    </Card>
  );
}

export function SettingsView() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { locale, messages, modules, setLocale } = useI18n();
  const hydrated = useHydrated();
  const user = useSession();

  // Profile + notifications state loaded from PostgreSQL
  const [displayName, setDisplayName] = useState(user.name);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("BRA");
  const [companyName, setCompanyName] = useState("");
  const [companyTaxId, setCompanyTaxId] = useState("");
  const [prefs, setPrefs] = useState({
    paymentAlerts: true,
    weeklyDigest: true,
    productRenewals: false,
    securityNotices: true,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // KYC state
  const [kycStatus, setKycStatus] = useState(user.kycStatus);
  const [kycLevel, setKycLevel] = useState(user.kycLevel);
  const [kycDocs, setKycDocs] = useState<KycDoc[]>([]);
  const [kycType, setKycType] = useState("IDENTITY_FRONT");
  const [kycDocNumber, setKycDocNumber] = useState("");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const kycInputRef = useRef<HTMLInputElement>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycMsg, setKycMsg] = useState<string | null>(null);

  // Security panels
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [show2faPanel, setShow2faPanel] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState<string | null>(null);
  const [twoFaUri, setTwoFaUri] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [disable2faPwd, setDisable2faPwd] = useState("");
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [securityMsg, setSecurityMsg] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securityBusy, setSecurityBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [profRes, kycRes] = await Promise.allSettled([
        fetch("/api/auth/profile", { cache: "no-store" }),
        fetch("/api/auth/kyc", { cache: "no-store" }),
      ]);
      if (cancelled) return;

      if (profRes.status === "fulfilled" && profRes.value.ok) {
        const j = (await profRes.value.json().catch(() => null)) as {
          profile?: {
            displayName?: string | null;
            phone?: string | null;
            country?: string | null;
            companyName?: string | null;
            companyTaxId?: string | null;
          } | null;
          preferences?: Partial<typeof prefs>;
        } | null;
        if (!cancelled && j) {
          if (j.profile?.displayName) setDisplayName(j.profile.displayName);
          if (j.profile?.phone) setPhone(j.profile.phone);
          if (j.profile?.country) setCountry(j.profile.country);
          if (j.profile?.companyName) setCompanyName(j.profile.companyName);
          if (j.profile?.companyTaxId) setCompanyTaxId(j.profile.companyTaxId);
          if (j.preferences) {
            setPrefs((prev) => ({ ...prev, ...j.preferences }));
          }
        }
      }

      if (kycRes.status === "fulfilled" && kycRes.value.ok) {
        const k = (await kycRes.value.json().catch(() => null)) as {
          kycStatus?: string;
          kycLevel?: number;
          documents?: KycDoc[];
        } | null;
        if (!cancelled && k) {
          if (k.kycStatus) setKycStatus(k.kycStatus);
          if (k.kycLevel !== undefined) setKycLevel(k.kycLevel);
          if (k.documents) setKycDocs(k.documents);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfileAndPrefs() {
    setSavingProfile(true);
    setProfileNotice(null);
    setProfileError(null);
    try {
      const parts = displayName.trim().split(/\s+/);
      const firstName = parts[0] || displayName.trim();
      const lastName = parts.slice(1).join(" ");

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          displayName: displayName.trim(),
          phone: phone.trim(),
          country: country.trim(),
          companyName: companyName.trim(),
          companyTaxId: companyTaxId.trim(),
          preferences: prefs,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setProfileError(json.message || "Não foi possível salvar perfil.");
        return;
      }
      setProfileNotice("Perfil e preferências salvos no banco com sucesso.");
      router.refresh();
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSubmitKyc(e: React.FormEvent) {
    e.preventDefault();
    setKycMsg(null);
    setProfileError(null);

    if (!kycFile) {
      setProfileError("Selecione um arquivo JPG, PNG, WebP ou PDF para enviar.");
      return;
    }
    if (kycFile.size > 5 * 1024 * 1024) {
      setProfileError("O arquivo deve ter no máximo 5 MB.");
      return;
    }

    setSubmittingKyc(true);
    try {
      const form = new FormData();
      form.append("type", kycType);
      form.append("file", kycFile);
      if (kycDocNumber.trim()) {
        form.append("documentNumber", kycDocNumber.trim());
      }

      const res = await fetch("/api/auth/kyc", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as { document?: KycDoc; message?: string };
      if (!res.ok || !json.document) {
        setProfileError(json.message || "Falha ao enviar documento KYC.");
        return;
      }
      setKycDocs((prev) => [json.document!, ...prev]);
      setKycStatus("PENDING");
      setKycDocNumber("");
      setKycFile(null);
      if (kycInputRef.current) kycInputRef.current.value = "";
      setKycMsg("Documento enviado com segurança para análise de compliance.");
      router.refresh();
    } finally {
      setSubmittingKyc(false);
    }
  }

  async function runSecurity(body: Record<string, unknown>, onOk?: (json: Record<string, unknown>) => void) {
    setSecurityBusy(true);
    setSecurityMsg(null);
    setSecurityError(null);
    try {
      const res = await fetch("/api/auth/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        setSecurityError(String(json.message || "Erro na operação de segurança."));
        return;
      }
      onOk?.(json);
    } finally {
      setSecurityBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.pages.settingsTitle}
        description={messages.pages.settingsDesc}
        actions={
          <Button type="button" disabled={savingProfile} onClick={() => void saveProfileAndPrefs()}>
            <Save className="size-4" />
            {savingProfile ? "..." : modules.settings.saveProfileBtn}
          </Button>
        }
      />

      {profileNotice ? (
        <Card className="border-emerald-400/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
          {profileNotice}
        </Card>
      ) : null}

      {profileError ? (
        <Card className="border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
          {profileError}
        </Card>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <AvatarUpload />

          <SettingsCard
            title={modules.settings.profileTitle}
            description={messages.pages.settingsDesc}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">Nome de exibição</span>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">E-mail (identificador)</span>
                <Input type="email" value={user.email} readOnly />
              </label>
              <label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">Telefone</span>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+55 11 99999-8888"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">País (ISO-3)</span>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  maxLength={3}
                  placeholder="BRA"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">Empresa (opcional)</span>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Pagwave Ltda."
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">CNPJ / Tax ID (opcional)</span>
                <Input
                  value={companyTaxId}
                  onChange={(e) => setCompanyTaxId(e.target.value)}
                  placeholder="00.000.000/0001-00"
                />
              </label>
            </div>
          </SettingsCard>

          <SettingsCard
            title={modules.settings.kycTitle}
            description={`Status: ${kycStatus} · ${kycLevel}/3`}
          >
            <form onSubmit={handleSubmitKyc} className="space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <span className="text-muted-foreground mb-1.5 block text-xs">Tipo de documento</span>
                  <Select value={kycType} onValueChange={setKycType}>
                    <SelectTrigger className="bg-surface-subtle border-line h-10 w-full rounded-xl px-3 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDENTITY_FRONT">RG / CNH (Frente)</SelectItem>
                      <SelectItem value="IDENTITY_BACK">RG / CNH (Verso)</SelectItem>
                      <SelectItem value="PASSPORT">Passaporte</SelectItem>
                      <SelectItem value="SELFIE">Selfie com documento</SelectItem>
                      <SelectItem value="PROOF_OF_ADDRESS">Comprovante de residência</SelectItem>
                      <SelectItem value="CORPORATE_REGISTRATION">Contrato Social / CNPJ</SelectItem>
                      <SelectItem value="TAX_ID">Comprovante Fiscal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="text-muted-foreground mb-1.5 block text-xs">Número do documento</span>
                  <Input
                    value={kycDocNumber}
                    onChange={(e) => setKycDocNumber(e.target.value)}
                    placeholder="CPF / CNPJ / Passaporte"
                  />
                </div>
                <div>
                  <span className="text-muted-foreground mb-1.5 block text-xs">
                    Arquivo do documento (JPG, PNG, WebP ou PDF · máx. 5 MB)
                  </span>
                  <input
                    ref={kycInputRef}
                    id="kyc-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => {
                      const selected = e.target.files?.[0] ?? null;
                      setKycFile(selected);
                      setProfileError(null);
                    }}
                    className="sr-only"
                  />
                  {kycFile ? (
                    <div className="bg-surface-subtle border-line flex h-10 items-center justify-between gap-2 rounded-xl border px-3 text-xs">
                      <span className="text-foreground truncate">
                        {kycFile.name} ({Math.max(1, Math.round(kycFile.size / 1024))} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setKycFile(null);
                          if (kycInputRef.current) kycInputRef.current.value = "";
                        }}
                        aria-label="Remover arquivo selecionado"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="kyc-file-input"
                      className="bg-surface-subtle border-line text-muted-foreground hover:text-foreground hover:border-foreground/30 flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 text-xs transition-colors"
                    >
                      <UploadCloud className="size-4 shrink-0" />
                      <span className="truncate">Selecionar arquivo...</span>
                    </label>
                  )}
                </div>
              </div>

              {kycMsg ? (
                <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  {kycMsg}
                </p>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs">
                  {kycDocs.length} documento(s) enviado(s)
                </p>
                <Button type="submit" size="sm" variant="outline" disabled={submittingKyc || !kycFile}>
                  <FileCheck2 className="size-3.5" />
                  {submittingKyc ? "Enviando..." : "Enviar documento KYC"}
                </Button>
              </div>
            </form>

            {kycDocs.length > 0 ? (
              <div className="border-line mt-4 space-y-2 border-t pt-4">
                {kycDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="border-line bg-surface-subtle flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-foreground font-medium">
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
                            ? "bg-emerald-500/15 text-emerald-300"
                            : doc.status === "REJECTED"
                              ? "bg-red-500/15 text-red-300"
                              : "bg-amber-500/15 text-amber-300",
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
            ) : null}
          </SettingsCard>

          <SettingsCard title="Notificações" description="Escolha os alertas persistidos na sua conta.">
            {(
              [
                {
                  key: "paymentAlerts",
                  label: "Alertas de pagamento",
                  desc: "Notificar a cada pagamento recebido ou saque processado",
                },
                {
                  key: "weeklyDigest",
                  label: "Resumo semanal",
                  desc: "Relatório consolidado de movimentações às segundas-feiras",
                },
                {
                  key: "productRenewals",
                  label: "Avisos de API e webhooks",
                  desc: "Alertas caso sua URL de webhook falhe consecutivamente",
                },
                {
                  key: "securityNotices",
                  label: "Alertas de segurança",
                  desc: "Novos logins, alterações de senha e rotação de chaves",
                },
              ] as const
            ).map((row) => (
              <div
                key={row.key}
                className="flex items-center gap-4 border-line border-b py-3 last:border-b-0 last:pb-0 first:pt-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-medium">{row.label}</p>
                  <p className="text-muted-foreground text-xs">{row.desc}</p>
                </div>
                <Switch
                  checked={prefs[row.key]}
                  onCheckedChange={(checked) =>
                    setPrefs((prev) => ({ ...prev, [row.key]: checked }))
                  }
                  label={row.label}
                />
              </div>
            ))}
          </SettingsCard>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <SettingsCard title="Aparência" description="Tema aplicado em todo o painel.">
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((option) => {
                const Icon = option.icon;
                const active = hydrated && theme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-xs font-medium transition-colors",
                      active
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </SettingsCard>

          <SettingsCard
            title={`${messages.topbar.languageLabel} (${locale.toUpperCase()})`}
            description={messages.topbar.selectLanguage}
          >
            <div className="flex flex-wrap gap-2">
              {(["pt", "en", "es", "ar", "fr", "de"] as const).map((code) => (
                <Button
                  key={code}
                  type="button"
                  size="sm"
                  variant={locale === code ? "default" : "outline"}
                  onClick={() => void setLocale(code)}
                >
                  {code === "pt"
                    ? "Português"
                    : code === "en"
                      ? "English"
                      : code === "es"
                        ? "Español"
                        : code === "ar"
                          ? "العربية"
                          : code === "fr"
                            ? "Français"
                            : "Deutsch"}
                </Button>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard title={modules.settings.securityTitle} description="2FA · Passwords · Sessions">
            {securityMsg ? (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                <CheckCircle2 className="size-4 shrink-0" />
                {securityMsg}
              </div>
            ) : null}

            {securityError ? (
              <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                {securityError}
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="flex items-center gap-4 border-line border-b pb-3">
                <ShieldCheck
                  className={cn(
                    "size-5 shrink-0",
                    user.twoFactorEnabled ? "text-success" : "text-muted-foreground",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-medium">Autenticação em 2 etapas (2FA)</p>
                  <p className="text-muted-foreground text-xs">
                    {user.twoFactorEnabled ? "App autenticador ativo" : "Não ativado ainda"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShow2faPanel((v) => !v);
                    if (!user.twoFactorEnabled && !twoFaSecret) {
                      void runSecurity({ action: "2fa-setup" }, (res) => {
                        setTwoFaSecret(String(res.secret || ""));
                        setTwoFaUri(String(res.otpauthUri || res.qrCodeUrl || ""));
                      });
                    }
                  }}
                >
                  {show2faPanel ? "Fechar" : user.twoFactorEnabled ? "Gerenciar" : "Ativar 2FA"}
                </Button>
              </div>

              {show2faPanel ? (
                <div className="border-line bg-surface-subtle space-y-3 rounded-xl border p-3.5 text-xs">
                  {user.twoFactorEnabled ? (
                    <>
                      <p className="text-muted-foreground">
                        Informe sua senha atual para desativar o 2FA desta conta.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={disable2faPwd}
                          onChange={(e) => setDisable2faPwd(e.target.value)}
                          placeholder="Senha atual"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={securityBusy || !disable2faPwd}
                          onClick={() =>
                            void runSecurity(
                              { action: "2fa-disable", password: disable2faPwd },
                              () => {
                                setSecurityMsg("2FA desativado.");
                                setShow2faPanel(false);
                                setDisable2faPwd("");
                                router.refresh();
                              },
                            )
                          }
                        >
                          Desativar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {twoFaSecret ? (
                        <div className="space-y-1.5">
                          <p className="text-muted-foreground">
                            Adicione esta chave manual ao seu Google Authenticator / Authy:
                          </p>
                          <p className="text-foreground break-all rounded-lg bg-black/30 p-2 font-mono">
                            {twoFaSecret}
                          </p>
                          {twoFaUri ? (
                            <p className="text-muted-foreground break-all font-mono text-[10px]">
                              {twoFaUri}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="flex gap-2">
                        <Input
                          value={twoFaCode}
                          onChange={(e) => setTwoFaCode(e.target.value)}
                          placeholder="Código de 6 dígitos"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={securityBusy || twoFaCode.length < 6}
                          onClick={() =>
                            void runSecurity(
                              { action: "2fa-confirm", code: twoFaCode },
                              () => {
                                setSecurityMsg("2FA ativado com sucesso.");
                                setShow2faPanel(false);
                                setTwoFaCode("");
                                router.refresh();
                              },
                            )
                          }
                        >
                          Confirmar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              <div className="flex items-center gap-4">
                <KeyRound className="text-muted-foreground size-5 shrink-0" />
                <p className="text-foreground min-w-0 flex-1 text-sm font-medium">Alterar senha</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPwdForm((v) => !v)}
                >
                  {showPwdForm ? "Cancelar" : "Atualizar"}
                </Button>
              </div>

              {showPwdForm ? (
                <div className="border-line bg-surface-subtle space-y-2.5 rounded-xl border p-3.5">
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Senha atual"
                  />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha (mín. 8 caracteres)"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={securityBusy || !currentPassword || newPassword.length < 8}
                    onClick={() =>
                      void runSecurity(
                        {
                          action: "change-password",
                          currentPassword,
                          newPassword,
                        },
                        () => {
                          setSecurityMsg("Senha alterada com sucesso.");
                          setCurrentPassword("");
                          setNewPassword("");
                          setShowPwdForm(false);
                        },
                      )
                    }
                  >
                    Salvar nova senha
                  </Button>
                </div>
              ) : null}
            </div>
          </SettingsCard>

          <SettingsCard title="Zona de Risco" description="Encerrar sessões ativas ou fechar a conta.">
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                disabled={securityBusy}
                onClick={() =>
                  void runSecurity({ action: "logout-all" }, () => {
                    router.replace("/login");
                    router.refresh();
                  })
                }
                className="w-full justify-start"
              >
                <LogOut /> Sair de todos os dispositivos
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteForm((v) => !v)}
                className="text-danger hover:text-danger w-full justify-start"
              >
                <Trash2 /> Excluir conta permanentemente
              </Button>

              {showDeleteForm ? (
                <div className="border-red-500/30 bg-red-500/10 space-y-2.5 rounded-xl border p-3.5">
                  <p className="text-xs text-red-200">
                    Confirme sua senha para desativar e encerrar esta conta:
                  </p>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Sua senha atual"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={securityBusy || !deletePassword}
                    onClick={() =>
                      void runSecurity(
                        { action: "delete-account", password: deletePassword },
                        () => {
                          router.replace("/login");
                          router.refresh();
                        },
                      )
                    }
                    className="bg-red-600 text-white hover:bg-red-500"
                  >
                    Confirmar encerramento da conta
                  </Button>
                </div>
              ) : null}
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
