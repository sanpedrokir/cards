"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp, useAuth } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

const inputClass = "input-field";

type Step = "email" | "code";

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { signUp, errors: signUpErrors } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [stuckStatus, setStuckStatus] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

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
    setTransferError(null);

    const formData = new FormData(e.currentTarget);
    const emailAddress = String(formData.get("email") ?? "").trim();
    setEmail(emailAddress);

    const { error: createError } = await signIn.create({
      identifier: emailAddress,
      signUpIfMissing: true,
    });
    if (createError) return;

    const { error: sendError } = await signIn.emailCode.sendCode();
    if (sendError) return;

    setStep("code");
  }

  async function handleTransfer() {
    const { error } = await signUp.create({ transfer: true });
    if (error) {
      setTransferError("Something went wrong creating your account. Please try again.");
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
    setTransferError(null);

    const formData = new FormData(e.currentTarget);
    const code = String(formData.get("code") ?? "");

    const { error } = await signIn.emailCode.verifyCode({ code });

    if (error) {
      if (isClerkAPIResponseError(error) && error.errors[0]?.code === "sign_up_if_missing_transfer") {
        await handleTransfer();
      }
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
        Enter your email — we&apos;ll sign you in, or set up your account
        automatically if you&apos;re new here.
      </p>

      <div className="surface mt-6 p-5">
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label-field">
                Email
              </label>
              <input id="email" name="email" type="email" required className={inputClass} />
              {errors?.fields?.identifier && (
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
                  {errors.fields.identifier.message}
                </p>
              )}
            </div>

            {errors?.global && errors.global.length > 0 && (
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {errors.global[0].message}
              </p>
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
              We emailed a code to <strong>{email}</strong> — if you don&apos;t
              see it within a few minutes, please check your spam/junk folder.
            </p>
            <div>
              <label htmlFor="code" className="label-field">
                Verification code
              </label>
              <input id="code" name="code" type="text" required className={inputClass} />
              {errors?.fields?.code && (
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
                  {errors.fields.code.message}
                </p>
              )}
            </div>

            {stuckStatus && (
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Clerk needs an extra step ({stuckStatus}) that this form
                doesn&apos;t support yet. Please contact the app owner.
              </p>
            )}

            {transferError && (
              <p className="text-sm text-rose-600 dark:text-rose-400">{transferError}</p>
            )}

            {signUpErrors?.global && signUpErrors.global.length > 0 && (
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {signUpErrors.global[0].message}
              </p>
            )}

            {errors?.global && errors.global.length > 0 && (
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {errors.global[0].message}
              </p>
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
              onClick={() => signIn.emailCode.sendCode()}
              className="w-full text-center text-sm font-medium text-slate-500 dark:text-slate-400"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => {
                signIn.reset();
                setStep("email");
                setStuckStatus(null);
                setTransferError(null);
              }}
              className="w-full text-center text-sm font-medium text-slate-400 dark:text-slate-500"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
