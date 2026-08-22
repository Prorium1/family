import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

export const metadata = { title: '料金' }

const freeFeatures = [
  '1日1問の質問と同時公開',
  '基本のJourney',
  'Weekly Check-in',
  '基本のAIメッセージ',
  '二人の記録（ふたりページ）',
]

const premiumFeatures = [
  'すべてのJourney',
  'AIによる詳細な分析',
  '整えるモード（Repair）の全機能',
  'ふたりの取扱説明書',
  '月次レポート',
  '高度な未来設計・カスタム質問・記念日機能',
]

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-center text-2xl font-bold">料金</h1>
      <p className="mt-2 text-center text-sm text-text-muted">
        プレミアムは一人ずつではなく、一組のカップル単位のプランです。
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>ずっと無料</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link href="/signup">無料ではじめる</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle>Couple Premium</CardTitle>
            <CardDescription>一組のカップルにつき、ひとつのプラン</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {premiumFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-5 w-full">
              <Link href="/signup">まず無料ではじめる</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <p className="mt-6 text-center text-xs text-text-muted">
        データのエクスポート・削除、ペア解除、プライバシー設定、安全機能が有料になることはありません。
      </p>
    </div>
  )
}
