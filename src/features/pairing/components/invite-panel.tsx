'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import QRCode from 'qrcode'
import {
  createInviteAction,
  revokeInviteAction,
  type PairingActionState,
} from '@/server/actions/pairing-actions'
import { appConfig } from '@/config/app'
import { RELATIONSHIP_STAGES, type RelationshipStage } from '@/types/domain'
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
import { Copy, Check, Share2 } from 'lucide-react'

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
      size="sm"
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
 * Invite creation and hand-off (spec §7). Optimized for the two real
 * situations a couple is in:
 *  - apart: one tap shares a ready-made message (Web Share / copy) whose
 *    link pairs the partner automatically via /join
 *  - side by side: the partner scans the QR code with their camera
 * With `auto`, the invitation is created the moment the page opens — the
 * inviter never hunts for a button after onboarding.
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
  const [stage, setStage] = useState<RelationshipStage>(initialStage)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [shared, setShared] = useState(false)
  const autoFired = useRef(false)
  const [, startTransition] = useTransition()

  // Auto-create right after onboarding (?auto=1) — zero extra taps.
  useEffect(() => {
    if (!auto || autoFired.current || state.invite || state.error) return
    autoFired.current = true
    const data = new FormData()
    data.set('stage', initialStage)
    startTransition(() => formAction(data))
  }, [auto, initialStage, state.invite, state.error, formAction])

  // Camera-scannable hand-off for couples sitting together.
  useEffect(() => {
    if (!state.invite) return
    let cancelled = false
    QRCode.toString(state.invite.inviteUrl, { type: 'svg', margin: 1, width: 168 })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg)
      })
      .catch(() => setQrSvg(null))
    return () => {
      cancelled = true
    }
  }, [state.invite])

  if (state.invite) {
    const { inviteUrl, code, expiresAt } = state.invite
    const expires = new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(expiresAt))
    const message = `${inviterName}から${appConfig.name}の招待が届いています。\n二人で毎日ひとつの質問に答え合うアプリです。\n\n参加リンク: ${inviteUrl}\n（リンクが開けないときは、アプリで6桁コード ${code} を入力）`

    return (
      <Card data-testid="invite-created">
        <CardHeader>
          <CardTitle>招待の準備ができました</CardTitle>
          <CardDescription>
            パートナーがリンクをタップ（またはQRを読み取り）すると、登録だけで自動的に二人がつながります。有効期限: {expires}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Button
            type="button"
            className="w-full"
            onClick={async () => {
              if (typeof navigator.share === 'function') {
                try {
                  await navigator.share({ title: appConfig.name, text: message })
                  return
                } catch {
                  /* user cancelled or share unsupported — fall back to copy */
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
            {shared ? '招待メッセージをコピーしました' : '招待を送る（LINEなどで共有）'}
          </Button>

          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            {qrSvg ? (
              <div
                className="mx-auto w-fit rounded-card-sm border border-border bg-surface p-2"
                role="img"
                aria-label="招待用QRコード"
                // The SVG is generated locally from the invite URL — safe.
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : null}
            <div className="space-y-3 text-center sm:text-left">
              <p className="text-sm text-text-muted">
                隣にいるなら、このQRコードをパートナーのカメラで読み取るのがいちばん早い方法です。
              </p>
              <div className="space-y-1.5">
                <Label>6桁の招待コード</Label>
                <p
                  data-testid="invite-code"
                  className="rounded-card-sm bg-surface-muted px-3 py-2 text-center text-2xl font-bold tracking-[0.4em]"
                >
                  {code}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>招待リンク</Label>
            <div className="flex items-center gap-2">
              <code
                data-testid="invite-url"
                className="min-w-0 flex-1 truncate rounded-card-sm bg-surface-muted px-3 py-2.5 text-xs"
              >
                {inviteUrl}
              </code>
              <CopyButton text={inviteUrl} label="招待リンク" />
            </div>
          </div>

          <form action={revokeInviteAction}>
            <Button type="submit" variant="ghost" size="sm">
              招待を取り消す
            </Button>
          </form>
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
          <p className="text-sm text-text-muted" role="status">
            招待リンクを準備しています…
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
              <p className="text-sm text-danger" role="alert">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              招待リンクとコードを作成
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
