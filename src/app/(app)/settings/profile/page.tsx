import { requireSession } from '@/lib/auth/session'
import { getRepositories } from '@/server/repositories'
import { updateProfileAction } from '@/server/actions/settings-actions'
import { GenderChoice } from '@/features/auth/components/gender-choice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata = { title: 'プロフィール設定' }

export default async function ProfileSettingsPage() {
  const session = await requireSession()
  const profile = await getRepositories().profiles.getById(session.userId)
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
          <GenderChoice initial={profile?.gender ?? null} required={false} showNote={false} />
          <Button type="submit">保存する</Button>
        </form>
      </CardContent>
    </Card>
  )
}
