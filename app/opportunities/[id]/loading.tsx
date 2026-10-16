import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return <main className="min-h-screen bg-muted/35 px-5 py-12 lg:px-8 lg:py-16"><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_.85fr]"><Skeleton className="min-h-[25rem] rounded-2xl" /><div className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-sm"><Skeleton className="h-6 w-32" /><Skeleton className="h-12 w-3/4" /><Skeleton className="h-5 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-12 w-full rounded-xl" /></div></div></main>
}
