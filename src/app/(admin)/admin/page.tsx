import { allQuestions, questionPacks } from '@/content/questions'
import { journeys } from '@/content/journeys'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata = { title: '管理画面' }

export default function AdminPage() {
  const stats = [
    { label: '質問', value: allQuestions.length },
    { label: '質問パック', value: questionPacks.length },
    { label: 'Journey', value: journeys.length },
  ]
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>プライバシー設計</CardTitle>
          <CardDescription>
            管理者はユーザーの親密な回答原文を閲覧できません。この画面はコンテンツ管理と運用メタデータのみを扱います。
          </CardDescription>
        </CardHeader>
      </Card>
      <dl className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card border border-border bg-surface p-4 text-center">
            <dd className="text-2xl font-bold">{s.value}</dd>
            <dt className="text-xs text-text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  )
}
