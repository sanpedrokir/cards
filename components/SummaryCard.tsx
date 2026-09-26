export default function SummaryCard({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative" | "accent";
  hint?: string;
}) {
  const toneClasses: Record<string, string> = {
    default: "text-zinc-900 dark:text-zinc-50",
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-red-600 dark:text-red-400",
    accent: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClasses[tone]}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>
      )}
    </div>
  );
}
