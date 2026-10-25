"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function ModalSubmitButton({
  label,
  danger,
  blocked,
}: {
  label: string;
  danger?: boolean;
  blocked?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || blocked}
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
  requireText,
}: {
  triggerLabel: React.ReactNode;
  triggerClassName?: string;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  // When set, the user must type this exact text before the action is enabled.
  requireText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  return (
    <>
      <button type="button" onClick={() => { setTyped(""); setOpen(true); }} className={triggerClassName}>
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
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-[#12212b]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
            {requireText && (
              <label className="mt-4 block text-sm text-slate-600 dark:text-slate-400">
                Type <span className="font-semibold">{requireText}</span> to confirm
                <input
                  name="confirmation"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-slate-900 dark:border-white/20 dark:text-white"
                />
              </label>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary flex-1 px-4 py-2"
              >
                Cancel
              </button>
              <ModalSubmitButton
                label={confirmLabel}
                danger={danger}
                blocked={requireText !== undefined && typed !== requireText}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
