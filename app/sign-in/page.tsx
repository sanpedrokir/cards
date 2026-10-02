"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useAuth } from "@clerk/nextjs";

const inputClass = "input-field";

function friendlyError(message?: string | null): string | undefined {
  if (!message) return undefined;
  if (message.toLowerCase().includes("couldn't find your account")) {
    return "Couldn't find your account. Please create an account first.";
  }
  return message;
}

type Step = "email" | "code";

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [stuckStatus, setStuckStatus] = useState<string | null>(null);

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

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStuckStatus(null);

    const formData = new FormData(e.currentTarget);
    const emailAddress = String(formData.get("email") ?? "").trim();

    const { error } = await signIn.emailCode.sendCode({ emailAddress });
    if (error) return;

    setStep("code");
  }

  async function handleCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStuckStatus(null);

    const formData = new FormData(e.currentTarget);
    const code = String(formData.get("code") ?? "");

    const { error } = await signIn.emailCode.verifyCode({ code });
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
      <h1 className="page-title">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        New to Vaulted?{" "}
        <a href="/sign-up" className="font-medium text-indigo-600 dark:text-indigo-400">
          Create an account
        </a>
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
                  {friendlyError(errors.fields.identifier.message)}
                </p>
              )}
            </div>

            {errors?.global && errors.global.length > 0 && (
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {friendlyError(errors.global[0].message)}
              </p>
            )}

            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="btn-primary w-full"
            >
              {fetchStatus === "fetching" ? "Sending code…" : "Send code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              We emailed you a code — if you don&apos;t see it within a few
              minutes, please check your spam/junk folder.
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

            {errors?.global && errors.global.length > 0 && (
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {friendlyError(errors.global[0].message)}
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
          </form>
        )}
      </div>
    </div>
  );
}
