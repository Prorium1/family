export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-text-muted">{subtitle}</p> : null}
    </div>
  )
}
