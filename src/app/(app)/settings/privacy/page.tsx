import Link from 'next/link'
import { requireSession } from '@/lib/auth/session'
import { getRepositories } from '@/server/repositories'
import { setAiTrainingConsentAction } from '@/server/actions/settings-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export const metadata = { title: 'プライバシー設定' }

export default async function PrivacySettingsPage() {
  const session = await requireSession()
  const consents = await getRepositories().consents.list(session.userId)
  const aiTraining =
    [...consents].reverse().find((c) => c.kind === 'ai_training')?.granted ?? false
  const aiProcessing =
    [...consents].reverse().find((c) => c.kind === 'ai_processing')?.granted ?? false

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>共有範囲について</CardTitle>
          <CardDescription>
            回答やRepairモードの記述は、送信時に選んだ範囲でのみ共有されます。意図しない内容がAIやパートナーに自動公開されることはありません。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-text-muted">
          <ul className="list-disc space-y-1 pl-5">
            <li>自分だけが見られる</li>
            <li>AIだけに共有する</li>
            <li>AIの要約のみパートナーに共有</li>
            <li>選んだ文章だけ共有</li>
            <li>原文をパートナーに共有</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AIの利用</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            AI分析への同意: <span className="font-medium">{aiProcessing ? '同意済み' : '未同意'}</span>
          </p>
          <form action={setAiTrainingConsentAction} className="space-y-3">
            <Label className="flex items-center justify-between gap-3 font-normal">
              <span>
                AIの学習への利用
                <span className="mt-0.5 block text-xs text-text-muted">
                  初期設定はオフです。オンにしなくても、すべての機能を利用できます。
                </span>
              </span>
              <Switch name="granted" defaultChecked={aiTraining} />
            </Label>
            <Button type="submit" variant="outline" size="sm">
              保存する
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AIメモリー</CardTitle>
          <CardDescription>
            AIが整理した「ふたりの取扱説明書」の項目は、いつでも確認・修正・削除できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="soft" size="sm">
            <Link href="/manual">取扱説明書をひらく</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
