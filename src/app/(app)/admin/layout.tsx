import type { ReactNode } from "react";
import { AdminSubnav } from "@/components/admin/admin-subnav";
import { requireAdminUser } from "@/server/admin-auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-300 uppercase">
          Área Restrita · Role Admin
        </span>
      </div>
      <AdminSubnav />
      {children}
    </div>
  );
}

