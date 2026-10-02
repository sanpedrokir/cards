import Link from "next/link";
import { requireAdminUserId } from "@/lib/auth-helpers";
import { isSubscriptionGateEnabled } from "@/lib/store";
import { toggleSubscriptionGate } from "@/lib/actions";

export default async function AdminPage() {
  await requireAdminUserId();
  const enabled = await isSubscriptionGateEnabled();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="page-title">Admin</h1>

      <div className="surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Subscription required
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {enabled
                ? "Users without an active subscription are sent to /pricing."
                : "Everyone has free access right now — no subscription needed."}
            </p>
          </div>
          <form action={toggleSubscriptionGate}>
            <button
              type="submit"
              className={`shrink-0 ${enabled ? "btn-danger" : "btn-primary"} px-4 py-2 text-sm`}
            >
              {enabled ? "Turn Off" : "Turn On"}
            </button>
          </form>
        </div>
      </div>

      <Link
        href="/admin/subscriptions"
        className="surface block p-5 text-sm font-medium text-amber-700 hover:bg-slate-50 dark:text-amber-400 dark:hover:bg-white/5"
      >
        View subscriptions →
      </Link>
    </div>
  );
}
