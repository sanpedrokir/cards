"use client";

import { useActionState } from "react";
import { addFunds } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import SubmitButton from "./SubmitButton";

export default function InvestmentFundsPanel() {
  const [addState, addAction] = useActionState(addFunds, initialFormState);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Add Investment Funds
      </span>

      <form action={addAction} className="mt-2 flex flex-wrap items-end gap-3">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="5000.00"
          className="min-w-[140px] flex-1 rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <SubmitButton className="px-5 py-2.5">Add</SubmitButton>
        {addState?.error && (
          <p className="w-full text-sm text-red-600 dark:text-red-400">
            {addState.error}
          </p>
        )}
      </form>
    </div>
  );
}
