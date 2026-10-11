"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  className = "",
  small = false,
}: {
  children: React.ReactNode;
  className?: string;
  small?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${small ? "btn-primary-sm shrink-0" : "btn-primary"} ${className}`}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
