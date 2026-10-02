export default function SalesLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="skeleton h-7 w-20" />
      <div className="surface space-y-4 p-5">
        <div className="skeleton h-10 w-full" />
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
