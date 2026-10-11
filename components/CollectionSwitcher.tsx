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
      className={`no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-2 transition-opacity sm:-mx-2 sm:px-2 ${
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

      <Link
        href="/collections"
        className="flex w-[5rem] shrink-0 flex-col items-center gap-1.5"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/25 text-2xl text-slate-300 ring-2 ring-transparent ring-offset-2 ring-offset-[#060d13]">
          +
        </span>
        <span className="w-full truncate text-center text-xs text-slate-400">Manage</span>
      </Link>
    </div>
  );
}
