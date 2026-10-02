import type { CardStatus } from "@/lib/types";

export default function StatusBadge({ status }: { status: CardStatus }) {
  const isSold = status === "sold";
  return (
    <span className={isSold ? "badge-sold" : "badge-available"}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${isSold ? "bg-slate-400" : "bg-emerald-500"}`}
      />
      {isSold ? "Sold" : "Available"}
    </span>
  );
}
