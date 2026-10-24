import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePageUserId } from "@/lib/auth-helpers";
import { getInvestment, getCardsPage } from "@/lib/store";
import { withActiveCollection } from "@/lib/collections";
import CollectionSwitcher from "@/components/CollectionSwitcher";
import CardTile from "@/components/CardTile";
import CardFilterBar from "@/components/CardFilterBar";

const PAGE_SIZE = 12;

// 1 2 3 … 9 10 style page list: always first, last and the current page's neighbours.
function pageNumbers(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => keep.add(n));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => keep.add(n));
  const nums = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status = "all", q = "", page: pageParam } = await searchParams;
  const userId = await requirePageUserId();
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q.trim().toLowerCase();

  const {
    collections,
    active,
    data: [investment, { cards, totalCount }],
  } = await withActiveCollection(userId, (id) =>
    Promise.all([
      getInvestment(userId, id),
      getCardsPage(userId, id, { status, query, page, pageSize: PAGE_SIZE }),
    ])
  );
  const currency = investment?.currency ?? "SGD";
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  // A stale link to a page that no longer exists (e.g. after deleting cards)
  // would otherwise show an empty list with "Showing 25–24".
  if (page > pageCount && totalCount > 0) {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    if (pageCount > 1) params.set("page", String(pageCount));
    const qs = params.toString();
    redirect(qs ? `/cards?${qs}` : "/cards");
  }
  const firstShown = (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(totalCount, firstShown + cards.length - 1);

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
      <CollectionSwitcher collections={collections} activeId={active.id} />
      <div className="flex items-center justify-between">
        <h1 className="page-title">Vaulted Cards</h1>
        <Link href="/cards/new" className="btn-primary-sm">
          <span className="text-base leading-none">+</span> Add Card
        </Link>
      </div>

      <CardFilterBar defaultQuery={q} defaultStatus={status} />

      {cards.length === 0 ? (
        <p className="surface-dashed p-8">No cards found.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 sm:gap-x-3 md:grid-cols-5 lg:grid-cols-6">
            {cards.map((card) => (
              <CardTile key={card.id} card={card} currency={currency} />
            ))}
          </div>

          <nav aria-label="Pagination" className="space-y-2 pt-2">
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Showing {firstShown}–{lastShown} of {totalCount}{" "}
              {totalCount === 1 ? "card" : "cards"}
            </p>
            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-1">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} prefetch={false} className="pager-btn" aria-label="Previous page">
                    ←
                  </Link>
                ) : (
                  <span className="pager-btn pager-btn-off" aria-hidden="true">←</span>
                )}
                {pageNumbers(page, pageCount).map((n, i) =>
                  n === "…" ? (
                    <span key={`gap-${i}`} className="px-1 text-sm text-slate-500">…</span>
                  ) : n === page ? (
                    <span key={n} aria-current="page" className="pager-btn pager-btn-active">
                      {n}
                    </span>
                  ) : (
                    <Link key={n} href={pageHref(n)} prefetch={false} className="pager-btn">
                      {n}
                    </Link>
                  )
                )}
                {page < pageCount ? (
                  <Link href={pageHref(page + 1)} prefetch={false} className="pager-btn" aria-label="Next page">
                    →
                  </Link>
                ) : (
                  <span className="pager-btn pager-btn-off" aria-hidden="true">→</span>
                )}
              </div>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
