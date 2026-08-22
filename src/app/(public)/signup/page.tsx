import Link from 'next/link'
import { isDemoMode } from '@/config/env'
import { PageTitle } from '@/components/shared/page-title'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata = { title: 'ふたりではじめる' }

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <PageTitle
        title="ふたりではじめる"
        subtitle="まずあなたが登録して、パートナーを招待しましょう。"
      />
      {isDemoMode ? (
        <Card>
          <CardHeader>
            <CardTitle>デモで体験する</CardTitle>
            <CardDescription>
              「あかり」で登録 → 招待コードを作成 → 「ゆうと」に切り替えて参加、という流れを体験できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/api/demo/login?user=a&next=/onboarding" prefetch={false}>
                あかり として登録する
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/api/demo/login?user=b&next=/onboarding" prefetch={false}>
                ゆうと として登録する
              </Link>
            </Button>
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
              <div className="space-y-1.5">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <Button type="submit" className="w-full">
                登録リンクを送る
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      <p className="mt-4 text-center text-sm text-text-muted">
        すでにアカウントがある方は{' '}
        <Link href="/login" className="text-primary underline">
          ログイン
        </Link>
      </p>
    </div>
  )
}
