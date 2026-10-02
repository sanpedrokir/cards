import Link from "next/link";
import { requirePageUserId } from "@/lib/auth-helpers";
import { getInvestment, getCardsPage } from "@/lib/store";
import CardTile from "@/components/CardTile";
import CardFilterBar from "@/components/CardFilterBar";

const PAGE_SIZE = 10;

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status = "all", q = "", page: pageParam } = await searchParams;
  const userId = await requirePageUserId();
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q.trim().toLowerCase();

  const [investment, { cards, totalCount }] = await Promise.all([
    getInvestment(userId),
    getCardsPage(userId, { status, query, page, pageSize: PAGE_SIZE }),
  ]);
  const currency = investment?.currency ?? "SGD";
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/cards?${qs}` : "/cards";
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Vaulted Cards</h1>
        <Link href="/cards/new" className="btn-primary-sm">
          <span className="text-base leading-none">+</span> Buy
        </Link>
      </div>

      <CardFilterBar defaultQuery={q} defaultStatus={status} />

      {cards.length === 0 ? (
        <p className="surface-dashed p-8">No cards found.</p>
      ) : (
        <>
          <div className="space-y-3">
            {cards.map((card) => (
              <CardTile key={card.id} card={card} currency={currency} />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between pt-2">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="rounded-full px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-400"
                >
                  ← Prev
                </Link>
              ) : (
                <span className="rounded-full px-3 py-1 text-sm font-medium text-slate-300 dark:text-slate-700">
                  ← Prev
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Page {page} of {pageCount}
              </span>
              {page < pageCount ? (
                <Link
                  href={pageHref(page + 1)}
                  className="rounded-full px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-400"
                >
                  Next →
                </Link>
              ) : (
                <span className="rounded-full px-3 py-1 text-sm font-medium text-slate-300 dark:text-slate-700">
                  Next →
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
