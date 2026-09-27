import Link from "next/link";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdminUserId } from "@/lib/auth-helpers";
import { getAllSubscriptions } from "@/lib/store";
import { getStripe } from "@/lib/stripe";
import { formatDate, formatMoney } from "@/lib/format";

function statusTone(status: string) {
  if (status === "active" || status === "trialing") {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (status === "past_due") {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-zinc-500 dark:text-zinc-400";
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminUserId();
  const { status: statusFilter } = await searchParams;
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

  // Revenue is computed from live Stripe data (not a hardcoded price) since
  // the subscription price has changed over time.
  const revenueByCurrency: Record<string, number> = {};
  const active = subscriptions.filter(
    (s) => s.status === "active" && s.stripeSubscriptionId
  );
  if (active.length > 0) {
    const stripe = getStripe();
    const results = await Promise.all(
      active.map(async (s) => {
        try {
          return await stripe.subscriptions.retrieve(s.stripeSubscriptionId!);
        } catch {
          return null;
        }
      })
    );
    for (const sub of results) {
      const item = sub?.items.data[0];
      const price = item?.price;
      if (price?.unit_amount && price.currency) {
        const currency = price.currency.toUpperCase();
        revenueByCurrency[currency] =
          (revenueByCurrency[currency] ?? 0) + price.unit_amount / 100;
      }
    }
  }

  const statuses = Array.from(new Set(subscriptions.map((s) => s.status)));
  const activeFilter = statusFilter && statuses.includes(statusFilter) ? statusFilter : "all";
  const filtered =
    activeFilter === "all"
      ? subscriptions
      : subscriptions.filter((s) => s.status === activeFilter);

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

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Total monthly revenue ({active.length} active)
        </p>
        {Object.keys(revenueByCurrency).length === 0 ? (
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            —
          </p>
        ) : (
          <p className="mt-1 space-x-3 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {Object.entries(revenueByCurrency).map(([currency, amount]) => (
              <span key={currency}>{formatMoney(amount, currency)}</span>
            ))}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["all", ...statuses].map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/subscriptions" : `/admin/subscriptions?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              activeFilter === s
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {s === "all" ? "All" : s}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No subscriptions{activeFilter === "all" ? " yet" : ` with status "${activeFilter}"`}.
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
                <th className="px-3 py-2 text-left font-medium">Transaction #</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {filtered.map((s) => (
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
                  <td className="px-3 py-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {s.stripeSubscriptionId ?? "—"}
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
