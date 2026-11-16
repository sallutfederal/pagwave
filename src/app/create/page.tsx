import type { Metadata } from "next";

import { EarthAuthBackdrop } from "@/components/auth/earth-auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Criar conta — pagwave",
  description: "Crie sua conta pagwave.",
};

export default function CreateAccountPage() {
  return (
    <EarthAuthBackdrop>
      <RegisterForm />
    </EarthAuthBackdrop>
  );
}

