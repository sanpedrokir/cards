export default function CardDetailLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="skeleton h-4 w-36" />

      <div className="surface space-y-4 p-5">
        <div className="flex gap-4">
          <div className="skeleton h-32 w-24 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      </div>

      <div className="surface space-y-3 p-5">
        <div className="skeleton h-4 w-40" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
