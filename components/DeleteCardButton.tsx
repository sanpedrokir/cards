"use client";

import { deleteCardAction } from "@/lib/actions";

export default function DeleteCardButton({
  cardId,
  cardName,
}: {
  cardId: string;
  cardName: string;
}) {
  return (
    <form action={deleteCardAction.bind(null, cardId)}>
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(`Delete "${cardName}"? This cannot be undone.`)) {
            e.preventDefault();
          }
        }}
        className="mt-3 flex w-full items-center justify-center rounded-full border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        Delete Card
      </button>
    </form>
  );
}
