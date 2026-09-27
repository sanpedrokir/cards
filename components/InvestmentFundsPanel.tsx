"use client";

import { useState } from "react";
import { useActionState } from "react";
import { addFunds, updateInvestmentAmount } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import SubmitButton from "./SubmitButton";
import ConfirmSubmitButton from "./ConfirmSubmitButton";

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function InvestmentFundsPanel({
  currentAmount,
}: {
  currentAmount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [addState, addAction] = useActionState(addFunds, initialFormState);
  const [updateState, updateAction] = useActionState(
    updateInvestmentAmount,
    initialFormState
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {editing ? "Update Total Invested" : "Add Investment Funds"}
        </span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-label={editing ? "Cancel editing total invested" : "Edit total invested"}
          className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          {editing ? <XIcon /> : <PencilIcon />}
        </button>
      </div>

      {editing ? (
        <form action={updateAction} className="mt-2 flex flex-wrap items-end gap-3">
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={currentAmount}
            className="min-w-[140px] flex-1 rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <ConfirmSubmitButton
            triggerLabel="Update"
            triggerClassName="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            title="Update total invested?"
            message="This overwrites your recorded total invested amount. This cannot be undone."
            confirmLabel="Update"
          />
          {updateState?.error && (
            <p className="w-full text-sm text-red-600 dark:text-red-400">
              {updateState.error}
            </p>
          )}
        </form>
      ) : (
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
      )}
    </div>
  );
}
