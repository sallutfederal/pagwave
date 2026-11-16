import type { Metadata } from "next";
import { Suspense } from "react";

import { EarthAuthBackdrop } from "@/components/auth/earth-auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar — pagwave",
  description: "Acesse sua conta pagwave.",
};

export default function LoginPage() {
  return (
    <EarthAuthBackdrop>
      <Suspense
        fallback={
          <div className="h-[460px] w-full max-w-[384px] animate-pulse rounded-[22px] border border-white/15 bg-black/30 backdrop-blur-2xl" />
        }
      >
        <LoginForm />
      </Suspense>
    </EarthAuthBackdrop>
  );
}
