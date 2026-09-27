"use client";

import { useActionState } from "react";
import { addFunds } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import SubmitButton from "./SubmitButton";

export default function AddFundsForm() {
  const [state, formAction] = useActionState(addFunds, initialFormState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="min-w-[140px] flex-1">
        <label
          htmlFor="add-funds-amount"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Add Investment Funds
        </label>
        <input
          id="add-funds-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="5000.00"
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <SubmitButton className="px-5 py-2.5">Add</SubmitButton>
      {state?.error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
