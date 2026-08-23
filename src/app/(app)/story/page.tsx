import Link from 'next/link'
import { requireCoupleSession } from '@/lib/auth/session'
import { getStory } from '@/server/services/story-service'
import { countByKind, listWeEntries } from '@/server/services/we-service'
import { WE_KIND_LABELS, WE_KIND_ORDER } from '@/lib/ui/we'
import { PageTitle } from '@/components/shared/page-title'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { BookHeart, NotebookPen, HeartPulse, Sparkles } from 'lucide-react'

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
            <Sparkles className="text-primary size-4" aria-hidden="true" />
            私たち
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-muted text-sm">
            {weEntries.length === 0
              ? '違いから二人でつくったものが、ここに積み重なっていきます。'
              : `二人でつくったもの: ${weEntries.length}件`}
          </p>
          {weEntries.length > 0 ? (
            <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
              {WE_KIND_ORDER.map((kind) => (
                <div key={kind} className="rounded-card-sm bg-together-soft px-1 py-2">
                  <dd className="text-primary text-base font-bold">{weCounts[kind]}</dd>
                  <dt className="text-primary text-[11px]">{WE_KIND_LABELS[kind].label}</dt>
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
            <p className="text-text-muted text-xs">アプリで一緒に過ごした日数</p>
            <p className="mt-1 text-4xl font-bold">
              {story.couple.daysTogether + 1}
              <span className="ml-1 text-base font-normal">日目</span>
            </p>
          </CardContent>
        </Card>
      ) : null}

      <dl className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-card border-border bg-surface border p-4 text-center"
          >
            <dd className="text-primary text-2xl font-bold">{stat.value}</dd>
            <dt className="text-text-muted mt-0.5 text-xs">{stat.label}</dt>
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
                  className="bg-together-soft text-primary rounded-full px-3 py-1 text-xs"
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
          <ol className="border-border relative space-y-4 border-l pl-5">
            {story.timeline.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className="bg-primary absolute top-1.5 -left-[23px] size-2.5 rounded-full"
                  aria-hidden="true"
                />
                <p className="text-text-muted text-xs">{event.date}</p>
                <p className="text-sm font-medium">{event.title}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <NotebookPen className="text-primary size-4" aria-hidden="true" />
              ふたりのメモ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-muted text-sm">
              買いものメモ、旅行の計画、もしものときの控え。本文は暗号化され、読めるのは二人だけ。
            </p>
            <Button asChild variant="soft" size="sm" className="mt-3">
              <Link href="/notes">ひらく</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="text-primary size-4" aria-hidden="true" />
              からだの周期
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-muted text-sm">
              記録も共有も、本人だけが決められます。共有をオンにするまで相手には何も見えません。
            </p>
            <Button asChild variant="soft" size="sm" className="mt-3">
              <Link href="/cycle">ひらく</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookHeart className="text-primary size-4" aria-hidden="true" />
            ふたりの取扱説明書
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-muted text-sm">
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
