"use client";

import { useActionState } from "react";
import { deleteAccountAction } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import ConfirmSubmitButton from "./ConfirmSubmitButton";

export default function DeleteAccountForm() {
  const [state, formAction] = useActionState(deleteAccountAction, initialFormState);

  return (
    <form action={formAction} className="space-y-3">
      <ConfirmSubmitButton
        triggerLabel="Delete my account"
        triggerClassName="btn-danger"
        title="Delete your account?"
        message="This permanently deletes your account, all of your collections, cards, photos and sales, and cancels any subscription. It cannot be undone."
        confirmLabel="Delete forever"
        danger
      />
      {state.error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">{state.error}</p>
      )}
    </form>
  );
}
