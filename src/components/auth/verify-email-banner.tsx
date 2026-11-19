"use client";

import { MailWarning } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

type State = "idle" | "sending" | "sent" | "error";

/** Shown until the e-mail address is confirmed. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, setState] = useState<State>("idle");
  const { messages } = useI18n();

  async function resend() {
    setState("sending");

    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div
      role="status"
      className="bg-accent-soft text-foreground mx-4 mt-2 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-xs sm:mx-6 md:mx-8"
    >
      <MailWarning className="text-accent size-4 shrink-0" />
      <p className="min-w-0 flex-1">
        {state === "sent" ? (
          <>
            {messages.verifyBanner.sent} <strong>({email})</strong>
          </>
        ) : state === "error" ? (
          messages.verifyBanner.error
        ) : (
          <>
            {messages.verifyBanner.text} <strong>({email})</strong>
          </>
        )}
      </p>
      {state !== "sent" ? (
        <Button variant="outline" size="sm" onClick={resend} disabled={state === "sending"}>
          {state === "sending" ? messages.verifyBanner.sending : messages.verifyBanner.resend}
        </Button>
      ) : null}
    </div>
  );
}
