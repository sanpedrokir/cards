export default function CardsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-9 w-28 rounded-full" />
      </div>

      <div className="space-y-3">
        <div className="skeleton h-10 w-full" />
        <div className="flex gap-2">
          <div className="skeleton h-7 w-16 rounded-full" />
          <div className="skeleton h-7 w-20 rounded-full" />
          <div className="skeleton h-7 w-16 rounded-full" />
        </div>
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="surface flex gap-3 p-3">
            <div className="skeleton h-20 w-16 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
