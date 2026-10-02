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
    default: "text-slate-900 dark:text-white",
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-rose-600 dark:text-rose-400",
    accent: "text-amber-700 dark:text-amber-400",
  };

  const iconToneClasses: Record<string, string> = {
    default: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300",
    positive: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    negative: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    accent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  };

  return (
    <div className="surface flex items-center gap-3 p-3">
      {icon && (
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${iconToneClasses[tone]}`}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className={`text-lg font-semibold tabular-nums ${toneClasses[tone]}`}>
          {value}
        </p>
        {hint && (
          <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
        )}
      </div>
    </div>
  );
}
