export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="surface flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-5 w-32" />
        </div>
        <div className="skeleton h-9 w-28 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="surface space-y-2 p-4">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-7 w-24" />
          </div>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-4 w-16" />
        </div>
        <div className="surface space-y-3 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
