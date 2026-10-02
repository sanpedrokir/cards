"use client";

import { useActionState, useState } from "react";
import { sellCard } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import { formatMoney, todayIso, SALE_CHANNELS } from "@/lib/format";
import SubmitButton from "./SubmitButton";

export default function SellForm({
  cardId,
  purchasePrice,
  currency,
}: {
  cardId: string;
  purchasePrice: number;
  currency: string;
}) {
  const [state, formAction] = useActionState(sellCard, initialFormState);
  const [salePrice, setSalePrice] = useState<string>("");
  const [fees, setFees] = useState<string>("");

  const parsedPrice = Number(salePrice);
  const parsedFees = Number(fees) || 0;
  const hasPrice = salePrice !== "" && Number.isFinite(parsedPrice);
  const profit = hasPrice ? parsedPrice - purchasePrice - parsedFees : null;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="cardId" value={cardId} />

      <div className="notice-neutral">
        Purchase cost:{" "}
        <span className="font-semibold">
          {formatMoney(purchasePrice, currency)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="salePrice" className="label-field">
            Sale Amount *
          </label>
          <input
            id="salePrice"
            name="salePrice"
            type="number"
            step="0.01"
            min="0"
            required
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="1200.00"
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="saleDate" className="label-field">
            Sales Date
          </label>
          <input
            id="saleDate"
            name="saleDate"
            type="date"
            defaultValue={todayIso()}
            className="input-field"
          />
        </div>
      </div>

      {profit !== null && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            profit >= 0
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
          }`}
        >
          Expected profit: {profit >= 0 ? "+" : ""}
          {formatMoney(profit, currency)}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-900 dark:text-white">
          Optional Details
        </legend>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="buyer" className="label-field">
              Buyer
            </label>
            <input
              id="buyer"
              name="buyer"
              type="text"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="channel" className="label-field">
              Marketplace / Channel
            </label>
            <select
              id="channel"
              name="channel"
              defaultValue=""
              className="input-field"
            >
              <option value="" disabled>
                Select...
              </option>
              {SALE_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="fees" className="label-field">
            Fees <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="fees"
            name="fees"
            type="number"
            step="0.01"
            min="0"
            value={fees}
            onChange={(e) => setFees(e.target.value)}
            placeholder="0.00"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="notes" className="label-field">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="input-field"
          />
        </div>
      </fieldset>

      {state?.error && <p className="notice-error">{state.error}</p>}

      <SubmitButton className="w-full">Confirm Sale</SubmitButton>
    </form>
  );
}
