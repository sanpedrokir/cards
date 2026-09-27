import Link from "next/link";
import { requireSignedInUserId } from "@/lib/auth-helpers";
import { isSubscriptionGateEnabled } from "@/lib/store";
import { startCheckout } from "@/lib/actions";

export default async function PricingPage() {
  await requireSignedInUserId();
  const gateEnabled = await isSubscriptionGateEnabled();

  return (
    <div className="mx-auto max-w-md">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/vaulted-logo.png"
          alt="Vaulted"
          className="mx-auto h-20 w-20"
        />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {gateEnabled ? "Subscribe to Vaulted" : "Vaulted is free right now"}
        </h1>
        {gateEnabled && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            $1.99/month, cancel anytime.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <li>Track card purchases, sales and profit</li>
          <li>Unlimited cards and sales history</li>
        </ul>

        {gateEnabled ? (
          <form action={startCheckout} className="mt-5">
            <button
              type="submit"
              className="w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Subscribe — $1.99/month
            </button>
          </form>
        ) : (
          <Link
            href="/"
            className="mt-5 flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        )}
      </div>

      {gateEnabled && (
        <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Payments are processed securely by Stripe.
        </p>
      )}
    </div>
  );
}
