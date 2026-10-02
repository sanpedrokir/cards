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
          className="mx-auto h-20 w-20 rounded-2xl shadow-lg shadow-amber-500/25"
        />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
          {gateEnabled ? "Subscribe to Vaulted" : "Vaulted is free right now"}
        </h1>
        {gateEnabled && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            $1.99/month, cancel anytime.
          </p>
        )}
      </div>

      <div className="surface mt-6 p-5">
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>Track card purchases, sales and profit</li>
          <li>Unlimited cards and sales history</li>
        </ul>

        {gateEnabled ? (
          <form action={startCheckout} className="mt-5">
            <button type="submit" className="btn-primary w-full">
              Subscribe — $1.99/month
            </button>
          </form>
        ) : (
          <Link href="/" className="btn-primary mt-5 w-full">
            Go to Dashboard
          </Link>
        )}
      </div>

      {gateEnabled && (
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Payments are processed securely by Stripe.
        </p>
      )}
    </div>
  );
}
