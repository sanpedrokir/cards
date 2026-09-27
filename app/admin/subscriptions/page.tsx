import Link from "next/link";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdminUserId } from "@/lib/auth-helpers";
import { getAllSubscriptions } from "@/lib/store";
import { formatDate } from "@/lib/format";

function statusTone(status: string) {
  if (status === "active" || status === "trialing") {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (status === "past_due") {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-zinc-500 dark:text-zinc-400";
}

export default async function AdminSubscriptionsPage() {
  await requireAdminUserId();
  const subscriptions = await getAllSubscriptions();

  const emailByUserId = new Map<string, string>();
  if (subscriptions.length > 0) {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      userId: subscriptions.map((s) => s.userId),
      limit: subscriptions.length,
    });
    for (const user of users) {
      const email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        "(no email)";
      emailByUserId.set(user.id, email);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Subscriptions
        </h1>
        <Link
          href="/admin"
          className="text-sm font-medium text-blue-600 dark:text-blue-400"
        >
          ← Admin
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No subscriptions yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">User Email</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Subscribed On</th>
                <th className="px-3 py-2 text-left font-medium">Renews / Ended</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {subscriptions.map((s) => (
                <tr key={s.userId} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">
                    {emailByUserId.get(s.userId) ?? s.userId}
                  </td>
                  <td className={`px-3 py-2 font-medium ${statusTone(s.status)}`}>
                    {s.status}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                    {formatDate(s.createdAt.slice(0, 10))}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                    {s.currentPeriodEnd ? formatDate(s.currentPeriodEnd.slice(0, 10)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
