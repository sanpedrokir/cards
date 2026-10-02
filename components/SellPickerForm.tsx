"use client";

import { useActionState, useState } from "react";
import { sellCard } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import { formatMoney, formatDate, todayIso, SALE_CHANNELS } from "@/lib/format";
import type { Card } from "@/lib/types";
import SubmitButton from "./SubmitButton";
import EbayPriceCheck from "./EbayPriceCheck";

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
        <label htmlFor="cardId" className="label-field">
          Card *
        </label>
        <select
          id="cardId"
          name="cardId"
          required
          value={selectedCardId}
          onChange={(e) => setSelectedCardId(e.target.value)}
          className="input-field"
        >
          <option value="" disabled>
            Select Card
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
            className="mt-2 inline-block h-20 w-16 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
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

      {selectedCardId && (
        <EbayPriceCheck key={selectedCardId} cardId={selectedCardId} />
      )}

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
            placeholder="1200.00"
            className="input-field"
          />
        </div>
        <div>
          <span className="label-field">
            Sale Date
          </span>
          <div className="mt-1 flex h-[46px] w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-base text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {formatDate(todayIso())}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="label-field">
          Comment <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Add a comment about this sale..."
          className="input-field"
        />
      </div>

      <details className="group rounded-xl border border-slate-200 dark:border-white/10">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          More details (optional)
        </summary>
        <fieldset className="space-y-4 px-4 pb-4">
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
              placeholder="0.00"
              className="input-field"
            />
          </div>
        </fieldset>
      </details>

      {state?.error && <p className="notice-error">{state.error}</p>}

      <SubmitButton className="w-full">Confirm Sale</SubmitButton>
    </form>
  );
}
