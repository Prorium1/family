import { requireCoupleSession } from '@/lib/auth/session'
import { startRepairAction } from '@/server/actions/repair-actions'
import { PageTitle } from '@/components/shared/page-title'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuickExit } from '@/features/repair/components/quick-exit'

export const metadata = { title: '気持ちを整理する' }

export default async function NewRepairPage() {
  await requireCoupleSession()
  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-start justify-between gap-3">
        <PageTitle
          title="気持ちを整理する"
          subtitle="責める場所ではありません。安心して、そのまま書いてください。"
        />
        <QuickExit />
      </div>
      <form action={startRepairAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="topic">何について整理しますか？（任意）</Label>
          <Input id="topic" name="topic" maxLength={80} placeholder="例: 週末の予定のすれ違い" />
        </div>
        <div className="grid gap-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">まずは自分だけで整理する</CardTitle>
              <CardDescription>
                書いた内容はパートナーに見えません。AIが気持ちの整理を手伝います。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="submit" name="mode" value="solo" variant="outline" className="w-full">
                一人で整理する
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">パートナーと一緒に整理する</CardTitle>
              <CardDescription>
                それぞれ別々に書き、AIが中立的に整理します。原文の共有範囲は自分で選べます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="submit" name="mode" value="together" className="w-full">
                二人で整理する
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
