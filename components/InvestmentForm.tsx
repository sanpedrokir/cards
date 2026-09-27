"use client";

import { useActionState } from "react";
import { saveInvestment } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import { CURRENCIES } from "@/lib/format";
import SubmitButton from "./SubmitButton";
import type { Investment } from "@/lib/types";

export default function InvestmentForm({
  investment,
}: {
  investment: Investment | null;
}) {
  const [state, formAction] = useActionState(saveInvestment, initialFormState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Investment Amount
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={investment?.amount}
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            defaultValue={investment?.currency ?? "SGD"}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Investment Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={investment?.date ?? new Date().toISOString().slice(0, 10)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes <span className="text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={investment?.notes}
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full">
        {investment ? "Save Changes" : "Set Up Investment"}
      </SubmitButton>
    </form>
  );
}
