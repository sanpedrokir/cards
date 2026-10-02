import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { hasActiveSubscription, isSubscriptionGateEnabled } from "./store";

export async function requireSignedInUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

export async function requirePageUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // isSubscriptionGateEnabled() is cached for 30s (see lib/store.ts), so this
  // is often free. hasActiveSubscription() is NOT cached and is a full DB
  // round-trip -- only worth paying for when the gate is actually on, which
  // is the uncommon case. Previously both ran unconditionally on every page
  // load, wasting a query on every single navigation while the gate is off.
  const gateEnabled = await isSubscriptionGateEnabled();
  if (gateEnabled && !(await hasActiveSubscription(userId))) {
    redirect("/pricing");
  }

  return userId;
}

export async function requireAdminUserId(): Promise<string> {
  const userId = await requireSignedInUserId();
  if (userId !== process.env.ADMIN_USER_ID) redirect("/");
  return userId;
}
