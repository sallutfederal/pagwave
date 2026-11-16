"use client";

import { MailWarning } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type State = "idle" | "sending" | "sent" | "error";

/** Shown until the e-mail address is confirmed. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, setState] = useState<State>("idle");

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
          <>A new confirmation link is on its way to <strong>{email}</strong>.</>
        ) : state === "error" ? (
          "We could not send the e-mail right now. Try again in a minute."
        ) : (
          <>Confirm <strong>{email}</strong> to secure your account — we sent you a link when you signed up.</>
        )}
      </p>
      {state !== "sent" ? (
        <Button variant="outline" size="sm" onClick={resend} disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Resend link"}
        </Button>
      ) : null}
    </div>
  );
}

