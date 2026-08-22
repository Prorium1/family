export const metadata = { title: 'オフライン' }

/** Static offline fallback (spec §21) — precached by the service worker. */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-4xl" aria-hidden="true">
        ☁️
      </p>
      <h1 className="text-lg font-bold">オフラインのようです</h1>
      <p className="max-w-xs text-sm leading-relaxed text-text-muted">
        インターネットに接続すると、二人の記録の続きが見られます。この時間は、隣の人との会話にどうぞ。
      </p>
    </div>
  )
}
