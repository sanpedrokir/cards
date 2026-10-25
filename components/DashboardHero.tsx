import { formatMoney } from "@/lib/format";
import type { Totals } from "@/lib/types";

const PILL = "min-w-[8.5rem] flex-1 rounded-2xl bg-white/[0.07] px-3 py-2";

function Pill({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className={PILL}>
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-300/80">
        {label}
      </p>
      <p className={`break-words text-sm font-bold tabular-nums ${valueClassName}`}>{value}</p>
    </div>
  );
}

export default function DashboardHero({
  name,
  totals,
  currency,
  worthPill,
  currencyPill,
}: {
  name: string;
  totals: Totals;
  currency: string;
  // Interactive (runs the eBay refresh), so the page supplies it.
  worthPill: React.ReactNode;
  // Interactive (switches the collection's currency), so the page supplies it.
  currencyPill: React.ReactNode;
}) {
  const positive = totals.totalProfit >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f4a52] via-[#0c2c3b] to-[#0a1722] p-5 shadow-xl shadow-black/30">
      {/* Artwork (public/dashboard-bg.svg: starry sky, card fan, coins), kept to
          a small top-right corner so it never sits behind the figures. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 hidden h-24 w-52 opacity-80 sm:block"
        style={{
          backgroundImage: "url(/dashboard-bg.svg)",
          backgroundSize: "contain",
          backgroundPosition: "right top",
          backgroundRepeat: "no-repeat",
          // Feather the edges so the artwork melts into the card.
          maskImage: "radial-gradient(ellipse at 60% 50%, #000 45%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at 60% 50%, #000 45%, transparent 78%)",
        }}
      />

      <div className="relative">
        <p className="truncate text-xs font-semibold uppercase tracking-wider text-emerald-200/80">
          {name} · Total profit
        </p>
        <p
          className={`mt-1 text-4xl font-extrabold tabular-nums tracking-tight [text-shadow:0_2px_12px_rgba(0,0,0,0.45)] ${
            positive ? "text-white" : "text-rose-300"
          }`}
        >
          {positive ? "" : "−"}
          {formatMoney(Math.abs(totals.totalProfit), currency)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Pill label="Total Sales" value={formatMoney(totals.totalSales, currency)} />
          <Pill label="Cost paid" value={formatMoney(totals.inventoryCost, currency)} />
          <div className={PILL}>{worthPill}</div>
          <div className={PILL}>{currencyPill}</div>
        </div>
      </div>
    </div>
  );
}
