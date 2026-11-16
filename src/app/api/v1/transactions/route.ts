import { withPagwaveApiAuth } from "@/lib/pagwave-gateway";
import {
  XPagError,
  consultXPagCashout,
  consultXPagTransaction,
} from "@/lib/xpag/client";

export function GET(request: Request) {
  return withPagwaveApiAuth(request, "GET /api/v1/transactions", async () => {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind") === "cashout" ? "cashout" : "cashin";
    const query = {
      request_number: searchParams.get("request_number")?.trim() || undefined,
      transaction_id: searchParams.get("transaction_id")?.trim() || undefined,
      e2e: searchParams.get("e2e")?.trim() || undefined,
      external_id: searchParams.get("external_id")?.trim() || undefined,
      clabe: searchParams.get("clabe")?.trim() || undefined,
    };

    if (!Object.values(query).some(Boolean)) {
      throw new XPagError(
        "Informe ao menos um parâmetro: transaction_id, request_number, e2e, external_id ou clabe.",
        400,
        "missing_query_param",
      );
    }

    const result =
      kind === "cashout"
        ? await consultXPagCashout({
            e2e: query.e2e,
            transaction_id: query.transaction_id,
            external_id: query.external_id,
          })
        : await consultXPagTransaction(query);

    return {
      status: 200,
      body: {
        ok: true,
        kind,
        ...result,
      },
    };
  });
}

