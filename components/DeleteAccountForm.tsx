"use client";

import { useActionState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { deleteAccountAction } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import ConfirmSubmitButton from "./ConfirmSubmitButton";

export default function DeleteAccountForm() {
  const [state, formAction] = useActionState(deleteAccountAction, initialFormState);
  const { signOut } = useClerk();

  useEffect(() => {
    if (!state.done) return;
    // The user is already deleted server-side, so ending the session can fail;
    // go to /sign-in either way (full reload drops any stale client state).
    signOut()
      .catch(() => {})
      .finally(() => {
        window.location.href = "/sign-in";
      });
  }, [state.done, signOut]);

  return (
    <form action={formAction} className="space-y-3">
      <ConfirmSubmitButton
        triggerLabel="Delete my account"
        triggerClassName="btn-danger"
        title="Delete your account?"
        message="This permanently deletes your account, all of your collections, cards, photos and sales, and cancels any subscription. It cannot be undone."
        confirmLabel="Delete forever"
        danger
        requireText="DELETE"
      />
      {state.error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">{state.error}</p>
      )}
    </form>
  );
}
