"use client";

import { useEffect, useRef, useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInvestmentAmount, changeCurrencyAction } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import { formatMoney, formatDate, CURRENCIES } from "@/lib/format";

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
  const [amountState, amountFormAction] = useActionState(updateInvestmentAmount, initialFormState);
  const [currencyState, currencyFormAction] = useActionState(changeCurrencyAction, initialFormState);
  const [isSavingAmount, startSavingAmount] = useTransition();
  const [isSavingCurrency, startSavingCurrency] = useTransition();
  const amountFormRef = useRef<HTMLFormElement>(null);
  const currencyFormRef = useRef<HTMLFormElement>(null);
  const savedAmountRef = useRef(false);
  const savedCurrencyRef = useRef(false);
  const router = useRouter();

  const [amountInput, setAmountInput] = useState(String(amount));
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);

  useEffect(() => {
    if (!isSavingAmount && savedAmountRef.current) {
      savedAmountRef.current = false;
      if (!amountState?.error) {
        setEditing(false);
        router.refresh();
      }
    }
  }, [isSavingAmount, amountState, router]);

  useEffect(() => {
    if (!isSavingCurrency && savedCurrencyRef.current) {
      savedCurrencyRef.current = false;
      if (!currencyState?.error) {
        setEditing(false);
        setPendingCurrency(null);
        router.refresh();
      }
    }
  }, [isSavingCurrency, currencyState, router]);

  const isSaving = isSavingAmount || isSavingCurrency;

  function handleAmountBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    if (!e.target.value || Number.isNaN(value) || value <= 0 || value === amount) {
      setEditing(false);
      return;
    }
    savedAmountRef.current = true;
    startSavingAmount(() => {
      amountFormRef.current?.requestSubmit();
    });
  }

  function handleCurrencyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === currency) {
      setPendingCurrency(null);
      return;
    }
    setPendingCurrency(next);
  }

  function handleConfirmCurrency() {
    if (!pendingCurrency) return;
    savedCurrencyRef.current = true;
    startSavingCurrency(() => {
      currencyFormRef.current?.requestSubmit();
    });
  }

  if (editing) {
    return (
      <div className="inline-flex flex-wrap items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400">Overall Fund Invested:</span>

        <form ref={amountFormRef} action={amountFormAction} className="contents">
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            autoFocus
            disabled={isSaving}
            onBlur={handleAmountBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-28 rounded-xl border-2 border-stone-200 px-2 py-1 text-sm focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-200/60 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900"
          />
        </form>

        <form ref={currencyFormRef} action={currencyFormAction} className="contents">
          <input type="hidden" name="currency" value={pendingCurrency ?? currency} />
        </form>
        <select
          value={pendingCurrency ?? currency}
          onChange={handleCurrencyChange}
          disabled={isSaving}
          className="rounded-xl border-2 border-stone-200 px-2 py-1 text-sm disabled:opacity-60 dark:border-white/10 dark:bg-slate-900"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {isSaving && (
          <span className="text-xs text-slate-400 dark:text-slate-500">Saving…</span>
        )}
        {amountState?.error && (
          <p className="w-full text-xs text-rose-600 dark:text-rose-400">{amountState.error}</p>
        )}
        {currencyState?.error && (
          <p className="w-full text-xs text-rose-600 dark:text-rose-400">{currencyState.error}</p>
        )}

        {pendingCurrency && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setPendingCurrency(null)}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Convert {currency} to {pendingCurrency}?
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {`Updates your investment and every card's prices to ${pendingCurrency} at today's rate. Converting back later won't restore the exact original numbers, since rates shift daily.`}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPendingCurrency(null)}
                  className="btn-secondary flex-1 px-4 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCurrency}
                  className="btn-primary flex-1 px-4 py-2.5"
                >
                  Convert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-slate-500 dark:text-slate-400">Overall Fund Invested: </span>
      <span className="font-semibold text-amber-700 dark:text-amber-400">
        {formatMoney(amount, currency)}
      </span>
      <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
        (started {formatDate(since)})
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit total invested or currency"
        className="btn-ghost-icon ml-1"
      >
        <PencilIcon />
      </button>
    </div>
  );
}
