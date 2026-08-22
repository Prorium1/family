import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isDemoMode } from '@/config/env'
import { appConfig } from '@/config/app'
import { getSession } from '@/lib/auth/session'
import { clearInviteToken, readInviteToken } from '@/lib/auth/invite-cookie'
import { acceptInvitation, PairingError, peekInvitation } from '@/server/services/pairing-service'
import { ANY_PAIRING_NOTE, GENDER_OPTIONS } from '@/lib/ui/gender'
import { GenderChoice } from '@/features/auth/components/gender-choice'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata = { title: '招待が届いています' }

/** Demo entry for the invited side: the second person, gender as picked. */
function demoJoin(gender: string): string {
  return `/api/demo/login?user=b&next=${encodeURIComponent(`/onboarding?gender=${gender}`)}`
}

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

async function joinNowAction() {
  'use server'
  const session = await getSession()
  const token = await readInviteToken()
  if (!session || !token) redirect('/welcome')
  try {
    await acceptInvitation(session.userId, token)
  } catch (error) {
    await clearInviteToken()
    if (error instanceof PairingError && error.code === 'self_accept') {
      redirect('/pair?invite=self')
    }
    redirect('/pair?invite=expired')
  }
  await clearInviteToken()
  redirect('/home?paired=1')
}

/**
 * Where an invited partner lands. One glance says who invited them and what
 * happens next; one tap starts a registration that ends already paired.
 */
export default async function WelcomePage({ searchParams }: PageProps<'/welcome'>) {
  const params = await searchParams
  const token = await readInviteToken()
  const invitation = token ? await peekInvitation(token) : null
  const session = await getSession()

  if (params.invalid === '1' || !invitation) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 text-center">
        <BrandMark className="mx-auto h-12 w-auto" />
        <h1 className="mt-4 text-xl font-bold">この招待リンクは使えなくなっています</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          有効期限が切れたか、すでに使用された可能性があります。パートナーに新しい招待リンクか6桁のコードをもらってください。
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild variant="outline">
            <Link href="/signup">自分から招待をつくる</Link>
          </Button>
          <Button asChild variant="link">
            <Link href="/login">コードを持っている方はログインへ</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Already registered and free to pair: one tap finishes it.
  if (session?.onboarded && !session.coupleId) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="text-center">
          <BrandMark className="mx-auto h-12 w-auto" state="waiting" />
          <h1 className="mt-4 text-xl font-bold">
            {invitation.inviterName}さんから招待が届いています
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            参加すると、今日の質問が二人に届きます。
          </p>
        </div>
        <form action={joinNowAction} className="mt-6">
          <Button type="submit" className="w-full">
            {invitation.inviterName}さんと二人ではじめる
          </Button>
        </form>
      </div>
    )
  }
  if (session?.coupleId) redirect('/home')

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="text-center">
        <BrandMark className="mx-auto h-12 w-auto" state="waiting" />
        <h1 className="mt-4 text-xl leading-snug font-bold">
          {invitation.inviterName}さんから
          <br />
          {appConfig.name}への招待が届いています
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {stageLabels[invitation.stage] ?? ''}
          の二人として、毎日ひとつの質問に答え合うアプリです。
        </p>
      </div>

      <ol className="mx-auto mt-6 max-w-xs space-y-2 text-sm text-text-muted">
        <li className="flex gap-2">
          <span className="text-primary shrink-0 font-bold">1.</span> 名前を決めて登録（30秒）
        </li>
        <li className="flex gap-2">
          <span className="text-primary shrink-0 font-bold">2.</span> 自動で{invitation.inviterName}
          さんとつながる
        </li>
        <li className="flex gap-2">
          <span className="text-primary shrink-0 font-bold">3.</span> 今日の質問に、それぞれ答える
        </li>
      </ol>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>無料で参加する</CardTitle>
          {isDemoMode ? (
            <CardDescription>選ぶとすぐに登録に進みます。</CardDescription>
          ) : (
            <CardDescription>メールアドレスだけで登録できます。</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {isDemoMode ? (
            <>
              {GENDER_OPTIONS.map((option) => (
                <Button key={option.value} asChild variant={option.variant} className="w-full">
                  <Link href={demoJoin(option.value)} prefetch={false}>
                    {option.entryLabel('参加する')}
                  </Link>
                </Button>
              ))}
              <p className="text-xs text-text-muted">{ANY_PAIRING_NOTE}</p>
            </>
          ) : (
            <form className="space-y-3" action="/api/auth/magic-link" method="post">
              <input type="hidden" name="from" value="welcome" />
              <div className="space-y-1.5">
                <Label htmlFor="welcome-email">メールアドレス</Label>
                <Input id="welcome-email" name="email" type="email" required autoComplete="email" />
              </div>
              <GenderChoice />
              <Button type="submit" className="w-full">
                登録リンクを受け取る
              </Button>
            </form>
          )}
          {params.sent === '1' ? (
            <p className="text-sm text-success" role="status">
              登録リンクをお送りしました。メールをご確認ください。
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
