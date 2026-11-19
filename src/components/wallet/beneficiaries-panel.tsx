"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import {
  ArrowUpRight,
  Check,
  Copy,
  KeyRound,
  Plus,
  Star,
  Trash2,
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
import { CurrencyBadge } from "@/components/wallet/currency-badge";
import { DynamicFields } from "@/components/wallet/dynamic-fields";
import type { ClientBeneficiary } from "@/components/wallet/types";
import {
  CURRENCY_SPECS,
  XPAG_CURRENCIES,
  validateDestinationInput,
  type XPagCurrency,
} from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

type BeneficiariesPanelProps = {
  beneficiaries: ClientBeneficiary[];
  defaultCurrency: XPagCurrency;
  onChanged: () => void;
  onWithdrawWithBeneficiary: (item: ClientBeneficiary) => void;
};

export function BeneficiariesPanel({
  beneficiaries,
  defaultCurrency,
  onChanged,
  onWithdrawWithBeneficiary,
}: BeneficiariesPanelProps) {
  const { modules } = useI18n();
  const mb = modules.beneficiaries;
  const [filterKind, setFilterKind] = useState<"all" | "fiat" | "crypto">("all");
  const [showForm, setShowForm] = useState(false);

  const [currency, setCurrency] = useState<XPagCurrency>(defaultCurrency);
  const [rail, setRail] = useState<string>(CURRENCY_SPECS[defaultCurrency].cashoutRails[0].id);
  const [label, setLabel] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [makeDefault, setMakeDefault] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const spec = CURRENCY_SPECS[currency];

  const handleCurrencyChange = (next: XPagCurrency) => {
    setCurrency(next);
    setRail(CURRENCY_SPECS[next].cashoutRails[0].id);
    setDetails({});
    setFormError(null);
  };

  const handleRailChange = (nextRail: string) => {
    setRail(nextRail);
    setFormError(null);
  };

  const filtered = useMemo(() => {
    if (filterKind === "all") return beneficiaries;
    return beneficiaries.filter((b) => CURRENCY_SPECS[b.currency].kind === filterKind);
  }, [beneficiaries, filterKind]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (label.trim().length < 2) {
      setFormError("Informe um apelido identificador para esta chave/carteira.");
      return;
    }

    const clientErr = validateDestinationInput(currency, rail, details);
    if (clientErr) {
      setFormError(clientErr);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          currency,
          rail,
          details,
          isDefault: makeDefault,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setFormError(json.message || "Erro ao cadastrar chave/carteira.");
        return;
      }

      setLabel("");
      setDetails({});
      setShowForm(false);
      onChanged();
    } catch {
      setFormError("Falha de rede ao salvar chave/carteira.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/wallet/beneficiaries/${encodeURIComponent(id)}`, {
        method: "PATCH",
      });
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/wallet/beneficiaries/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const handleCopy = async (item: ClientBeneficiary) => {
    const raw =
      item.details.address ||
      item.details.pix_key ||
      item.details.pix_copia_cola ||
      item.details.clabe ||
      item.details.account_number ||
      item.details.key ||
      item.summary;
    await navigator.clipboard?.writeText(raw);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId((prev) => (prev === item.id ? null : prev)), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-subtle p-1">
          {(
            [
              { id: "all", label: `Todas (${beneficiaries.length})` },
              {
                id: "fiat",
                label: `Fiat / Países (${beneficiaries.filter((b) => CURRENCY_SPECS[b.currency].kind === "fiat").length})`,
              },
              {
                id: "crypto",
                label: `Cripto (${beneficiaries.filter((b) => CURRENCY_SPECS[b.currency].kind === "crypto").length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterKind(tab.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                filterKind === tab.id
                  ? "bg-accent text-accent-fg"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant={showForm ? "outline" : "default"}
          size="sm"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="size-3.5" />
          {showForm ? "Fechar cadastro" : "Nova chave ou endereço cripto"}
        </Button>
      </div>

      {showForm ? (
        <Card className="border-accent/30 bg-surface p-5 sm:p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-foreground text-sm font-semibold">
                  {mb.formTitle}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {mb.listTitle}
                </p>
              </div>
              {spec.cryptoNetwork ? (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  Rede travada: {spec.cryptoNetwork}
                </span>
              ) : null}
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  Moeda / País <span className="text-accent">*</span>
                </label>
                <Select
                  value={currency}
                  onValueChange={(v) => handleCurrencyChange(v as XPagCurrency)}
                >
                  <SelectTrigger className="bg-surface-subtle border-line text-foreground h-10 w-full rounded-xl px-3.5 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {XPAG_CURRENCIES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code} — {CURRENCY_SPECS[code].countryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  Trilho de Saque <span className="text-accent">*</span>
                </label>
                <Select value={rail} onValueChange={handleRailChange}>
                  <SelectTrigger className="bg-surface-subtle border-line text-foreground h-10 w-full rounded-xl px-3.5 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {spec.cashoutRails.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  Apelido da carteira / chave <span className="text-accent">*</span>
                </label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex.: Tesouraria TRON / Pix Principal"
                  className="bg-surface-subtle border-line text-foreground h-10 rounded-xl text-sm"
                />
              </div>
            </div>

            <p className="text-muted-foreground rounded-xl border border-white/10 bg-surface-subtle px-3.5 py-2 text-xs">
              {spec.cashoutRails.find((r) => r.id === rail)?.description}
            </p>

            <DynamicFields
              fields={spec.cashoutFields}
              activeMethod={rail}
              values={details}
              onChange={(k, v) => setDetails((prev) => ({ ...prev, [k]: v }))}
            />

            {formError ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
                {formError}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="text-muted-foreground inline-flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                  className="accent-accent size-4 rounded"
                />
                Definir como destino padrão em {currency}
              </label>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Validando e salvando..." : "Salvar chave/carteira"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <span className="bg-surface-subtle border-line text-muted-foreground grid size-12 place-items-center rounded-2xl border">
            <KeyRound className="size-5" />
          </span>
          <div className="max-w-md space-y-1">
            <p className="text-foreground text-sm font-medium">
              Nenhuma chave ou endereço salvo nesta categoria
            </p>
            <p className="text-muted-foreground text-xs">
              Cadastre chaves Pix, CLABE mexicana, Bre-B da Colômbia, CVU da Argentina, contas locais ou endereços USDT (TRON) e USDC (Solana) para sacar em 1 clique.
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5" />
            Cadastrar primeiro destino
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2">
          {filtered.map((item) => {
            const isBusy = busyId === item.id;
            return (
              <Card
                key={item.id}
                className={cn(
                  "flex flex-col justify-between gap-4 p-4 transition-colors",
                  item.isDefault && "border-accent/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <CurrencyBadge currency={item.currency} showNetwork={false} />
                      <span className="text-foreground truncate text-sm font-semibold">
                        {item.label}
                      </span>
                      {item.isDefault ? (
                        <span className="bg-accent-soft text-accent inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
                          <Star className="size-2.5 fill-current" />
                          Padrão
                        </span>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground truncate font-mono text-xs">
                      {item.summary}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Trilho: {item.rail}
                      {item.details.name ? ` · Titular: ${item.details.name}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      title="Copiar endereço/chave"
                      onClick={() => handleCopy(item)}
                      className="size-8"
                    >
                      {copiedId === item.id ? (
                        <Check className="size-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isBusy}
                      title="Excluir chave/carteira"
                      onClick={() => handleDelete(item.id)}
                      className="size-8 text-red-300 hover:bg-red-500/15 hover:text-red-200"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  {!item.isDefault ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => handleSetDefault(item.id)}
                      className="h-7 px-2.5 text-xs"
                    >
                      <Star className="size-3" />
                      Tornar padrão
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">
                      Destino principal para {item.currency}
                    </span>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-xs"
                    onClick={() => onWithdrawWithBeneficiary(item)}
                  >
                    <ArrowUpRight className="size-3 text-amber-300" />
                    Solicitar saque
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

