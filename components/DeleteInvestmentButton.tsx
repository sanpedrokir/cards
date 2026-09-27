"use client";

import { deleteInvestmentAction } from "@/lib/actions";
import ConfirmSubmitButton from "./ConfirmSubmitButton";

export default function DeleteInvestmentButton() {
  return (
    <form action={deleteInvestmentAction}>
      <ConfirmSubmitButton
        triggerLabel="Delete Investment"
        triggerClassName="rounded-full border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
        title="Delete your investment?"
        message="This removes your recorded investment entirely and resets the dashboard to setup. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </form>
  );
}
