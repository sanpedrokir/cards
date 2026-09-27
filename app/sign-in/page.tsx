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

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [stuckStatus, setStuckStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStuckStatus(null);

    const formData = new FormData(e.currentTarget);
    const emailAddress = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const { error } = await signIn.password({ identifier: emailAddress, password });

    if (error) return;

    if (signIn.status === "complete") {
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
    } else {
      // Clerk needs an extra step this page doesn't have UI for (e.g. it
      // flagged the password as compromised and wants it reset).
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input id="password" name="password" type="password" required className={inputClass} />
            {errors?.fields?.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.fields.password.message}
              </p>
            )}
          </div>

          {stuckStatus && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Clerk needs an extra verification step ({stuckStatus}) that this
              sign-in form doesn&apos;t support yet — this often means the
              password was flagged as compromised. Please use a different
              password, or ask the app owner to reset it.
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
      </div>
    </div>
  );
}
