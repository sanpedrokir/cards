"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function ModalSubmitButton({
  label,
  danger,
}: {
  label: string;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex-1 ${danger ? "btn-danger" : "btn-primary"}`}
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}

export default function ConfirmSubmitButton({
  triggerLabel,
  triggerClassName,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
}: {
  triggerLabel: React.ReactNode;
  triggerClassName?: string;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary flex-1 px-4 py-2.5"
              >
                Cancel
              </button>
              <ModalSubmitButton label={confirmLabel} danger={danger} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
