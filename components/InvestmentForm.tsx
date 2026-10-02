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
        <label htmlFor="amount" className="label-field">
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
          className="input-field"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="currency" className="label-field">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            defaultValue={investment?.currency ?? "SGD"}
            className="input-field"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="label-field">
            Investment Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={investment?.date ?? new Date().toISOString().slice(0, 10)}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="label-field">
          Notes <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={investment?.notes}
          className="input-field"
        />
      </div>

      {state?.error && <p className="notice-error">{state.error}</p>}

      <SubmitButton className="w-full">
        {investment ? "Save Changes" : "Set Up Investment"}
      </SubmitButton>
    </form>
  );
}
