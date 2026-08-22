import Link from 'next/link'
import { isDemoMode } from '@/config/env'
import { PageTitle } from '@/components/shared/page-title'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata = { title: 'ログイン' }

/**
 * Login. Demo mode: persona picker. Supabase mode: magic-link email form
 * (rendered when credentials are configured).
 */
export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <PageTitle title="おかえりなさい" />
      {isDemoMode ? (
        <Card>
          <CardHeader>
            <CardTitle>デモの席を選ぶ</CardTitle>
            <CardDescription>
              二人ぶんの席を切り替えながら、同じ体験を両側から確認できます。まだ登録していない席は、そのまま登録画面に進みます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/api/demo/login?user=a&next=/home" prefetch={false}>
                1人目の席ではじめる
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/api/demo/login?user=b&next=/home" prefetch={false}>
                2人目の席ではじめる
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/api/demo/login?user=c&next=/home" prefetch={false}>
                第三者の視点で確認する
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>メールでログイン</CardTitle>
            <CardDescription>入力したメールアドレスへログインリンクをお送りします。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action="/api/auth/magic-link" method="post">
              <input type="hidden" name="from" value="login" />
              <div className="space-y-1.5">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <Button type="submit" className="w-full">
                ログインリンクを送る
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
            : 'リンクを送信できませんでした。メールアドレスを確認して、もう一度お試しください。'}
        </p>
      ) : null}
      <p className="mt-4 text-center text-sm text-text-muted">
        アカウントがまだの方は{' '}
        <Link href="/signup" className="text-primary underline">
          ふたりではじめる
        </Link>
      </p>
    </div>
  )
}
