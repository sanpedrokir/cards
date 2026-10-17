import { currentUser } from "@clerk/nextjs/server";
import { requireSignedInUserId } from "@/lib/auth-helpers";
import LinkAccountForm from "@/components/LinkAccountForm";

export default async function AccountPage() {
  await requireSignedInUserId();
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const phone = user?.primaryPhoneNumber?.phoneNumber;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="page-title">Your account</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          One vault. Two ways in.
        </p>
      </div>

      <div className="surface divide-y divide-slate-200/70 dark:divide-white/10">
        <div className="flex items-center justify-between p-4 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Email</span>
          <span className="text-slate-900 dark:text-white">{email ?? "Not added"}</span>
        </div>
        <div className="flex items-center justify-between p-4 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Phone</span>
          <span className="text-slate-900 dark:text-white">{phone ?? "Not added"}</span>
        </div>
      </div>

      <LinkAccountForm />
    </div>
  );
}
