import { requireSession } from '@/lib/auth/session'
import { updateProfileAction } from '@/server/actions/settings-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata = { title: 'プロフィール設定' }

export default async function ProfileSettingsPage() {
  const session = await requireSession()
  return (
    <Card>
      <CardHeader>
        <CardTitle>プロフィール</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateProfileAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">表示名</Label>
            <Input id="displayName" name="displayName" defaultValue={session.displayName} maxLength={30} required />
          </div>
          <Button type="submit">保存する</Button>
        </form>
      </CardContent>
    </Card>
  )
}
