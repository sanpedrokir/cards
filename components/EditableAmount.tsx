"use client";

import { useEffect, useRef, useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { initialFormState } from "@/lib/form-state";
import type { FormState } from "@/lib/form-state";

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

export default function EditableAmount({
  action,
  hiddenFields,
  amount,
  currency,
  ariaLabel,
  min = "0",
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  hiddenFields: Record<string, string>;
  amount: number;
  currency: string;
  ariaLabel: string;
  min?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(action, initialFormState);
  const [isSaving, startSaving] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const savedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!isSaving && savedRef.current) {
      savedRef.current = false;
      if (!state?.error) {
        setEditing(false);
        router.refresh();
      }
    }
  }, [isSaving, state, router]);

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    if (e.target.value === "" || Number.isNaN(value) || value < 0 || value === amount) {
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
      <form ref={formRef} action={formAction} className="inline-flex flex-wrap items-center justify-end gap-1">
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input
          name="amount"
          type="number"
          step="0.01"
          min={min}
          required
          defaultValue={amount}
          autoFocus
          disabled={isSaving}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-24 rounded-xl border-2 border-stone-200 px-2 py-1 text-right text-sm focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-200/60 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900"
        />
        {isSaving && (
          <span className="text-xs text-slate-400 dark:text-slate-500">Saving…</span>
        )}
        {state?.error && (
          <p className="w-full text-right text-xs text-rose-600 dark:text-rose-400">
            {state.error}
          </p>
        )}
      </form>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      {formatMoney(amount, currency)}
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={ariaLabel}
        className="btn-ghost-icon p-0.5"
      >
        <PencilIcon />
      </button>
    </span>
  );
}
