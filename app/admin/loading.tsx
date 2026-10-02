export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="skeleton h-7 w-20" />
      <div className="surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-56" />
          </div>
          <div className="skeleton h-9 w-24 rounded-full" />
        </div>
      </div>
      <div className="skeleton h-16 w-full rounded-3xl" />
    </div>
  );
}
