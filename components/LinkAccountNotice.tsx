"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useUser } from "@clerk/nextjs";

const DISMISS_KEY = "vaulted_link_notice_dismissed";

// localStorage can throw (private windows, blocked storage), so every access is
// wrapped and the notice simply stays visible if it can't be read.
function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

const subscribe = () => () => {};

// Nudges people who signed up with only an email or only a phone number to add
// the other one, so they don't end up with two accounts (and two subscriptions).
export default function LinkAccountNotice() {
  const { user, isLoaded } = useUser();
  const dismissedBefore = useSyncExternalStore(subscribe, readDismissed, () => true);
  const [dismissed, setDismissed] = useState(false);

  if (!isLoaded || !user || dismissedBefore || dismissed) return null;

  const hasEmail = user.emailAddresses.length > 0;
  const hasPhone = user.phoneNumbers.length > 0;
  if (hasEmail && hasPhone) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setDismissed(true);
  }

  return (
    <div className="notice-info flex items-start justify-between gap-3">
      <p className="text-sm">
        Add your {hasEmail ? "mobile number" : "email"} so you can sign in either way and keep
        everything in one account.{" "}
        <Link href="/account" className="font-semibold underline">
          Add now
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-lg leading-none opacity-60"
      >
        ×
      </button>
    </div>
  );
}
