import type { ReactNode } from 'react'

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-card border border-dashed border-border bg-surface-muted/50 px-6 py-10 text-center">
      <p className="font-medium text-text">{title}</p>
      {body ? <p className="mt-1.5 text-sm text-text-muted">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
