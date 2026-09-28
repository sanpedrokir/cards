"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp, useAuth } from "@clerk/nextjs";

const inputClass =
  "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900";

type Step = "email" | "code";

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [stuckStatus, setStuckStatus] = useState<string | null>(null);

  async function finalizeAndRedirect() {
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

    const formData = new FormData(e.currentTarget);
    const emailAddress = String(formData.get("email") ?? "").trim();

    const { error } = await signUp.create({ emailAddress });
    if (error) return;

    const { error: codeError } = await signUp.verifications.sendEmailCode();
    if (codeError) return;

    setStep("code");
  }

  async function handleCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStuckStatus(null);

    const formData = new FormData(e.currentTarget);
    const code = String(formData.get("code") ?? "");

    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) return;

    if (signUp.status === "complete") {
      await finalizeAndRedirect();
    } else {
      setStuckStatus(signUp.status ?? "unknown");
    }
  }

  const alreadySignedIn = signUp.status === "complete" || isSignedIn;

  useEffect(() => {
    if (alreadySignedIn) router.replace("/");
  }, [alreadySignedIn, router]);

  if (alreadySignedIn) {
    return null;
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <a href="/sign-in" className="font-medium text-blue-600 dark:text-blue-400">
          Sign in
        </a>
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input id="email" name="email" type="email" required className={inputClass} />
              {errors?.fields?.emailAddress && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.fields.emailAddress.message}
                </p>
              )}
            </div>

            {errors?.global && errors.global.length > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.global[0].message}
              </p>
            )}

            <div id="clerk-captcha" />

            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {fetchStatus === "fetching" ? "Sending code…" : "Send code"}
            </button>
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
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
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              We emailed you a code — if you don&apos;t see it within a few
              minutes, please check your spam/junk folder.
            </p>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Verification code
              </label>
              <input id="code" name="code" type="text" required className={inputClass} />
              {errors?.fields?.code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.fields.code.message}
                </p>
              )}
            </div>

            {stuckStatus && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Clerk needs an extra step ({stuckStatus}) that this form
                doesn&apos;t support yet. Please contact the app owner.
              </p>
            )}

            {errors?.global && errors.global.length > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.global[0].message}
              </p>
            )}

            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {fetchStatus === "fetching" ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => signUp.verifications.sendEmailCode()}
              className="w-full text-center text-sm font-medium text-zinc-500 dark:text-zinc-400"
            >
              Resend code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
