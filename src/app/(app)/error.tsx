'use client'

import { Button } from '@/components/ui/button'

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h2 className="text-lg font-semibold">うまく読み込めませんでした</h2>
      <p className="text-sm text-text-muted">少し時間をおいて、もう一度お試しください。</p>
      <Button onClick={reset} variant="outline">
        もう一度試す
      </Button>
    </div>
  )
}
