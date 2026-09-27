import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export async function requireSignedInUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

export async function requirePageUserId(): Promise<string> {
  const { userId, has } = await auth();
  if (!userId) redirect("/sign-in");
  if (!has({ plan: "vaulted" })) redirect("/pricing");
  return userId;
}
