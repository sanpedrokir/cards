import { currentUser } from "@clerk/nextjs/server";
import { requireSignedInUserId } from "@/lib/auth-helpers";
import DeleteAccountForm from "@/components/DeleteAccountForm";

export const metadata = {
  title: "Account — Vaulted",
};

export default async function AccountPage() {
  // Not requirePageUserId: this page must stay reachable without a
  // subscription so anyone can delete their account.
  await requireSignedInUserId();
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="page-title">Account</h1>
        {email && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{email}</p>
        )}
      </div>

      <section className="surface space-y-3 p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Delete account
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Permanently delete your account and all of your data: collections,
          cards, photos, budgets and sales. Any subscription is cancelled
          immediately. This cannot be undone.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
