import { Suspense } from "react";
import { connection } from "next/server";

import { KycGateModal } from "@/components/auth/kyc-gate-modal";
import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { LocaleProvider } from "@/components/locale-provider";
import { SessionProvider } from "@/components/session-provider";
import { isRtlLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/server/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // The session is read at request time, so the whole signed-in area streams in
  // behind this boundary instead of blocking (or breaking) the static shell.
  return (
    <Suspense fallback={<div className="bg-background min-h-dvh" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

async function AppShell({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getCurrentUser();
  const dir = isRtlLocale(user.locale) ? "rtl" : "ltr";
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const kycLocked = !isAdmin && user.kycStatus !== "APPROVED";

  if (kycLocked) {
    return (
      <SessionProvider user={user}>
        <LocaleProvider key={user.id} initialLocale={user.locale}>
          <div dir={dir}>
            <KycGateModal
              email={user.email}
              initialStatus={user.kycStatus}
              initialLevel={user.kycLevel}
            />
          </div>
        </LocaleProvider>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider user={user}>
      <LocaleProvider key={user.id} initialLocale={user.locale}>
        <div className="bg-background app-atmosphere relative min-h-dvh">
          <Sidebar />
          <div dir={dir} className="relative z-10 md:pl-[220px]">
            <Topbar />
            {user.emailVerified ? null : <VerifyEmailBanner email={user.email} />}
            <main className="px-4 pt-4 pb-28 sm:px-6 md:px-8 md:pb-12">{children}</main>
          </div>
        </div>
      </LocaleProvider>
    </SessionProvider>
  );
}
