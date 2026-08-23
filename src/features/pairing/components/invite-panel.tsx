'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import QRCode from 'qrcode'
import {
  createInviteAction,
  refreshInviteAction,
  revokeInviteAction,
  type PairingActionState,
} from '@/server/actions/pairing-actions'
import { appConfig } from '@/config/app'
import { formatInviteCode } from '@/lib/pairing/invite-secret'
import { RELATIONSHIP_STAGES, type RelationshipStage } from '@/types/domain'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, Check, RefreshCw, Share2 } from 'lucide-react'

const stageLabels: Record<RelationshipStage, string> = {
  dating: '恋人',
  long_distance: '遠距離',
  cohabiting: '同棲',
  considering_engagement: '婚約検討中',
  engaged: '婚約',
  married: '結婚',
  preparing_for_children: '妊娠・出産準備',
  parenting: '子育て',
  long_term_partners: '長期パートナー',
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      aria-label={`${label}をコピー`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? 'コピーしました' : 'コピー'}
    </Button>
  )
}

/**
 * Invite creation and hand-off (spec §7).
 *
 * The code exists the moment this screen opens — nobody should have to find
 * a button before they can invite the person sitting next to them. What they
 * need is then all in one place, in the order they need it: the QR to show,
 * the code to read aloud, the link to send, and a live line saying the
 * partner has not arrived yet.
 */
export function InvitePanel({
  auto = false,
  initialStage = 'dating',
  inviterName,
}: {
  auto?: boolean
  initialStage?: RelationshipStage
  inviterName: string
}) {
  const [state, formAction, pending] = useActionState<PairingActionState, FormData>(
    createInviteAction,
    {},
  )
  const [refreshState, refreshAction, refreshing] = useActionState<PairingActionState, FormData>(
    refreshInviteAction,
    {},
  )
  const [stage, setStage] = useState<RelationshipStage>(initialStage)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [shared, setShared] = useState(false)
  const autoFired = useRef(false)
  const [, startTransition] = useTransition()
  const invite = refreshState.invite ?? state.invite

  // Auto-create right after onboarding (?auto=1) — zero extra taps.
  useEffect(() => {
    if (!auto || autoFired.current || state.invite || state.error) return
    autoFired.current = true
    const data = new FormData()
    data.set('stage', initialStage)
    startTransition(() => formAction(data))
  }, [auto, initialStage, state.invite, state.error, formAction])

  // Camera-scannable hand-off for couples sitting together. Level H leaves
  // room for the mark in the middle without costing readability.
  useEffect(() => {
    if (!invite) return
    let cancelled = false
    QRCode.toString(invite.inviteUrl, {
      type: 'svg',
      margin: 1,
      width: 232,
      errorCorrectionLevel: 'H',
    })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg)
      })
      .catch(() => setQrSvg(null))
    return () => {
      cancelled = true
    }
  }, [invite])

  if (invite) {
    const { inviteUrl, code, expiresAt } = invite
    const expires = new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(expiresAt))
    const message = `${inviterName}から${appConfig.name}の招待が届いています。\n二人で毎日ひとつの質問に答え合うアプリです。\n\n参加リンク: ${inviteUrl}\n（リンクが開けないときは、アプリで6桁コード ${code} を入力）`

    return (
      <Card data-testid="invite-created" className="overflow-hidden">
        <CardHeader>
          <CardTitle>パートナーを招待しましょう</CardTitle>
          <CardDescription>
            このコードを見せるか、リンクを送るだけ。相手は登録するだけで二人がつながります。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="bg-wash rounded-card-lg px-4 py-6">
            {qrSvg ? (
              <div className="relative mx-auto w-fit">
                <div
                  className="rounded-card border-border bg-surface shadow-card border p-3"
                  role="img"
                  aria-label="招待用QRコード"
                  // Generated locally from the invite URL — no remote input.
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                {/* The mark sits in the middle, as it does on the app icon.
                    Level H tolerates it — src/tests/e2e/qr-pairing.spec.ts
                    decodes the rendered pixels to prove it still scans. */}
                <span
                  className="rounded-card-sm bg-surface shadow-card pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5"
                  aria-hidden="true"
                >
                  <BrandMark className="h-6 w-auto" state="together" />
                </span>
              </div>
            ) : (
              <div className="rounded-card bg-surface/70 mx-auto h-[258px] w-[258px] animate-pulse" />
            )}

            <div className="mt-5 space-y-1 text-center">
              <Label className="text-text-muted text-xs tracking-[0.2em]">招待コード</Label>
              <p
                data-testid="invite-code"
                className="text-2xl font-bold tracking-[0.2em] tabular-nums"
              >
                {formatInviteCode(code)}
              </p>
              <p className="text-text-muted text-xs">有効期限 {expires}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <CopyButton text={inviteUrl} label="招待リンク" />
              <Button
                type="button"
                onClick={async () => {
                  if (typeof navigator.share === 'function') {
                    try {
                      await navigator.share({ title: appConfig.name, text: message })
                      return
                    } catch {
                      /* cancelled or unsupported — fall back to the clipboard */
                    }
                  }
                  try {
                    await navigator.clipboard.writeText(message)
                    setShared(true)
                    setTimeout(() => setShared(false), 2500)
                  } catch {
                    /* clipboard unavailable */
                  }
                }}
              >
                <Share2 className="size-4" aria-hidden="true" />
                {shared ? 'コピーしました' : 'シェア'}
              </Button>
            </div>

            {/* The one live line on this screen: the screen flips to /home by
                itself the moment the partner joins, so this never lies. */}
            <p
              className="animate-lens-breathe text-primary mt-4 text-center text-sm font-medium"
              role="status"
              data-testid="waiting-for-partner"
            >
              パートナーの参加を待っています
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>招待リンク</Label>
            <code
              data-testid="invite-url"
              className="rounded-card-sm bg-surface-muted block truncate px-3 py-2.5 text-xs"
            >
              {inviteUrl}
            </code>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <form action={refreshAction}>
              <Button type="submit" variant="ghost" size="sm" disabled={refreshing}>
                <RefreshCw className="size-4" aria-hidden="true" />
                {refreshing ? '作り直しています…' : 'コードを作り直す'}
              </Button>
            </form>
            <form action={revokeInviteAction}>
              <Button type="submit" variant="ghost" size="sm">
                招待を取り消す
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>パートナーを招待する</CardTitle>
        <CardDescription>二人がつながると、今日の質問が始まります。</CardDescription>
      </CardHeader>
      <CardContent>
        {auto && !state.error ? (
          <p className="text-text-muted text-sm" role="status">
            招待コードを準備しています…
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-stage">今の二人の関係</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as RelationshipStage)}>
                <SelectTrigger id="invite-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {stageLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="stage" value={stage} />
            </div>
            {state.error ? (
              <p className="text-danger text-sm" role="alert">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              招待コードを作成
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
