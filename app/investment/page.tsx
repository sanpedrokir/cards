import { requirePageUserId } from "@/lib/auth-helpers";
import { readDb } from "@/lib/store";
import InvestmentForm from "@/components/InvestmentForm";
import ChangeCurrencyForm from "@/components/ChangeCurrencyForm";

export default async function InvestmentPage() {
  const userId = await requirePageUserId();
  const { investment } = await readDb(userId);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="page-title">Investment</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {investment
            ? "Update the amount invested into your card business."
            : "Record the initial amount invested into your card business."}
        </p>
      </div>

      <div className="surface p-5">
        <InvestmentForm investment={investment} />
      </div>

      {investment && (
        <div className="surface p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Currency
          </h2>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Switch currencies and convert all your existing amounts at
            today&apos;s exchange rate.
          </p>
          <div className="mt-3">
            <ChangeCurrencyForm currentCurrency={investment.currency} />
          </div>
        </div>
      )}
    </div>
  );
}
