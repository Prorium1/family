import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Shown in place of the AI message when someone has not agreed to AI
 * processing. It never says which of the two — that is their private
 * setting — and it never treats the choice as a problem: the reveal, the
 * conversation and 私たち all work exactly the same without it.
 */
export function InsightConsentOff() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-text">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          AIのメッセージはお休み中です
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-text-muted">
        <p>
          AIによる分析は、<strong className="text-text">二人ともが同意しているときだけ</strong>
          動きます。今回はどちらかが同意していないため、
          <strong className="text-text">回答はAIに送っていません</strong>。
        </p>
        <p>同時公開も、二人の記録も、これまで通りお使いいただけます。</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/privacy">プライバシー設定をひらく</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
