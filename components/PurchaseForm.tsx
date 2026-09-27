"use client";

import { useActionState } from "react";
import { purchaseCard } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import { formatMoney, formatDate, todayIso } from "@/lib/format";
import SubmitButton from "./SubmitButton";

export default function PurchaseForm({
  availableBalance,
  currency,
}: {
  availableBalance: number;
  currency: string;
}) {
  const [state, formAction] = useActionState(purchaseCard, initialFormState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
        Available balance:{" "}
        <span className="font-semibold">
          {formatMoney(availableBalance, currency)}
        </span>
      </div>

      <fieldset className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Card Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="2023 Pokémon Charizard PSA 10"
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="purchasePrice" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Purchase Price *
            </label>
            <input
              id="purchasePrice"
              name="purchasePrice"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="850.00"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Purchase Date
            </span>
            <div className="mt-1 flex h-[46px] w-full items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-base text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
              {formatDate(todayIso())}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Photo
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            className="mt-1 w-full text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-200"
          />
        </div>
      </fieldset>

      <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          More details (optional)
        </summary>
        <fieldset className="space-y-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Category
              </label>
              <input
                id="category"
                name="category"
                type="text"
                placeholder="Pokémon"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="series" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Set / Series
              </label>
              <input
                id="series"
                name="series"
                type="text"
                placeholder="Base Set"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Card Number
              </label>
              <input
                id="cardNumber"
                name="cardNumber"
                type="text"
                placeholder="4/102"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Quantity
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Grade
              </label>
              <input
                id="grade"
                name="grade"
                type="text"
                placeholder="PSA 10"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="gradingCompany" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Grading Company
              </label>
              <input
                id="gradingCompany"
                name="gradingCompany"
                type="text"
                placeholder="PSA"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
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
      </details>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full">Add Card</SubmitButton>
    </form>
  );
}
