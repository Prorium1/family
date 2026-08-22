import Link from 'next/link'
import { requireOnboardedSession } from '@/lib/auth/session'
import { getPairStatus } from '@/server/services/pairing-service'
import { unpairAction } from '@/server/actions/settings-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export const metadata = { title: 'ふたりの設定' }

export default async function CoupleSettingsPage() {
  const session = await requireOnboardedSession()
  const status = await getPairStatus(session.userId)

  if (!status.paired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>まだパートナーとつながっていません</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/pair">パートナーを招待する</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>ふたりの情報</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            パートナー: <span className="font-medium">{status.couple?.partner?.displayName}</span>
          </p>
          {status.couple?.pairedAt ? (
            <p className="mt-1 text-text-muted">
              つながった日:{' '}
              {new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long' }).format(
                new Date(status.couple.pairedAt),
              )}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle>ペアを解除する</CardTitle>
          <CardDescription>
            解除すると、新しい共有データにはお互いにアクセスできなくなります。これまでの記録の扱いを選択できます。この操作は無料です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={unpairAction} className="space-y-3">
            <fieldset className="space-y-2 text-sm">
              <legend className="sr-only">既存データの扱い</legend>
              <Label className="flex items-center gap-2 font-normal">
                <input type="radio" name="dataChoice" value="keep" defaultChecked className="size-4" />
                これまでの記録を残す（閲覧のみ）
              </Label>
              <Label className="flex items-center gap-2 font-normal">
                <input type="radio" name="dataChoice" value="delete_mine" className="size-4" />
                自分のデータの削除を申請する
              </Label>
            </fieldset>
            <Button type="submit" variant="danger">
              ペアを解除する
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
