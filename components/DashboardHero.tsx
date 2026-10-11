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
  hasBudget,
  fundPill,
}: {
  name: string;
  totals: Totals;
  currency: string;
  // Funds / available balance only mean something once a budget is set.
  hasBudget: boolean;
  // The budget pill is interactive (edit amount / currency), so the page
  // supplies it; everything else here is plain display.
  fundPill: React.ReactNode;
}) {
  const positive = totals.totalProfit >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f4a52] via-[#0c2c3b] to-[#0a1722] p-5 shadow-xl shadow-black/30">
      {/* Artwork (public/dashboard-bg.svg: starry sky, card fan, coins). Toned
          down on phones, where the figures sit right on top of it. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50 sm:opacity-100"
        style={{
          backgroundImage: "url(/dashboard-bg.svg)",
          backgroundSize: "cover",
          backgroundPosition: "right center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Soft dark fade on the left so the text stays easy to read. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(8,18,26,0.65) 0%, rgba(8,18,26,0.2) 55%, rgba(8,18,26,0) 72%)",
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
          <div className={PILL}>{fundPill}</div>
          <Pill label="Total Sales" value={formatMoney(totals.totalSales, currency)} />
          {hasBudget && (
            <>
              {/* Budget plus realised profit: unchanged by buying a card (the card is still worth what was paid), moves only when a sale makes or loses money. */}
              <Pill
                label="Total Funds + Profit"
                value={formatMoney(totals.investedAmount + totals.totalProfit, currency)}
              />
              <Pill
                label="Available to Purchase"
                value={formatMoney(totals.availableBalance, currency)}
                valueClassName={
                  totals.availableBalance >= 0 ? "text-emerald-300" : "text-rose-300"
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
