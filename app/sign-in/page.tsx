"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp, useAuth } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { normalizePhone } from "@/lib/phone";

const inputClass = "input-field";

type Step = "email" | "code";
type Method = "email" | "phone";

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn();
  const { signUp } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [stuckStatus, setStuckStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function finalizeSignIn() {
    await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl("/");
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  }

  async function finalizeSignUp() {
    await signUp.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl("/");
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStuckStatus(null);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const emailAddress = String(formData.get("email") ?? "").trim();
    setEmail(emailAddress);

    const { error: createError } = await signIn.create({
      identifier: emailAddress,
      signUpIfMissing: true,
    });
    if (createError) {
      setFormError(createError.message || "Something went wrong. Please try again.");
      return;
    }

    const { error: sendError } = await signIn.emailCode.sendCode();
    if (sendError) {
      setFormError(sendError.message || "Couldn't send the code. Please try again.");
      return;
    }

    setStep("code");
  }

  async function handlePhoneSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStuckStatus(null);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const phoneNumber = normalizePhone(String(formData.get("phone") ?? ""));
    if (!phoneNumber) {
      setFormError("Enter your full number with country code, e.g. +65 9123 4567.");
      return;
    }
    setPhone(phoneNumber);
    setSmsSent(false);

    const { error: createError } = await signIn.create({
      identifier: phoneNumber,
      signUpIfMissing: true,
    });
    if (createError) {
      setFormError(createError.message || "Something went wrong. Please try again.");
      return;
    }

    const { error: sendError } = await signIn.phoneCode.sendCode({ channel: "whatsapp" });
    if (sendError) {
      setFormError(sendError.message || "Couldn't send the code. Please try again.");
      return;
    }

    setStep("code");
  }

  async function handleTransfer() {
    const { error } = await signUp.create({ transfer: true });
    if (error) {
      setFormError("Something went wrong creating your account. Please try again.");
      return;
    }

    if (signUp.status === "complete") {
      await finalizeSignUp();
    } else {
      setStuckStatus(signUp.status ?? "unknown");
    }
  }

  async function handleCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStuckStatus(null);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const code = String(formData.get("code") ?? "");

    const { error } =
      method === "phone"
        ? await signIn.phoneCode.verifyCode({ code })
        : await signIn.emailCode.verifyCode({ code });

    if (error) {
      if (isClerkAPIResponseError(error) && error.errors[0]?.code === "sign_up_if_missing_transfer") {
        await handleTransfer();
        return;
      }
      setFormError(error.message || "Invalid code. Please try again.");
      return;
    }

    if (signIn.status === "complete") {
      await finalizeSignIn();
    } else {
      setStuckStatus(signIn.status ?? "unknown");
    }
  }

  const alreadySignedIn = signIn.status === "complete" || signUp.status === "complete" || isSignedIn;

  useEffect(() => {
    if (alreadySignedIn) router.replace("/");
  }, [alreadySignedIn, router]);

  if (alreadySignedIn) {
    return null;
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="page-title">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {method === "email"
          ? "Enter your email — we'll set up your account if you're new!"
          : "Enter your mobile number — we'll send a code to your WhatsApp and set up your account if you're new!"}
      </p>

      <div className="surface mt-6 p-5">
        {step === "email" && (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium dark:bg-slate-800">
            {(["email", "phone"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMethod(m);
                  setFormError(null);
                }}
                className={
                  "rounded-lg px-3 py-1.5 " +
                  (method === m
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 dark:text-slate-400")
                }
              >
                {m === "email" ? "Email" : "WhatsApp"}
              </button>
            ))}
          </div>
        )}

        {step === "email" && method === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="label-field">
                Mobile number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+65 9123 4567"
                required
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Include your country code. The code is sent to this number on WhatsApp.
                No WhatsApp? You can choose SMS on the next step, or use the Email tab.
              </p>
            </div>

            {formError && (
              <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p>
            )}

            <div id="clerk-captcha" />

            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="btn-primary w-full"
            >
              {fetchStatus === "fetching" ? "Sending code…" : "Send code on WhatsApp"}
            </button>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              By continuing, you agree to our{" "}
              <a href="/privacy" className="underline">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        )}

        {step === "email" && method === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label-field">
                Email
              </label>
              <input id="email" name="email" type="email" required className={inputClass} />
            </div>

            {formError && (
              <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p>
            )}

            <div id="clerk-captcha" />

            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="btn-primary w-full"
            >
              {fetchStatus === "fetching" ? "Sending code…" : "Continue"}
            </button>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              By continuing, you agree to our{" "}
              <a href="/privacy" className="underline">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {method === "phone" ? (
                <>
                  We sent a code to <strong>{phone}</strong> on WhatsApp — it can take
                  a minute to arrive.
                </>
              ) : (
                <>
                  We emailed a code to <strong>{email}</strong> — if you don&apos;t
                  see it within a few minutes, please check your spam/junk folder.
                </>
              )}
            </p>
            <div>
              <label htmlFor="code" className="label-field">
                Verification code
              </label>
              <input id="code" name="code" type="text" required className={inputClass} />
            </div>

            {stuckStatus && (
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Clerk needs an extra step ({stuckStatus}) that this form
                doesn&apos;t support yet. Please contact the app owner.
              </p>
            )}

            {formError && (
              <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p>
            )}

            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="btn-primary w-full"
            >
              {fetchStatus === "fetching" ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={() =>
                method === "phone"
                  ? signIn.phoneCode.sendCode({ channel: "whatsapp" })
                  : signIn.emailCode.sendCode()
              }
              className="w-full text-center text-sm font-medium text-slate-500 dark:text-slate-400"
            >
              Resend code
            </button>
            {method === "phone" && (
              <button
                type="button"
                onClick={async () => {
                  setFormError(null);
                  const { error } = await signIn.phoneCode.sendCode({ channel: "sms" });
                  if (error) {
                    setFormError(error.message || "Couldn't send the SMS. Please try again.");
                  } else {
                    setSmsSent(true);
                  }
                }}
                className="w-full text-center text-sm font-medium text-amber-600 dark:text-amber-400"
              >
                No WhatsApp on this number? Send the code by SMS instead
              </button>
            )}
            {smsSent && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Code sent by SMS to {phone}.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                signIn.reset();
                setStep("email");
                setStuckStatus(null);
                setFormError(null);
              }}
              className="w-full text-center text-sm font-medium text-slate-400 dark:text-slate-500"
            >
              {method === "phone" ? "Use a different number" : "Use a different email"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
