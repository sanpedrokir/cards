import { formatMoney } from "@/lib/format";
import type { Totals } from "@/lib/types";

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[6.5rem] flex-1 rounded-2xl bg-white/[0.07] px-3 py-2 backdrop-blur-sm">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-300/80">
        {label}
      </p>
      <p className="break-words text-sm font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

export default function DashboardHero({
  name,
  totals,
  currency,
  hasBudget,
}: {
  name: string;
  totals: Totals;
  currency: string;
  hasBudget: boolean;
}) {
  const positive = totals.totalProfit >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f4a52] via-[#0c2c3b] to-[#0a1722] p-5 shadow-xl shadow-black/30">
      <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-emerald-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-sky-400/25 blur-3xl" />

      <div className="relative">
        <p className="truncate text-xs font-semibold uppercase tracking-wider text-emerald-200/80">
          {name} · Total profit
        </p>
        <p
          className={`mt-1 text-4xl font-extrabold tabular-nums tracking-tight ${
            positive ? "text-white" : "text-rose-300"
          }`}
        >
          {positive ? "" : "−"}
          {formatMoney(Math.abs(totals.totalProfit), currency)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <MiniStat label="Sales" value={formatMoney(totals.totalSales, currency)} />
          <MiniStat label="Inventory" value={formatMoney(totals.inventoryCost, currency)} />
          {hasBudget ? (
            <MiniStat label="Funds" value={formatMoney(totals.totalFunds, currency)} />
          ) : (
            <MiniStat label="Cost" value={formatMoney(totals.purchaseCost, currency)} />
          )}
        </div>
      </div>
    </div>
  );
}
