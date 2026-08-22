import { requireCoupleSession } from '@/lib/auth/session'
import { countByKind, listWeEntries } from '@/server/services/we-service'
import { removeWeEntryAction } from '@/server/actions/we-actions'
import { WE_KIND_LABELS, WE_KIND_ORDER } from '@/lib/ui/we'
import { PageTitle } from '@/components/shared/page-title'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: '私たち' }

/**
 * NEW WE (docs/BRAND.md §0.2): what the two of them built, in place of a
 * compatibility score. Nothing here was written by the AI on its own — every
 * entry was saved by one of them, and either can remove it.
 */
export default async function WePage() {
  const session = await requireCoupleSession()
  const entries = await listWeEntries(session.coupleId, session.userId)
  const counts = countByKind(entries)

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageTitle
        title="私たち"
        subtitle="違いから二人でつくったものが、ここに積み重なります。"
      />

      <div className="bg-wash rounded-card px-5 py-4 text-sm">
        <p className="text-blend text-base font-bold">YOU + ME → WE</p>
        <p className="mt-1 text-text-muted">
          点数はつけません。増えていくのは「私たちとは何か」です。
        </p>
      </div>

      <dl className="grid grid-cols-4 gap-2">
        {WE_KIND_ORDER.map((kind) => (
          <div
            key={kind}
            className="rounded-card border border-border bg-surface px-2 py-3 text-center"
          >
            <dd className="text-xl font-bold text-primary">{counts[kind]}</dd>
            <dt className="mt-0.5 text-xs text-text-muted">{WE_KIND_LABELS[kind].label}</dt>
          </div>
        ))}
      </dl>

      {entries.length === 0 ? (
        <EmptyState
          title="まだ何もありません"
          body="今日の質問に二人が答えると、AIが「二人だけの答え」の下書きを出します。受け取って、直して、ここに残していきましょう。"
        />
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-snug">{entry.title}</CardTitle>
                    <Badge variant="together" className="shrink-0 whitespace-nowrap">
                      {WE_KIND_LABELS[entry.kind].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {entry.body ? (
                    <p className="text-sm leading-relaxed whitespace-pre-line">{entry.body}</p>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-muted">
                      {new Intl.DateTimeFormat('ja-JP', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                      }).format(new Date(entry.createdAt))}
                    </p>
                    <form action={removeWeEntryAction}>
                      <input type="hidden" name="id" value={entry.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        削除する
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
