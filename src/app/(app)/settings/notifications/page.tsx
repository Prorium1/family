import { requireSession } from '@/lib/auth/session'
import { getNotificationPreferences } from '@/server/services/settings-service'
import { saveNotificationsAction } from '@/server/actions/settings-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export const metadata = { title: '通知設定' }

/** Notifications (spec §26): gentle, content-free, user-timed. */
export default async function NotificationSettingsPage() {
  const session = await requireSession()
  const prefs = await getNotificationPreferences(session.userId)
  const toggles = [
    { name: 'dailyQuestion', label: '今日のふたりの質問が届いたとき', value: prefs.dailyQuestion },
    { name: 'bothRevealed', label: '二人の答えがそろったとき', value: prefs.bothRevealed },
    { name: 'weeklyCheckin', label: '今週のチェックインができるとき', value: prefs.weeklyCheckin },
    { name: 'gratitudeReceived', label: 'パートナーから感謝が届いたとき', value: prefs.gratitudeReceived },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>通知</CardTitle>
        <CardDescription>
          通知の文面に、回答や争いの内容が含まれることはありません。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={saveNotificationsAction} className="space-y-5">
          <div className="space-y-3">
            {toggles.map((t) => (
              <Label key={t.name} className="flex items-center justify-between gap-3 font-normal">
                {t.label}
                <Switch name={t.name} defaultChecked={t.value} />
              </Label>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preferredTime">通知を受け取りたい時間</Label>
            <Input
              id="preferredTime"
              name="preferredTime"
              type="time"
              defaultValue={prefs.preferredTime}
              className="max-w-40"
            />
          </div>
          <div>
            <p className="text-sm font-medium">二人の時間（任意）</p>
            <p className="text-xs text-text-muted">
              この時間帯は通知を控えます。カップルごとに設定できます。
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Input
                aria-label="二人の時間 開始"
                name="coupleTimeStart"
                type="time"
                defaultValue={prefs.coupleTimeStart ?? ''}
                className="max-w-36"
              />
              <span className="text-text-muted">〜</span>
              <Input
                aria-label="二人の時間 終了"
                name="coupleTimeEnd"
                type="time"
                defaultValue={prefs.coupleTimeEnd ?? ''}
                className="max-w-36"
              />
            </div>
          </div>
          <Button type="submit">保存する</Button>
        </form>
      </CardContent>
    </Card>
  )
}
