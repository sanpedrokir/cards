import Link from "next/link";
import { requireAdminUserId } from "@/lib/auth-helpers";
import { getAccountDeletions } from "@/lib/store";
import { formatDate } from "@/lib/format";

export default async function AdminDeletionsPage() {
  await requireAdminUserId();
  const deletions = await getAccountDeletions();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Deleted accounts</h1>
        <Link href="/admin" className="link-muted">
          ← Admin
        </Link>
      </div>

      {deletions.length === 0 ? (
        <p className="surface-dashed p-6">No accounts deleted yet.</p>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">User Email</th>
                <th className="px-3 py-2 text-left font-medium">Deleted On</th>
                <th className="px-3 py-2 text-left font-medium">Cards</th>
                <th className="px-3 py-2 text-left font-medium">Subscriber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {deletions.map((d) => (
                <tr key={d.userId}>
                  <td className="px-3 py-2 text-slate-900 dark:text-white">
                    {d.email ?? "(no email)"}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                    {formatDate(d.deletedAt.slice(0, 10))}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-600 dark:text-slate-400">
                    {d.cardCount}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                    {d.hadSubscription ? "Yes" : "No"}
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
