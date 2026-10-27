import { z } from "zod";

import {
  dashboardSummarySchema,
  periodSchema,
  recentSalesSchema,
  statisticSchema,
  transactionsSchema,
} from "@/lib/schemas";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fetches JSON from our own API and validates it with zod, so a broken payload
 * becomes a typed error instead of `undefined` blowing up three layers below.
 */
async function getJson<S extends z.ZodType>(
  url: string,
  schema: S,
  signal?: AbortSignal,
): Promise<z.output<S>> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new ApiError(`Request to ${url} failed with ${response.status}`, response.status);
  }

  return schema.parse(await response.json());
}

export const api = {
  summary: (signal?: AbortSignal) =>
    getJson("/api/dashboard/summary", dashboardSummarySchema, signal),

  sales: (signal?: AbortSignal) => getJson("/api/dashboard/sales", recentSalesSchema, signal),

  transactions: (signal?: AbortSignal) =>
    getJson("/api/dashboard/transactions", transactionsSchema, signal),

  statistic: (period: z.infer<typeof periodSchema>, signal?: AbortSignal) =>
    getJson(`/api/dashboard/statistic?period=${period}`, statisticSchema, signal),
};