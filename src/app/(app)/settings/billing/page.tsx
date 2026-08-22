import { planEntitlements, planLabels } from '@/config/plans'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'プラン' }

const entitlementLabels: Record<string, string> = {
  daily_question: '1日1問',
  basic_journeys: '基本Journey',
  all_journeys: 'すべてのJourney',
  weekly_checkin: 'Weekly Check-in',
  basic_insight: '基本のAIメッセージ',
  detailed_insight: 'AI詳細分析',
  repair_mode: '整えるモード',
  relationship_manual: 'ふたりの取扱説明書',
  monthly_report: '月次レポート',
  advanced_future_planning: '高度な未来設計',
  custom_questions: 'カスタム質問',
  anniversaries: '記念日機能',
  couple_record: '二人の記録',
}

export default function BillingSettingsPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            現在のプラン <Badge variant="together">{planLabels.free}</Badge>
          </CardTitle>
          <CardDescription>
            プレミアムは一人ずつではなく、一組のカップル単位のプランです。決済機能は準備中です。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <ul className="list-disc space-y-1 pl-5 text-text-muted">
            {planEntitlements.free.map((e) => (
              <li key={e}>{entitlementLabels[e] ?? e}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <p className="text-xs text-text-muted">
        データのエクスポート・削除、ペア解除、プライバシー設定、安全機能が有料になることはありません。
      </p>
    </div>
  )
}
