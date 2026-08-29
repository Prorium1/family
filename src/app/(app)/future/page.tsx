import Link from 'next/link'
import { requireCoupleSession } from '@/lib/auth/session'
import { listAgreements } from '@/server/services/agreement-service'
import { getDatesView } from '@/server/services/dates-service'
import { PageTitle } from '@/components/shared/page-title'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarHeart, Gem, Coins, Baby, Briefcase, Star } from 'lucide-react'

export const metadata = { title: '未来' }

const categories = [
  {
    key: 'marriage',
    icon: Gem,
    title: '結婚',
    body: '結婚の意思、時期、結婚式、苗字、法的手続き、住む場所',
  },
  { key: 'money', icon: Coins, title: 'お金', body: '生活費、共通口座、貯蓄、投資、住宅、保険' },
  {
    key: 'family',
    icon: Baby,
    title: '家族',
    body: '子ども、出産、育児、教育、両親、介護、家族行事',
  },
  {
    key: 'work',
    icon: Briefcase,
    title: '仕事',
    body: 'キャリア、転職、起業、出張、海外移住、育休',
  },
  { key: 'dream', icon: Star, title: '夢', body: '二人で実現したいこと、旅行、住みたい場所、老後' },
] as const

/** 未来 (spec §13): life design in five categories + the couple's agreements. */
export default async function FuturePage() {
  const session = await requireCoupleSession()
  const agreements = await listAgreements(session.coupleId, session.userId)
  const dates = await getDatesView(session.coupleId, session.userId)

  return (
    <div>
      <PageTitle title="未来" subtitle="二人で人生を設計する場所" />

      <Card className="mb-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarHeart className="text-primary size-4" aria-hidden="true" />
            ふたりの予定
            {dates.upcoming.length > 0 ? (
              <Badge variant="together">{dates.upcoming.length}件</Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            記念日・家族の行事・大切な人を想う日・旅行。二人で同じ日を覚えておけます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="soft" size="sm">
            <Link href="/dates">予定をひらく</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map(({ key, icon: Icon, title, body }) => {
          const count = agreements.filter((a) => a.category === key).length
          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="text-primary size-4" aria-hidden="true" />
                  {title}
                  {count > 0 ? <Badge variant="together">{count}件の約束</Badge> : null}
                </CardTitle>
                <CardDescription>{body}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="soft" size="sm">
                  <Link href={`/agreements?category=${key}`}>約束を見る・つくる</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <p className="text-text-muted mt-5 text-center text-xs">
        話し合いの結果は「二人の約束」として記録され、いつでも見直せます。
      </p>
    </div>
  )
}
