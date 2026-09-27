"use client";

import { useActionState, useState } from "react";
import { sellCard } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import { formatMoney, formatDate, todayIso, SALE_CHANNELS } from "@/lib/format";
import type { Card } from "@/lib/types";
import SubmitButton from "./SubmitButton";

export default function SellPickerForm({
  cards,
  currency,
}: {
  cards: Card[];
  currency: string;
}) {
  const [state, formAction] = useActionState(sellCard, initialFormState);
  const [selectedCardId, setSelectedCardId] = useState("");
  const selectedCard = cards.find((c) => c.id === selectedCardId);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="cardId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Card *
        </label>
        <select
          id="cardId"
          name="cardId"
          required
          value={selectedCardId}
          onChange={(e) => setSelectedCardId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            Select a card to sell...
          </option>
          {cards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.name} · {formatMoney(card.purchasePrice, currency)}
            </option>
          ))}
        </select>

        {selectedCard?.imageUrl && (
          <a
            href={selectedCard.imageUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block h-20 w-16 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedCard.imageUrl}
              alt={selectedCard.name}
              className="h-full w-full object-cover"
            />
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="salePrice" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Sales Amount *
          </label>
          <input
            id="salePrice"
            name="salePrice"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="1200.00"
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Sale Date
          </span>
          <div className="mt-1 flex h-[46px] w-full items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-base text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
            {formatDate(todayIso())}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Comment <span className="text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Add a comment about this sale..."
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          More details (optional)
        </summary>
        <fieldset className="space-y-4 px-4 pb-4">
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
              placeholder="0.00"
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

      <SubmitButton className="w-full">Confirm Sale</SubmitButton>
    </form>
  );
}
