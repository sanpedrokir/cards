"use client";

import { deleteCardAction } from "@/lib/actions";
import ConfirmSubmitButton from "./ConfirmSubmitButton";

export default function DeleteCardButton({
  cardId,
  cardName,
}: {
  cardId: string;
  cardName: string;
}) {
  return (
    <form action={deleteCardAction.bind(null, cardId)}>
      <ConfirmSubmitButton
        triggerLabel="Delete Card"
        triggerClassName="mt-3 block text-center text-sm font-medium text-red-600 underline-offset-2 hover:underline dark:text-red-400"
        title="Delete this card?"
        message={`"${cardName}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </form>
  );
}
