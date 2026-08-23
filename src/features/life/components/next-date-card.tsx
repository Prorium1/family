import Link from 'next/link'
import type { CoupleDateView } from '@/server/services/dates-service'
import { DATE_KIND_LABELS } from '@/lib/ui/couple-life'
import { Badge } from '@/components/ui/badge'
import { CalendarHeart } from 'lucide-react'

/** The single closest date, as one glanceable line on the home screen. */
export function NextDateCard({ next }: { next: CoupleDateView }) {
  return (
    <Link
      href="/dates"
      className="rounded-card border-border bg-surface shadow-card hover:bg-surface-muted flex items-center justify-between gap-3 border p-4"
    >
      <span className="flex min-w-0 items-center gap-3">
        <CalendarHeart className="text-primary size-5 shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{DATE_KIND_LABELS[next.kind]}</Badge>
            <span className="truncate text-sm font-semibold">{next.title}</span>
          </span>
        </span>
      </span>
      <span className="text-text-muted shrink-0 text-sm">
        {next.daysUntil === 0 ? (
          <span className="text-primary font-bold">今日</span>
        ) : (
          <>
            あと
            <span className="text-primary mx-0.5 text-lg font-bold tabular-nums">
              {next.daysUntil}
            </span>
            日
          </>
        )}
      </span>
    </Link>
  )
}
