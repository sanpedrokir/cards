export default function AdminSubscriptionsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-4 w-16" />
      </div>
      <div className="skeleton h-16 w-full" />
      <div className="flex gap-1.5">
        <div className="skeleton h-6 w-12 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="surface space-y-3 p-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
