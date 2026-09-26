"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
