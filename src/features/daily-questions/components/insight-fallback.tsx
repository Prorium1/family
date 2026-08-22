import { conversationGuide } from '@/content/conversation-guide'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { regenerateInsightAction } from '@/server/actions/daily-actions'

/**
 * AI failure state (spec §30): answers stay readable, a static conversation
 * guide keeps the dialogue going, and regeneration is one tap away.
 */
export function InsightFallback({ assignmentId }: { assignmentId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AIからのメッセージを作成できませんでした</CardTitle>
        <CardDescription>
          二人の回答はそのまま読めます。少し時間をおいて再生成できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold">{conversationGuide.title}</h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-text-muted">
            {conversationGuide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-text-muted">{conversationGuide.reminder}</p>
        </div>
        <form action={regenerateInsightAction}>
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <Button type="submit" variant="outline">
            メッセージを再生成する
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
