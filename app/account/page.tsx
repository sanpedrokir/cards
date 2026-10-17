import { UserProfile } from "@clerk/nextjs";
import { requireSignedInUserId } from "@/lib/auth-helpers";

// Clerk's profile screen is where people add a second sign-in method. Adding
// the other one (email <-> phone) to the same account is what stops someone
// ending up with two separate accounts -- and paying for two subscriptions.
export default async function AccountPage() {
  await requireSignedInUserId();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="page-title">Account</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add both an email and a mobile number to this account so you can sign in either way
          and keep a single set of collections and one subscription.
        </p>
      </div>
      <UserProfile routing="hash" />
    </div>
  );
}
