export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="h-7 w-32 rounded bg-zinc-200" />
        <div className="mt-2 h-4 w-48 rounded bg-zinc-100" />
        <div className="mt-4 flex gap-2">
          <div className="h-10 flex-1 max-w-xs rounded-xl bg-zinc-100" />
          <div className="h-10 w-16 rounded-xl bg-zinc-200" />
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-4">
          <div className="h-4 w-28 rounded bg-zinc-200" />
        </div>
        <div className="space-y-1 p-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-4">
              <div className="space-y-2">
                <div className="h-4 w-64 rounded bg-zinc-100" />
                <div className="h-3 w-32 rounded bg-zinc-100" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-20 rounded-xl bg-zinc-100" />
                <div className="h-9 w-16 rounded-xl bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
