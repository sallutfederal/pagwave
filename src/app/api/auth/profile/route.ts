import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { privateJson } from "@/server/api";

const ProfilePatchSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  displayName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  country: z.string().trim().max(3).optional(),
  companyName: z.string().trim().max(255).optional(),
  companyTaxId: z.string().trim().max(50).optional(),
  preferences: z
    .object({
      paymentAlerts: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
      productRenewals: z.boolean().optional(),
      securityNotices: z.boolean().optional(),
    })
    .optional(),
});

export function GET() {
  return privateJson(async () => {
    const [me, prefs] = await Promise.all([
      backendFetch<{
        email: string;
        role?: string;
        locale?: string;
        twoFactorEnabled?: boolean;
        emailVerified?: boolean;
        profile: {
          firstName?: string;
          lastName?: string;
          displayName?: string | null;
          phone?: string | null;
          country?: string | null;
          companyName?: string | null;
          companyTaxId?: string | null;
          kycStatus?: string;
          kycLevel?: number;
        } | null;
      }>("/auth/me"),
      backendFetch<{ preferences: Record<string, boolean> }>("/auth/preferences"),
    ]);
    return {
      ok: true,
      email: me.email,
      role: me.role ?? "USER",
      locale: me.locale ?? "pt",
      twoFactorEnabled: Boolean(me.twoFactorEnabled),
      emailVerified: Boolean(me.emailVerified),
      profile: me.profile,
      preferences: prefs.preferences,
    };
  });
}

export async function PATCH(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = ProfilePatchSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Dados inválidos." },
      { status: 400 },
    );
  }

  return privateJson(async () => {
    const { preferences, ...profileData } = parsed.data;
    const tasks: Array<Promise<unknown>> = [];

    if (Object.keys(profileData).length > 0) {
      tasks.push(
        backendFetch("/auth/profile", {
          method: "PATCH",
          body: profileData,
        }),
      );
    }

    if (preferences) {
      tasks.push(
        backendFetch("/auth/preferences", {
          method: "PATCH",
          body: preferences,
        }),
      );
    }

    await Promise.all(tasks);
    return { ok: true };
  });
}

