import type { ReactNode } from "react";

import { AuthCardVisual } from "@/components/auth/auth-card-visual";

interface AuthShellProps {
  mode: "login" | "create";
  children: ReactNode;
}

export function AuthShell({ mode, children }: AuthShellProps) {
  return (
    <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-lh-bg-soft/80 shadow-2xl shadow-black/60 backdrop-blur-2xl lg:grid lg:grid-cols-12">
      <div className="hidden border-r border-white/[0.08] bg-white/[0.015] lg:col-span-6 lg:block">
        <AuthCardVisual mode={mode} />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-6">{children}</div>
    </div>
  );
}
