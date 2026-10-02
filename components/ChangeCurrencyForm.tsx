"use client";

import { useEffect, useRef, useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeCurrencyAction } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import { CURRENCIES } from "@/lib/format";

export default function ChangeCurrencyForm({
  currentCurrency,
}: {
  currentCurrency: string;
}) {
  const [state, formAction] = useActionState(changeCurrencyAction, initialFormState);
  const [isSaving, startSaving] = useTransition();
  const otherCurrencies = CURRENCIES.filter((c) => c !== currentCurrency);
  const [target, setTarget] = useState<string>(otherCurrencies[0]);
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const savedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!isSaving && savedRef.current) {
      savedRef.current = false;
      if (!state?.error) {
        router.refresh();
      }
    }
  }, [isSaving, state, router]);

  function handleConfirm() {
    savedRef.current = true;
    setConfirming(false);
    startSaving(() => {
      formRef.current?.requestSubmit();
    });
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="currency" value={target} />
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Current currency: <span className="font-semibold">{currentCurrency}</span>
      </p>
      <div className="flex items-center gap-3">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={isSaving}
          className="input-field mt-0 flex-1"
        >
          {otherCurrencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={isSaving}
          className="btn-secondary px-4 py-2.5"
        >
          {isSaving ? "Converting…" : "Convert"}
        </button>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Converts your investment amount and every card&apos;s purchase/sale
        price using today&apos;s exchange rate.
      </p>

      {state?.error && <p className="notice-error">{state.error}</p>}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirming(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Convert {currentCurrency} to {target}?
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This updates your investment amount and every card&apos;s
              purchase/sale price and fees from {currentCurrency} to {target}
              using today&apos;s exchange rate. Amounts are changed
              permanently — this can&apos;t be perfectly undone later since
              rates move day to day.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="btn-secondary flex-1 px-4 py-2.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="btn-primary flex-1 px-4 py-2.5"
              >
                Convert
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
