import { xpagPrivateJson } from "@/lib/xpag/api-helper";
import {
  XPagError,
  consultXPagCashout,
  consultXPagTransaction,
} from "@/lib/xpag/client";
import { listWalletFeed } from "@/lib/xpag/store";

export function GET(request: Request) {
  return xpagPrivateJson(async (userId) => {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind");

    if (kind === "cashin" || kind === "cashout") {
      const query = {
        request_number: searchParams.get("request_number")?.trim() || undefined,
        transaction_id: searchParams.get("transaction_id")?.trim() || undefined,
        e2e: searchParams.get("e2e")?.trim() || undefined,
        external_id: searchParams.get("external_id")?.trim() || undefined,
        clabe: searchParams.get("clabe")?.trim() || undefined,
      };

      const hasAnyParam = Object.values(query).some(Boolean);
      if (!hasAnyParam) {
        throw new XPagError(
          "Informe ao menos um identificador para consulta (transaction_id, request_number, e2e, external_id ou clabe).",
          400,
          "missing_query_param",
        );
      }

      const data =
        kind === "cashout"
          ? await consultXPagCashout({
              e2e: query.e2e,
              transaction_id: query.transaction_id,
              external_id: query.external_id,
            })
          : await consultXPagTransaction(query);

      return { ok: true, kind, result: data };
    }

    const feed = await listWalletFeed(userId);
    return { ok: true, ...feed };
  });
}

