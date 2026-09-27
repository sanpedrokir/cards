import { PricingTable } from "@clerk/nextjs";
import { requireSignedInUserId } from "@/lib/auth-helpers";

export default async function PricingPage() {
  await requireSignedInUserId();

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
          Subscribe to Vaulted
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          $10/month, cancel anytime.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <PricingTable />
      </div>

      <p className="mt-4 text-center text-sm">
        <a href="/" className="font-medium text-blue-600 dark:text-blue-400">
          Already subscribed? Go to Dashboard →
        </a>
      </p>
    </div>
  );
}
