import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return <main className="min-h-screen bg-muted/35 px-5 py-12 lg:px-8 lg:py-16"><div className="mx-auto max-w-7xl"><Skeleton className="h-5 w-40" /><Skeleton className="mt-4 h-12 w-80" /><Skeleton className="mt-3 h-5 w-[28rem] max-w-full" /><div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl bg-card shadow-sm"><Skeleton className="h-52 w-full rounded-none" /><div className="flex flex-col gap-4 p-5"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-56" /><Skeleton className="h-20 w-full" /><div className="flex gap-2"><Skeleton className="h-8 w-24 rounded-full" /><Skeleton className="h-8 w-20 rounded-full" /></div></div></div>)}</div></div></main>
}
