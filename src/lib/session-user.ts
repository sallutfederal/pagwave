import type { Locale } from "@/lib/i18n/types";

/** The signed-in user as the browser is allowed to know it (no tokens, no secrets). */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  kycStatus: string;
  kycLevel: number;
  locale: Locale;
};
