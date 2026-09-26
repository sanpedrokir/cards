import type { CardStatus } from "@/lib/types";

export default function StatusBadge({ status }: { status: CardStatus }) {
  const isSold = status === "sold";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isSold
          ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
      }`}
    >
      {isSold ? "Sold" : "Available"}
    </span>
  );
}
