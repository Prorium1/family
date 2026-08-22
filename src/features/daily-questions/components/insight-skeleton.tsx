import { Skeleton } from '@/components/ui/skeleton'

export function InsightSkeleton() {
  return (
    <div
      className="space-y-3 rounded-card border border-border bg-surface p-5"
      role="status"
      aria-label="AIがメッセージを作成しています"
    >
      <p className="text-sm text-text-muted">AIがメッセージを作成しています…</p>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}
