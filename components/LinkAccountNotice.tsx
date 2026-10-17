"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useUser } from "@clerk/nextjs";

const SNOOZE_KEY = "vaulted_link_notice_until";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

// localStorage can throw (private windows, blocked storage), so every access is
// wrapped and the notice simply stays visible if it can't be read.
function readSnoozed(): boolean {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

const subscribe = () => () => {};

// Nudges people who signed up with only an email or only a phone number to add
// the other one, so they don't end up with two accounts (and two subscriptions).
// "Later" snoozes it for a week instead of hiding it for good.
export default function LinkAccountNotice() {
  const { user, isLoaded } = useUser();
  const snoozedBefore = useSyncExternalStore(subscribe, readSnoozed, () => true);
  const [snoozed, setSnoozed] = useState(false);

  if (!isLoaded || !user || snoozedBefore || snoozed) return null;

  const hasEmail = user.emailAddresses.length > 0;
  const hasPhone = user.phoneNumbers.length > 0;
  if (hasEmail && hasPhone) return null;

  function snooze() {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {}
    setSnoozed(true);
  }

  return (
    <div className="notice-info flex items-center justify-between gap-3">
      <p className="text-sm">
        <strong>One vault, two ways in.</strong> Add your {hasEmail ? "number" : "email"}.
      </p>
      <div className="flex shrink-0 items-center gap-3 text-sm">
        <button type="button" onClick={snooze} className="opacity-60">
          Later
        </button>
        <Link href="/account" className="font-semibold underline">
          Add
        </Link>
      </div>
    </div>
  );
}
