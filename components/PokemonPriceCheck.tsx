"use client";

import { useState, useTransition } from "react";
import { checkPokemonPrice, type PokemonPriceResult } from "@/lib/actions";
import { formatMoney } from "@/lib/format";

function variantLabel(variant?: string): string {
  if (!variant) return "";
  return variant
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function PokemonResults({ result }: { result: PokemonPriceResult | null }) {
  if (!result) return null;
  return (
    <>
      {result.error && (
        <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{result.error}</p>
      )}

      {result.info && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{result.info}</p>
      )}

      {result.matches.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {result.matches.map((m) => {
            const row = (
              <>
                {m.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt="" className="h-12 w-9 shrink-0 rounded" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-slate-700 dark:text-slate-200">
                    {m.name} · {m.number}
                  </span>
                  <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
                    {m.setName}
                    {m.variant ? ` · ${variantLabel(m.variant)}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-medium text-slate-900 dark:text-white">
                    {m.marketUsd !== undefined
                      ? formatMoney(m.marketUsd, "USD").replace(/^\$/, "US$")
                      : "—"}
                  </span>
                  {m.trendEur !== undefined && (
                    <span className="block text-xs text-slate-400 dark:text-slate-500">
                      {formatMoney(m.trendEur, "EUR")}
                    </span>
                  )}
                </span>
              </>
            );
            const cls =
              "flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5";
            return (
              <li key={m.id}>
                {m.tcgplayerUrl ? (
                  <a href={m.tcgplayerUrl} target="_blank" rel="noreferrer" className={cls}>
                    {row}
                  </a>
                ) : (
                  <div className={cls}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function PokemonPriceCheck({ cardId }: { cardId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PokemonPriceResult | null>(null);

  function handleCheck() {
    startTransition(async () => {
      setResult(await checkPokemonPrice(cardId));
    });
  }

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Pokémon Market Price
        </h2>
        <button type="button" onClick={handleCheck} disabled={isPending} className="btn-chip">
          {isPending ? "Checking…" : "Check Pokémon Price"}
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        Pokémon cards only. Market prices from TCGplayer (US$) and Cardmarket (€). Guideline
        only, for ungraded cards.
      </p>

      <PokemonResults result={result} />
    </div>
  );
}
