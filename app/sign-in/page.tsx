"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { COUNTRY_DIAL_CODES } from "@/lib/countries";

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

  const [countryDial, setCountryDial] = useState(COUNTRY_DIAL_CODES[0].dial);
  const [localPhone, setLocalPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPhoneError(null);

    const digits = localPhone.replace(/\D/g, "");
    if (digits.length < 6 || digits.length > 12) {
      setPhoneError("Enter a valid phone number.");
      return;
    }

    const phoneNumber = `${countryDial}${digits}`;
    const { error } = await signIn.phoneCode.sendCode({ phoneNumber });
    if (!error) setCodeSent(true);
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await signIn.phoneCode.verifyCode({ code });

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
    }
  }

  if (signIn.status === "complete" || isSignedIn) {
    return null;
  }

  if (codeSent) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Enter your code
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          We sent an SMS code to {countryDial}
          {localPhone.replace(/\D/g, "")}. It&apos;s valid for 10 minutes.
        </p>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Verification code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={inputClass}
              />
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
              {fetchStatus === "fetching" ? "Verifying…" : "Verify"}
            </button>

            <button
              type="button"
              onClick={() => {
                const digits = localPhone.replace(/\D/g, "");
                signIn.phoneCode.sendCode({ phoneNumber: `${countryDial}${digits}` });
              }}
              className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              Resend code
            </button>
          </form>
        </div>
      </div>
    );
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
            <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Phone number
            </label>
            <div className="mt-1 flex gap-2">
              <select
                value={countryDial}
                onChange={(e) => setCountryDial(e.target.value)}
                aria-label="Country code"
                className="rounded-xl border border-zinc-300 px-2 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {COUNTRY_DIAL_CODES.map((c) => (
                  <option key={c.code} value={c.dial}>
                    {c.name} ({c.dial})
                  </option>
                ))}
              </select>
              <input
                id="phone"
                type="tel"
                required
                placeholder="9123 4567"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
                className={`${inputClass} mt-0 flex-1`}
              />
            </div>
            {(phoneError || errors?.fields?.identifier) && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {phoneError ?? friendlyError(errors?.fields?.identifier?.message)}
              </p>
            )}
          </div>

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
            {fetchStatus === "fetching" ? "Sending code…" : "Send code"}
          </button>
        </form>
      </div>
    </div>
  );
}
