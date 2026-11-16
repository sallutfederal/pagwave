"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DynamicFieldSpec } from "@/lib/xpag/currencies";

type DynamicFieldsProps = {
  fields: DynamicFieldSpec[];
  activeMethod?: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
};

export function DynamicFields({
  fields,
  activeMethod,
  values,
  onChange,
}: DynamicFieldsProps) {
  const visibleFields = fields.filter(
    (f) => !f.whenMethod || (activeMethod && f.whenMethod.includes(activeMethod)),
  );

  if (visibleFields.length === 0) return null;

  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      {visibleFields.map((field) => {
        const val = values[field.key] ?? "";
        const isWide =
          field.key === "pix_copia_cola" ||
          field.key === "address" ||
          field.key === "clabe" ||
          field.key === "account_number";

        return (
          <div key={field.key} className={isWide ? "sm:col-span-2" : undefined}>
            <label className="text-muted-foreground mb-1.5 flex items-center justify-between text-xs font-medium">
              <span>
                {field.label}
                {field.required ? <span className="text-accent ml-1">*</span> : null}
              </span>
            </label>

            {field.type === "select" && field.options ? (
              <Select value={val} onValueChange={(next) => onChange(field.key, next)}>
                <SelectTrigger className="bg-surface-subtle border-line text-foreground h-10 w-full rounded-xl px-3.5 text-sm">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={field.type === "email" ? "email" : "text"}
                value={val}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="bg-surface-subtle border-line text-foreground h-10 rounded-xl font-mono text-xs sm:text-sm"
              />
            )}

            {field.hint ? (
              <p className="text-muted-foreground mt-1 text-[11px]">{field.hint}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

