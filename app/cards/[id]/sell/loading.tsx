export default function SellCardLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="skeleton h-4 w-16" />
      <div className="skeleton h-7 w-40" />

      <div className="surface space-y-3 p-5">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-9 w-full rounded-full" />
      </div>

      <div className="surface space-y-4 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
