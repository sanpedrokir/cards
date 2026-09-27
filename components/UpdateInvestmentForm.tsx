"use client";

import { useActionState } from "react";
import { updateInvestmentAmount } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import ConfirmSubmitButton from "./ConfirmSubmitButton";

export default function UpdateInvestmentForm({
  currentAmount,
}: {
  currentAmount: number;
}) {
  const [state, formAction] = useActionState(updateInvestmentAmount, initialFormState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="min-w-[140px] flex-1">
        <label
          htmlFor="update-investment-amount"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Update Total Invested
        </label>
        <input
          id="update-investment-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={currentAmount}
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <ConfirmSubmitButton
        triggerLabel="Update"
        triggerClassName="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        title="Update total invested?"
        message="This overwrites your recorded total invested amount. This cannot be undone."
        confirmLabel="Update"
      />
      {state?.error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}
