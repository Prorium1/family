import Link from 'next/link'
import { requireCoupleSession } from '@/lib/auth/session'
import { getStory } from '@/server/services/story-service'
import { countByKind, listWeEntries } from '@/server/services/we-service'
import { WE_KIND_LABELS, WE_KIND_ORDER } from '@/lib/ui/we'
import { PageTitle } from '@/components/shared/page-title'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { BookHeart, Sparkles } from 'lucide-react'

export const metadata = { title: 'ふたり' }

const stageLabels: Record<string, string> = {
  dating: '恋人',
  long_distance: '遠距離',
  cohabiting: '同棲',
  considering_engagement: '婚約検討中',
  engaged: '婚約',
  married: '結婚',
  preparing_for_children: '妊娠・出産準備',
  parenting: '子育て',
  long_term_partners: '長期パートナー',
}

/** ふたりページ (spec §14): where the relationship accumulates. */
export default async function StoryPage() {
  const session = await requireCoupleSession()
  const story = await getStory(session.coupleId, session.userId)
  if (!story) return null
  const weEntries = await listWeEntries(session.coupleId, session.userId)
  const weCounts = countByKind(weEntries)

  const stats = [
    { label: '一緒に話せた日', value: story.stats.conversationsCompleted },
    { label: '伝えられた感謝', value: story.stats.gratitudeShared },
    { label: '二人で決めた約束', value: story.stats.agreementsMade },
    { label: '完了したJourney', value: story.stats.journeysCompleted },
  ]

  return (
    <div className="space-y-6">
      <PageTitle
        title="ふたり"
        subtitle={`${session.displayName} と ${story.couple.partner?.displayName ?? 'パートナー'} ・ ${stageLabels[story.couple.relationshipStage] ?? ''}`}
      />

      {/* NEW WE first: what the two of them built is the point of this page */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            私たち
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">
            {weEntries.length === 0
              ? '違いから二人でつくったものが、ここに積み重なっていきます。'
              : `二人でつくったもの: ${weEntries.length}件`}
          </p>
          {weEntries.length > 0 ? (
            <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
              {WE_KIND_ORDER.map((kind) => (
                <div key={kind} className="rounded-card-sm bg-together-soft px-1 py-2">
                  <dd className="text-base font-bold text-primary">{weCounts[kind]}</dd>
                  <dt className="text-[11px] text-primary">{WE_KIND_LABELS[kind].label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
          <Button asChild variant="soft" size="sm" className="mt-3">
            <Link href="/we">ひらく</Link>
          </Button>
        </CardContent>
      </Card>

      {story.couple.daysTogether !== null ? (
        <Card className="bg-wash">
          <CardContent className="py-6 text-center">
            <p className="text-xs text-text-muted">アプリで一緒に過ごした日数</p>
            <p className="mt-1 text-4xl font-bold">
              {story.couple.daysTogether + 1}
              <span className="ml-1 text-base font-normal">日目</span>
            </p>
          </CardContent>
        </Card>
      ) : null}

      <dl className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-card border border-border bg-surface p-4 text-center">
            <dd className="text-2xl font-bold text-primary">{stat.value}</dd>
            <dt className="mt-0.5 text-xs text-text-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>

      {story.sharedValues.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>二人の言葉から</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {story.sharedValues.map((value) => (
                <li
                  key={value}
                  className="rounded-full bg-together-soft px-3 py-1 text-xs text-primary"
                >
                  {value}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {story.recentGratitude.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>最近の感謝</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {story.recentGratitude.map((text) => (
                <li key={text} className="rounded-card-sm bg-surface-muted px-3 py-2">
                  {text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <section>
        <h2 className="mb-3 text-base font-semibold">二人のあゆみ</h2>
        {story.timeline.length === 0 ? (
          <EmptyState title="これから、ここに二人のあゆみが刻まれていきます" />
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-5">
            {story.timeline.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className="absolute top-1.5 -left-[23px] size-2.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <p className="text-xs text-text-muted">{event.date}</p>
                <p className="text-sm font-medium">{event.title}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookHeart className="size-4 text-primary" aria-hidden="true" />
            ふたりの取扱説明書
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">
            アプリでの対話から、AIと二人で育てる説明書。AIの推測は、確認するまで確定になりません。
          </p>
          <Button asChild variant="soft" size="sm" className="mt-3">
            <Link href="/manual">ひらく</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
