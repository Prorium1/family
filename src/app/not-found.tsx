import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">ページが見つかりませんでした</h1>
      <p className="text-sm text-text-muted">URLが変わったか、アクセスできない内容の可能性があります。</p>
      <Button asChild variant="outline">
        <Link href="/home">ホームへ戻る</Link>
      </Button>
    </div>
  )
}
