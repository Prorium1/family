import Link from 'next/link'
import { isDemoMode } from '@/config/env'
import { ANY_PAIRING_NOTE, GENDER_OPTIONS } from '@/lib/ui/gender'
import { GenderChoice } from '@/features/auth/components/gender-choice'
import { PageTitle } from '@/components/shared/page-title'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata = { title: 'ふたりではじめる' }

/** Demo entry: the first person, with the gender they just picked. */
function demoEntry(gender: string): string {
  return `/api/demo/login?user=a&next=${encodeURIComponent(`/onboarding?gender=${gender}`)}`
}

export default async function SignupPage({ searchParams }: PageProps<'/signup'>) {
  const params = await searchParams
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <PageTitle title="ふたりではじめる" subtitle="登録は60秒。合言葉もパスワードも不要です。" />
      <ol className="mb-5 space-y-2 text-sm text-text-muted">
        <li className="flex gap-2">
          <span className="text-primary shrink-0 font-bold">1.</span>
          あなたが登録すると、招待リンクとQRコードがすぐに表示されます
        </li>
        <li className="flex gap-2">
          <span className="text-primary shrink-0 font-bold">2.</span>
          パートナーはリンクをタップして登録するだけで、自動的につながります
        </li>
        <li className="flex gap-2">
          <span className="text-primary shrink-0 font-bold">3.</span>
          その日のうちに、最初の質問に二人で答えられます
        </li>
      </ol>
      {isDemoMode ? (
        <Card>
          <CardHeader>
            <CardTitle>あなたから登録する</CardTitle>
            <CardDescription>
              選んだほうで登録が始まります。次の画面に出る招待リンクを送れば、パートナーも同じように選んで参加できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {GENDER_OPTIONS.map((option) => (
              <Button key={option.value} asChild variant={option.variant} className="w-full">
                <Link href={demoEntry(option.value)} prefetch={false}>
                  {option.entryLabel('はじめる')}
                </Link>
              </Button>
            ))}
            <p className="text-xs text-text-muted">{ANY_PAIRING_NOTE}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>メールで登録</CardTitle>
            <CardDescription>確認リンクをお送りします。パスワードは不要です。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action="/api/auth/magic-link" method="post">
              <input type="hidden" name="from" value="signup" />
              <div className="space-y-1.5">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <GenderChoice />
              <Button type="submit" className="w-full">
                登録リンクを送る
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      {params.sent === '1' ? (
        <p className="mt-4 rounded-card bg-success-soft px-4 py-3 text-sm text-success" role="status">
          ログインリンクをお送りしました。メールをご確認ください。
        </p>
      ) : null}
      {typeof params.error === 'string' ? (
        <p className="mt-4 rounded-card bg-warning-soft px-4 py-3 text-sm text-warning" role="alert">
          {params.error === 'unconfigured'
            ? 'メールログインは現在準備中です。デモモードをご利用ください。'
            : params.error === 'rate_limited'
              ? '送信のリクエストが続いています。少し時間をおいて、もう一度お試しください。'
              : 'リンクを送信できませんでした。メールアドレスを確認して、もう一度お試しください。'}
        </p>
      ) : null}
      <p className="mt-4 text-center text-sm text-text-muted">
        すでにアカウントがある方は{' '}
        <Link href="/login" className="text-primary underline">
          ログイン
        </Link>
      </p>
    </div>
  )
}
