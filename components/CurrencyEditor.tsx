"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeCurrencyAction } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import { CURRENCIES } from "@/lib/format";

// Label-over-value stat pill (the dashboard hero) that switches the collection's
// currency, converting every stored amount at today's rate.
export default function CurrencyEditor({
  collectionId,
  currency,
}: {
  collectionId: string;
  currency: string;
}) {
  const [isSaving, startSaving] = useTransition();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (!pending) return;
    const formData = new FormData();
    formData.set("collectionId", collectionId);
    formData.set("currency", pending);
    startSaving(async () => {
      const res = await changeCurrencyAction(initialFormState, formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      setPending(null);
      router.refresh();
    });
  }

  return (
    <div>
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-300/80">
        Currency
      </p>
      <select
        aria-label="Currency"
        value={pending ?? currency}
        onChange={(e) => {
          setError(null);
          setPending(e.target.value === currency ? null : e.target.value);
        }}
        disabled={isSaving}
        className="-ml-1 rounded-lg bg-transparent py-0 pl-1 pr-1 text-sm font-bold text-white focus:outline-none disabled:opacity-60 [&>option]:text-slate-900"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !isSaving && setPending(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-[#0a141b]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Convert {currency} to {pending}?
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {`Updates every card's prices to ${pending} at today's rate. Converting back later won't restore the exact original numbers, since rates shift daily.`}
            </p>
            {error && (
              <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={isSaving}
                className="btn-secondary flex-1 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving}
                className="btn-primary flex-1 px-4 py-2"
              >
                {isSaving ? "Converting…" : "Convert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
