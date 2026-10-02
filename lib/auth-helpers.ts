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

  const [gateEnabled, hasSubscription] = await Promise.all([
    isSubscriptionGateEnabled(),
    hasActiveSubscription(userId),
  ]);
  if (gateEnabled && !hasSubscription) {
    redirect("/pricing");
  }

  return userId;
}

export async function requireAdminUserId(): Promise<string> {
  const userId = await requireSignedInUserId();
  if (userId !== process.env.ADMIN_USER_ID) redirect("/");
  return userId;
}
