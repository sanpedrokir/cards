"use client";

import Link from "next/link";
import { useTransition } from "react";
import { setActiveCollectionAction } from "@/lib/actions";
import type { Collection } from "@/lib/types";

// Static class strings so Tailwind picks every gradient up at build time.
const AVATAR_GRADIENTS = [
  "from-emerald-400 to-teal-600",
  "from-sky-400 to-blue-600",
  "from-violet-400 to-indigo-600",
  "from-pink-400 to-rose-600",
  "from-amber-300 to-orange-500",
  "from-cyan-300 to-sky-500",
];

function initialOf(name: string): string {
  return (Array.from(name.trim())[0] ?? "?").toUpperCase();
}

export default function CollectionSwitcher({
  collections,
  activeId,
}: {
  collections: Collection[];
  activeId: string;
}) {
  const [isSwitching, startSwitching] = useTransition();

  return (
    <div
      className={`no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 py-2 transition-opacity ${
        isSwitching ? "opacity-60" : ""
      }`}
      role="tablist"
      aria-label="Collections"
    >
      {collections.map((c, i) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={isSwitching}
            onClick={() => {
              if (active) return;
              startSwitching(async () => {
                await setActiveCollectionAction(c.id);
              });
            }}
            className="flex w-[5rem] shrink-0 flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold text-white shadow-lg ring-2 ring-offset-2 ring-offset-[#060d13] transition-all ${
                AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]
              } ${
                active
                  ? "scale-105 shadow-emerald-400/20 ring-emerald-300"
                  : "opacity-60 ring-transparent"
              }`}
            >
              {initialOf(c.name)}
            </span>
            <span
              className={`w-full truncate text-center text-xs ${
                active ? "font-semibold text-white" : "text-slate-400"
              }`}
            >
              {c.name}
            </span>
          </button>
        );
      })}

      {/* A plain text link (not a "+" circle, which reads as "add"): the
          Collections page is where adding, renaming and deleting all live. */}
      <Link
        href="/collections"
        className="mt-3.5 inline-flex h-8 shrink-0 items-center gap-1.5 self-start whitespace-nowrap rounded-full border border-white/15 px-3 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            d="M4 7h10M18 7h2M4 17h2M10 17h10"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle cx="16" cy="7" r="2.2" stroke="currentColor" strokeWidth={1.8} />
          <circle cx="8" cy="17" r="2.2" stroke="currentColor" strokeWidth={1.8} />
        </svg>
        Manage collections
      </Link>
    </div>
  );
}
