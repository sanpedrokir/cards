"use client";

import { useState, useRef, useActionState, useTransition } from "react";
import { updateInvestmentAmount } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import { formatMoney, formatDate } from "@/lib/format";

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
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

export default function InvestedAmountEditor({
  amount,
  currency,
  since,
}: {
  amount: number;
  currency: string;
  since: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(updateInvestmentAmount, initialFormState);
  const [isSaving, startSaving] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const savedRef = useRef(false);

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    if (!value || value <= 0 || value === amount) {
      setEditing(false);
      return;
    }
    savedRef.current = true;
    startSaving(() => {
      formRef.current?.requestSubmit();
    });
  }

  if (editing) {
    return (
      <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400">Overall Fund Invested:</span>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={amount}
          autoFocus
          disabled={isSaving}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900"
        />
        {isSaving && (
          <span className="text-xs text-slate-400 dark:text-slate-500">Saving…</span>
        )}
        {state?.error && !savedRef.current && (
          <p className="w-full text-xs text-rose-600 dark:text-rose-400">{state.error}</p>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-slate-500 dark:text-slate-400">Overall Fund Invested: </span>
      <span className="font-semibold text-amber-600 dark:text-amber-400">
        {formatMoney(amount, currency)}
      </span>
      <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
        (started {formatDate(since)})
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit total invested"
        className="btn-ghost-icon ml-1"
      >
        <PencilIcon />
      </button>
    </div>
  );
}
