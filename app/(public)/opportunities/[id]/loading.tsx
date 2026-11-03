export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-6 text-[var(--brand-navy,#0a1122)] sm:py-10">
      <div className="mx-auto w-full max-w-[780px] animate-pulse px-4 sm:px-6">
        <div className="h-4 w-28 rounded-md bg-slate-200/90" />

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-2.5">
            <div className="h-8 w-64 rounded-xl bg-slate-200 sm:w-80" />
            <div className="h-4 w-44 rounded-md bg-slate-200/80" />
            <div className="h-6 w-24 rounded-md bg-slate-200/70" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-7 w-28 rounded-full bg-emerald-100/80" />
            <div className="h-8 w-20 rounded-lg bg-slate-200/80" />
            <div className="h-8 w-28 rounded-lg bg-slate-200/80" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          <div className="h-[250px] rounded-[20px] bg-slate-200/90 sm:col-span-8 sm:h-[360px]" />
          <div className="grid grid-cols-4 gap-2 sm:col-span-4 sm:h-[360px] sm:grid-cols-2 sm:grid-rows-2">
            <div className="h-16 rounded-[14px] bg-slate-200/80 sm:h-full" />
            <div className="h-16 rounded-[14px] bg-slate-200/80 sm:h-full" />
            <div className="h-16 rounded-[14px] bg-slate-200/80 sm:h-full" />
            <div className="h-16 rounded-[14px] bg-slate-200/80 sm:h-full" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-gray-200/80 bg-white px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="h-4 w-24 rounded bg-slate-200" />
          </div>
          <div className="h-6 w-24 rounded-lg bg-slate-200" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className="flex h-24 flex-col justify-between rounded-[18px] border border-gray-200/80 bg-white p-4 shadow-2xs"
            >
              <div className="size-4 rounded bg-blue-100" />
              <div className="space-y-1.5">
                <div className="h-4 w-20 rounded bg-slate-200" />
                <div className="h-3 w-14 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3 rounded-[20px] border border-gray-200/80 bg-white p-6 shadow-2xs">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="h-3.5 w-full rounded bg-slate-100" />
          <div className="h-3.5 w-4/5 rounded bg-slate-100" />
        </div>
      </div>
    </main>
  )
}