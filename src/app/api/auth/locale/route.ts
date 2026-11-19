import { cookies } from "next/headers";
import { z } from "zod";

import { backendFetch } from "@/lib/backend";
import { SUPPORTED_LOCALES } from "@/lib/i18n/types";
import { privateJson } from "@/server/api";
import { getCurrentUser } from "@/server/auth";

const LocaleBodySchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
});

export function POST(request: Request) {
  return privateJson(async () => {
    const user = await getCurrentUser();
    const raw = await request.json().catch(() => null);
    const parsed = LocaleBodySchema.safeParse(raw);

    if (!parsed.success) {
      return Response.json(
        { ok: false, message: "Idioma inválido." },
        { status: 400 },
      );
    }

    const { locale } = parsed.data;
    await backendFetch("/auth/locale", {
      method: "PATCH",
      body: { locale },
    });

    const jar = await cookies();
    jar.set(`pagwave_lang_${user.id}`, locale, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return { ok: true, locale };
  });
}
