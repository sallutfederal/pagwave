import { Decimal } from "@prisma/client/runtime/library";

/**
 * Safely add two Decimal values.
 * Prisma Decimal wraps the underlying library; we call `.add()` on the instance.
 */
export function decimalAdd(a: Decimal, b: Decimal): Decimal {
  return a.add(b);
}

export function decimalSub(a: Decimal, b: Decimal): Decimal {
  return a.sub(b);
}

export function decimalMul(a: Decimal, b: Decimal): Decimal {
  return a.mul(b);
}

export function decimalDiv(a: Decimal, b: Decimal): Decimal {
  return a.div(b);
}

export function decimalGte(a: Decimal, b: Decimal): boolean {
  return a.gte(b);
}

export function decimalGt(a: Decimal, b: Decimal): boolean {
  return a.gt(b);
}

export function decimalLte(a: Decimal, b: Decimal): boolean {
  return a.lte(b);
}

export function decimalZero(): Decimal {
  return new Decimal(0);
}

export function toDecimal(value: string | number): Decimal {
  return new Decimal(value);
}

/**
 * Calculate fee based on flat + percentage.
 * final = max(minFee, min(maxFee, flatFee + amount * percentFee))
 */
export function calculateFee(
  amount: Decimal,
  flatFee: Decimal,
  percentFee: Decimal,
  minFee: Decimal,
  maxFee: Decimal | null,
): Decimal {
  const calculated = flatFee.add(amount.mul(percentFee));
  let fee = calculated.lt(minFee) ? minFee : calculated;
  if (maxFee && fee.gt(maxFee)) {
    fee = maxFee;
  }
  return fee;
}
