"use client";

import Link from "next/link";
import { useTransition } from "react";
import { setActiveCollectionAction } from "@/lib/actions";
import type { Collection } from "@/lib/types";

export default function CollectionSwitcher({
  collections,
  activeId,
}: {
  collections: Collection[];
  activeId: string;
}) {
  const [isSwitching, startSwitching] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <label htmlFor="collection-switcher" className="text-slate-500 dark:text-slate-400">
        Collection:
      </label>
      <select
        id="collection-switcher"
        value={activeId}
        disabled={isSwitching}
        onChange={(e) => {
          const id = e.target.value;
          startSwitching(async () => {
            await setActiveCollectionAction(id);
          });
        }}
        className="min-w-0 max-w-[14rem] rounded-xl border-2 border-stone-200 px-2 py-1 text-sm font-medium disabled:opacity-60 dark:border-white/10 dark:bg-slate-900"
      >
        {collections.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Link href="/collections" className="link-muted">
        Manage
      </Link>
    </div>
  );
}
