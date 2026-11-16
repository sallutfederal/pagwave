import { xpagPrivateJson } from "@/lib/xpag/api-helper";
import { XPagError } from "@/lib/xpag/client";
import { deleteBeneficiary, setDefaultBeneficiary } from "@/lib/xpag/store";

export function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return xpagPrivateJson(async (userId) => {
    const { id } = await context.params;
    const beneficiary = await setDefaultBeneficiary(userId, id);
    if (!beneficiary) {
      throw new XPagError("Chave/carteira não encontrada.", 404, "not_found");
    }
    return { ok: true, beneficiary };
  });
}

export function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return xpagPrivateJson(async (userId) => {
    const { id } = await context.params;
    const deleted = await deleteBeneficiary(userId, id);
    if (!deleted) {
      throw new XPagError("Chave/carteira não encontrada.", 404, "not_found");
    }
    return { ok: true };
  });
}

