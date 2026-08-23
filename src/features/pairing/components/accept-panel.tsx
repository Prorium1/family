'use client'

import { useActionState, useState, useTransition } from 'react'
import { acceptInviteAction, type PairingActionState } from '@/server/actions/pairing-actions'
import { looksLikeInviteSecret } from '@/lib/pairing/invite-secret'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QrScanner } from './qr-scanner'

/**
 * The other half of the pairing screen: joining with what the partner gave
 * you. All three shapes land in the same place (spec §7) —
 *
 *   scan   the partner's QR, read by the camera right here
 *   paste  the invite link, straight out of LINE
 *   type   the 6-digit code, read out over the phone
 *
 * A scan submits by itself: someone holding a phone up to another phone has
 * already said what they want, and asking them to confirm afterwards would
 * only be a second thing to do.
 */
export function AcceptPanel({ initialToken }: { initialToken?: string }) {
  const [state, formAction, pending] = useActionState<PairingActionState, FormData>(
    acceptInviteAction,
    {},
  )
  const [secret, setSecret] = useState(initialToken ?? '')
  const [, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader>
        <CardTitle>招待を受け取りましたか？</CardTitle>
        <CardDescription>
          QRコードを読み取るか、届いたリンクか6桁のコードを貼り付けてください。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <QrScanner
          onResult={(value) => {
            // fill the field and submit in the same motion
            setSecret(value)
            const data = new FormData()
            data.set('secret', value)
            startTransition(() => formAction(data))
          }}
        />

        <form action={formAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="secret">相手のコード / 招待リンク</Label>
            <Input
              id="secret"
              name="secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              inputMode="text"
              autoComplete="one-time-code"
              placeholder="123456 または https://…/join/…"
              required
              className="text-center"
            />
          </div>
          {state.error ? (
            <p className="text-danger text-sm" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={pending || !looksLikeInviteSecret(secret)}
          >
            {pending ? 'つないでいます…' : '二人をつなぐ'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
