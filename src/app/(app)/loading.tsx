import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="読み込み中">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  )
}
