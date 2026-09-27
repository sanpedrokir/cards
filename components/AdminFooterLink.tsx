import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function AdminFooterLink() {
  const { userId } = await auth();
  if (!userId || userId !== process.env.ADMIN_USER_ID) return null;

  return (
    <footer className="mx-auto w-full max-w-4xl px-4 pb-20 text-center sm:px-6 sm:pb-6">
      <Link
        href="/admin"
        className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
      >
        Admin
      </Link>
    </footer>
  );
}
