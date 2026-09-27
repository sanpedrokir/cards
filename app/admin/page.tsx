import { requireAdminUserId } from "@/lib/auth-helpers";
import { isSubscriptionGateEnabled } from "@/lib/store";
import { toggleSubscriptionGate } from "@/lib/actions";

export default async function AdminPage() {
  await requireAdminUserId();
  const enabled = await isSubscriptionGateEnabled();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Admin
      </h1>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Subscription required
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {enabled
                ? "Users without an active subscription are sent to /pricing."
                : "Everyone has free access right now — no subscription needed."}
            </p>
          </div>
          <form action={toggleSubscriptionGate}>
            <button
              type="submit"
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white ${
                enabled
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {enabled ? "Turn Off" : "Turn On"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
