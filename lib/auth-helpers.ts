import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { hasActiveSubscription } from "./store";

export async function requireSignedInUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

export async function requirePageUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await hasActiveSubscription(userId))) redirect("/pricing");
  return userId;
}
