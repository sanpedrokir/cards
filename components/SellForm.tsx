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

      <div className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        Purchase cost:{" "}
        <span className="font-semibold">
          {formatMoney(purchasePrice, currency)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="salePrice" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="saleDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Sales Date
          </label>
          <input
            id="saleDate"
            name="saleDate"
            type="date"
            defaultValue={todayIso()}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      {profit !== null && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            profit >= 0
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
          }`}
        >
          Expected profit: {profit >= 0 ? "+" : ""}
          {formatMoney(profit, currency)}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Optional Details
        </legend>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="buyer" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Buyer
            </label>
            <input
              id="buyer"
              name="buyer"
              type="text"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="channel" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Marketplace / Channel
            </label>
            <select
              id="channel"
              name="channel"
              defaultValue=""
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
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
          <label htmlFor="fees" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Fees <span className="text-zinc-400">(optional)</span>
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
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </fieldset>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full">Confirm Sale</SubmitButton>
    </form>
  );
}
