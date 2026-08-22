'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: 'sans-serif', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1>うまく読み込めませんでした</h1>
        <p>少し時間をおいて、もう一度お試しください。</p>
        <button onClick={reset} style={{ padding: '0.75rem 1.5rem', marginTop: '1rem' }}>
          もう一度試す
        </button>
      </body>
    </html>
  )
}
