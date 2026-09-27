export default function CheckoutSuccessBanner() {
  return (
    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
      <p className="font-semibold">You&apos;re subscribed! 🎉</p>
      <p className="mt-0.5">
        We&apos;ve emailed you a receipt — if you don&apos;t see it in your inbox within a
        few minutes, please check your <strong>spam/junk folder</strong>.
      </p>
    </div>
  );
}
