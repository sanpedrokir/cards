import { readDb } from "@/lib/store";
import InvestmentForm from "@/components/InvestmentForm";

export const dynamic = "force-dynamic";

export default async function InvestmentPage() {
  const { investment } = await readDb();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Investment
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {investment
            ? "Update the amount invested into your card business."
            : "Record the initial amount invested into your card business."}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <InvestmentForm investment={investment} />
      </div>
    </div>
  );
}
