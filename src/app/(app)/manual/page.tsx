import { requireCoupleSession } from '@/lib/auth/session'
import { listManualItems } from '@/server/services/manual-service'
import {
  confirmManualItemAction,
  deleteManualItemAction,
} from '@/server/actions/manual-actions'
import { PageTitle } from '@/components/shared/page-title'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'ふたりの取扱説明書' }

const sourceLabels: Record<string, { label: string; variant: 'success' | 'together' | 'warning' | 'default' }> = {
  user_stated: { label: '本人が回答', variant: 'success' },
  shared_agreement: { label: '二人の合意', variant: 'together' },
  ai_inference: { label: 'AIの推測', variant: 'warning' },
  needs_confirmation: { label: '確認待ち', variant: 'default' },
}

/**
 * ふたりの取扱説明書 (spec §15): the visible AI memory. Every item is
 * labeled by provenance, and users can confirm or delete anything.
 */
export default async function ManualPage() {
  const session = await requireCoupleSession()
  const items = await listManualItems(session.coupleId, session.userId)
  const grouped = new Map<string, typeof items>()
  for (const item of items) {
    const list = grouped.get(item.category) ?? []
    list.push(item)
    grouped.set(item.category, list)
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle
        title="ふたりの取扱説明書"
        subtitle="アプリでの対話から、AIと二人で育てる説明書"
      />
      <p className="mb-5 rounded-card-sm bg-surface-muted px-4 py-3 text-xs text-text-muted">
        AIの推測は、あなたが確認するまで確定情報として扱われません。項目はいつでも削除できます。
      </p>

      {items.length === 0 ? (
        <EmptyState
          title="まだ項目がありません"
          body="毎日の質問に答えると、少しずつ育っていきます。"
        />
      ) : (
        <div className="space-y-5">
          {[...grouped.entries()].map(([category, categoryItems]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {categoryItems.map((item) => {
                    const source = sourceLabels[item.sourceType] ?? sourceLabels.needs_confirmation
                    return (
                      <li key={item.id} className="rounded-card-sm border border-border p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={source.variant}>{source.label}</Badge>
                          <span className="text-xs text-text-muted">{item.subjectName}さん</span>
                        </div>
                        <p className="mt-2 text-sm">{item.statement}</p>
                        <div className="mt-2 flex gap-2">
                          {!item.confirmedByMe ? (
                            <form action={confirmManualItemAction}>
                              <input type="hidden" name="itemId" value={item.id} />
                              <Button type="submit" variant="soft" size="sm">
                                合っています
                              </Button>
                            </form>
                          ) : null}
                          <form action={deleteManualItemAction}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              削除する
                            </Button>
                          </form>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
