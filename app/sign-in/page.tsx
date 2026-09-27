"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useAuth } from "@clerk/nextjs";

const inputClass =
  "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900";

function friendlyError(message?: string | null): string | undefined {
  if (!message) return undefined;
  if (message.toLowerCase().includes("couldn't find your account")) {
    return "Couldn't find your account. Please create an account first.";
  }
  return message;
}

type Step = "password" | "verify-trust" | "forgot-email" | "forgot-code" | "forgot-password";

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [stuckStatus, setStuckStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function finalizeAndRedirect() {
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

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStuckStatus(null);

    const formData = new FormData(e.currentTarget);
    const emailAddress = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const { error } = await signIn.password({ identifier: emailAddress, password });
    if (error) return;

    if (signIn.status === "complete") {
      await finalizeAndRedirect();
    } else if (signIn.status === "needs_client_trust") {
      await signIn.mfa.sendEmailCode();
      setNotice("We emailed you a verification code.");
      setStep("verify-trust");
    } else {
      setStuckStatus(signIn.status ?? "unknown");
    }
  }

  async function handleVerifyTrustSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = String(formData.get("code") ?? "");

    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) return;

    if (signIn.status === "complete") {
      await finalizeAndRedirect();
    } else {
      setStuckStatus(signIn.status ?? "unknown");
    }
  }

  async function handleForgotEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailAddress = String(formData.get("email") ?? "").trim();

    const { error } = await signIn.create({ identifier: emailAddress });
    if (error) return;

    const { error: codeError } = await signIn.resetPasswordEmailCode.sendCode();
    if (codeError) return;

    setNotice("We emailed you a password reset code.");
    setStep("forgot-code");
  }

  async function handleForgotCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = String(formData.get("code") ?? "");

    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (error) return;

    setStep("forgot-password");
  }

  async function handleNewPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "");

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password });
    if (error) return;

    if (signIn.status === "complete") {
      await finalizeAndRedirect();
    } else {
      setStuckStatus(signIn.status ?? "unknown");
    }
  }

  const alreadySignedIn = signIn.status === "complete" || isSignedIn;

  useEffect(() => {
    if (alreadySignedIn) router.replace("/");
  }, [alreadySignedIn, router]);

  if (alreadySignedIn) {
    return null;
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        New to Vaulted?{" "}
        <a href="/sign-up" className="font-medium text-blue-600 dark:text-blue-400">
          Create an account
        </a>
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {notice && (
          <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>
        )}

        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input id="email" name="email" type="email" required className={inputClass} />
              {errors?.fields?.identifier && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {friendlyError(errors.fields.identifier.message)}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStuckStatus(null);
                    setNotice(null);
                    setStep("forgot-email");
                  }}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400"
                >
                  Forgot password?
                </button>
              </div>
              <input id="password" name="password" type="password" required className={inputClass} />
              {errors?.fields?.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.fields.password.message}
                </p>
              )}
            </div>

            {stuckStatus && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Clerk needs an extra verification step ({stuckStatus}) that
                this sign-in form doesn&apos;t support yet. Please contact the
                app owner.
              </p>
            )}

            {errors?.global && errors.global.length > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {friendlyError(errors.global[0].message)}
              </p>
            )}

            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {fetchStatus === "fetching" ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        {step === "verify-trust" && (
          <form onSubmit={handleVerifyTrustSubmit} className="space-y-4">
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
            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Verify
            </button>
          </form>
        )}

        {step === "forgot-email" && (
          <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Enter your email and we&apos;ll send you a reset code.
            </p>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input id="email" name="email" type="email" required className={inputClass} />
              {errors?.fields?.identifier && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {friendlyError(errors.fields.identifier.message)}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send reset code
            </button>
            <button
              type="button"
              onClick={() => setStep("password")}
              className="w-full text-center text-sm font-medium text-zinc-500 dark:text-zinc-400"
            >
              Back to sign in
            </button>
          </form>
        )}

        {step === "forgot-code" && (
          <form onSubmit={handleForgotCodeSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reset code
              </label>
              <input id="code" name="code" type="text" required className={inputClass} />
              {errors?.fields?.code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.fields.code.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Verify code
            </button>
          </form>
        )}

        {step === "forgot-password" && (
          <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className={inputClass}
              />
              {errors?.fields?.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.fields.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Set new password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
