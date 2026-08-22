'use client'

import { useActionState } from 'react'
import {
  acceptInviteAction,
  type PairingActionState,
} from '@/server/actions/pairing-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Accept an invitation with the 6-digit code (or a pasted link token). */
export function AcceptPanel({ initialToken }: { initialToken?: string }) {
  const [state, formAction, pending] = useActionState<PairingActionState, FormData>(
    acceptInviteAction,
    {},
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>招待を受け取りましたか？</CardTitle>
        <CardDescription>パートナーから届いた6桁のコードを入力してください。</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="secret">招待コード</Label>
            <Input
              id="secret"
              name="secret"
              defaultValue={initialToken ?? ''}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
              minLength={6}
              className="text-center text-xl tracking-[0.3em]"
            />
          </div>
          {state.error ? (
            <p className="text-sm text-danger" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
            参加する
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
