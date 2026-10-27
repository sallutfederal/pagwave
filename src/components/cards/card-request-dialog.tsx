"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { BankCardTile } from "@/components/dashboard/bank-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { userProfile } from "@/data/user-profile";
import { addUserCard } from "@/lib/card-store";
import { newCardSchema, type BankCard, type NewCard } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const emptyForm: NewCard = {
  label: "",
  holder: userProfile.name,
  brand: "visa",
  last4: "",
  expiry: "",
  balance: 0,
  variant: "dark",
};

type FieldErrors = Partial<Record<keyof NewCard, string>>;

function newCardId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `user-card-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `user-card-${Date.now().toString(36)}`;
}

/** Field + label + inline error message. */
function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-muted-foreground text-xs">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-danger text-[11px]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Choice<T extends string>({
  value,
  current,
  onSelect,
  children,
}: {
  value: T;
  current: T;
  onSelect: (value: T) => void;
  children: ReactNode;
}) {
  const active = value === current;

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(value)}
      className={cn(
        "flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors",
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-line text-muted-foreground hover:bg-surface-hover hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function CardRequestDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewCard>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});

  function update<K extends keyof NewCard>(key: K, value: NewCard[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = newCardSchema.safeParse(form);

    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof NewCard | undefined;
        if (field && !next[field]) next[field] = issue.message;
      }
      setErrors(next);
      return;
    }

    addUserCard({ id: newCardId(), ...result.data, currency: "USD" });
    setForm(emptyForm);
    setErrors({});
    setOpen(false);
  }

  /** Live preview built from the raw form values, so it works mid-typing. */
  const preview: BankCard = {
    id: "preview",
    label: form.label || undefined,
    variant: form.variant,
    balance: Number.isFinite(Number(form.balance)) ? Number(form.balance) : 0,
    currency: "USD",
    last4: form.last4.padEnd(4, "•").slice(0, 4),
    expiry: form.expiry || "MM/YY",
    brand: form.brand,
    holder: form.holder || userProfile.name,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="border-line text-muted-foreground hover:text-foreground hover:border-accent/40 flex aspect-[1.68/1] flex-col items-center justify-center gap-2 rounded-card border border-dashed transition-colors"
        >
          <span className="bg-surface-subtle grid size-11 place-items-center rounded-full">
            <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-none stroke-current stroke-2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-sm font-medium">Request a new card</span>
          <span className="text-xs">Virtual or physical, shipped in 3 days</span>
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>Request a new card</DialogTitle>
        <DialogDescription>
          The card is created instantly as a virtual card and stays linked to this device.
        </DialogDescription>

        <div className="mt-5">
          <BankCardTile card={preview} className="pointer-events-none" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Card label" htmlFor="card-label" error={errors.label}>
              <Input
                id="card-label"
                value={form.label}
                onChange={(event) => update("label", event.target.value)}
                placeholder="Travel card"
                className={cn(errors.label && "ring-danger/40")}
              />
            </Field>

            <Field label="Cardholder" htmlFor="card-holder" error={errors.holder}>
              <Input
                id="card-holder"
                value={form.holder}
                onChange={(event) => update("holder", event.target.value)}
                className={cn(errors.holder && "ring-danger/40")}
              />
            </Field>
          </div>

          <Field label="Brand" htmlFor="card-brand">
            <div id="card-brand" className="flex gap-2">
              <Choice value="visa" current={form.brand} onSelect={(value) => update("brand", value)}>
                VISA
              </Choice>
              <Choice
                value="mastercard"
                current={form.brand}
                onSelect={(value) => update("brand", value)}
              >
                Mastercard
              </Choice>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Last 4 digits" htmlFor="card-last4" error={errors.last4}>
              <Input
                id="card-last4"
                inputMode="numeric"
                maxLength={4}
                value={form.last4}
                onChange={(event) => update("last4", event.target.value.replace(/\D/g, ""))}
                placeholder="4242"
                className={cn(errors.last4 && "ring-danger/40")}
              />
            </Field>

            <Field label="Expiry" htmlFor="card-expiry" error={errors.expiry}>
              <Input
                id="card-expiry"
                inputMode="numeric"
                maxLength={5}
                value={form.expiry}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                  update("expiry", digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                }}
                placeholder="MM/YY"
                className={cn(errors.expiry && "ring-danger/40")}
              />
            </Field>

            <Field label="Opening balance" htmlFor="card-balance" error={errors.balance}>
              <Input
                id="card-balance"
                type="number"
                min={0}
                step={10}
                value={form.balance}
                onChange={(event) => update("balance", event.target.valueAsNumber || 0)}
                className={cn(errors.balance && "ring-danger/40")}
              />
            </Field>
          </div>

          <Field label="Style" htmlFor="card-variant">
            <div id="card-variant" className="flex gap-2">
              <Choice value="dark" current={form.variant} onSelect={(value) => update("variant", value)}>
                Dark
              </Choice>
              <Choice value="light" current={form.variant} onSelect={(value) => update("variant", value)}>
                Light
              </Choice>
            </div>
          </Field>

          <div className="flex items-center justify-end gap-2 pt-1">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm">
              Save card
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}