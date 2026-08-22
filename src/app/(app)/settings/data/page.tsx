import { requireSession } from '@/lib/auth/session'
import { getRepositories } from '@/server/repositories'
import { requestDeletionAction } from '@/server/actions/settings-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata = { title: 'データ設定' }

/** Export & deletion — always free (spec §27). */
export default async function DataSettingsPage() {
  const session = await requireSession()
  const requests = await getRepositories().dataRequests.list(session.userId)
  const pendingDeletion = requests.some((r) => r.kind === 'deletion' && r.status === 'pending')

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>データをエクスポート</CardTitle>
          <CardDescription>
            あなたのデータをJSON形式でダウンロードできます。公開前のパートナーの回答は含まれません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href="/api/export" download>
              エクスポートする
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle>データの削除を申請</CardTitle>
          <CardDescription>
            アカウントとデータの削除を申請します。取り消しはできません。この操作は無料です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDeletion ? (
            <p className="text-sm text-text-muted">削除申請を受け付けました。順次処理されます。</p>
          ) : (
            <form action={requestDeletionAction}>
              <Button type="submit" variant="danger">
                削除を申請する
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
