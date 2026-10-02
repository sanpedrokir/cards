export default function SummaryCard({
  label,
  value,
  tone = "default",
  hint,
  icon,
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative" | "accent";
  hint?: string;
  icon?: React.ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    default: "text-stone-800 dark:text-white",
    positive: "text-emerald-500 dark:text-emerald-400",
    negative: "text-rose-500 dark:text-rose-400",
    accent: "text-amber-500 dark:text-amber-400",
  };

  const iconToneClasses: Record<string, string> = {
    default: "bg-stone-100 text-stone-500 dark:bg-white/10 dark:text-slate-300",
    positive: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    negative: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    accent: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  };

  return (
    <div className="surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${iconToneClasses[tone]}`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${toneClasses[tone]}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}
