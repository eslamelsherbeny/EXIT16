import type { LucideIcon } from 'lucide-react'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({ title = 'مفيش وحدات مطابقة لبحثك', actionLabel = 'امسح الفلاتر', onAction, icon: Icon = SearchX }: { title?: string; actionLabel?: string; onAction?: () => void; icon?: LucideIcon }) {
  return <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center shadow-sm"><span className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon aria-hidden="true" /></span><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">جرّب توسّع بحثك أو امسح الفلاتر عشان تشوف فرص أكتر.</p>{onAction && <Button type="button" className="mt-6 rounded-xl" onClick={onAction}>{actionLabel}</Button>}</div>
}
