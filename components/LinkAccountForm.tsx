"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import type { EmailAddressResource, PhoneNumberResource } from "@clerk/shared/types";
import { normalizePhone } from "@/lib/phone";

type Step = "input" | "code" | "done";

function errorText(err: unknown): string {
  if (isClerkAPIResponseError(err)) {
    return err.errors[0]?.longMessage ?? err.errors[0]?.message ?? "Something went wrong.";
  }
  return "Something went wrong. Try again.";
}

// Adds the missing sign-in method (phone <-> email) to the signed-in account,
// so one person never ends up with two accounts or two subscriptions.
export default function LinkAccountForm() {
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState<Step>("input");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<EmailAddressResource | PhoneNumberResource | null>(null);

  if (!isLoaded || !user) return null;

  const hasEmail = user.emailAddresses.some((e) => e.verification?.status === "verified");
  const hasPhone = user.phoneNumbers.some((p) => p.verification?.status === "verified");
  const adding: "email" | "phone" | null =
    step === "done" ? null : !hasPhone ? "phone" : !hasEmail ? "email" : null;

  if (step === "done" || adding === null) {
    return (
      <div className="surface p-5 text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">All linked ✅</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          One vault, two ways in.
        </p>
      </div>
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) return;
    setBusy(true);
    try {
      if (adding === "phone") {
        const phone = normalizePhone(value);
        if (!phone) {
          setError("Use your full number, e.g. +65 9123 4567.");
          return;
        }
        const created = await user.createPhoneNumber({ phoneNumber: phone });
        await created.prepareVerification();
        setPending(created);
        setValue(phone);
      } else {
        const created = await user.createEmailAddress({ email: value.trim() });
        await created.prepareVerification({ strategy: "email_code" });
        setPending(created);
      }
      setStep("code");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pending || !user) return;
    setBusy(true);
    try {
      const result = await pending.attemptVerification({ code: code.trim() });
      if (result.verification?.status !== "verified") {
        setError("That code didn't work. Try again.");
        return;
      }
      await user.reload();
      setStep("done");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface p-5">
      <p className="text-lg font-semibold text-slate-900 dark:text-white">
        {adding === "phone" ? "Add your number" : "Add your email"}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {adding === "phone"
          ? "Sign in with your phone too. Same vault."
          : "Sign in with email too. Same vault."}
      </p>

      {step === "input" ? (
        <form onSubmit={send} className="mt-4 space-y-3">
          <input
            type={adding === "phone" ? "tel" : "email"}
            inputMode={adding === "phone" ? "tel" : "email"}
            autoComplete={adding === "phone" ? "tel" : "email"}
            placeholder={adding === "phone" ? "+65 9123 4567" : "you@email.com"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            className="input-field"
          />
          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-4 space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Code sent to <strong>{value}</strong>.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="input-field"
          />
          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Checking…" : "Verify"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("input");
              setCode("");
              setError(null);
            }}
            className="w-full text-center text-sm font-medium text-slate-400 dark:text-slate-500"
          >
            Wrong {adding === "phone" ? "number" : "email"}?
          </button>
        </form>
      )}
    </div>
  );
}
