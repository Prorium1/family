'use client'

import { useActionState, useState } from 'react'
import {
  createInviteAction,
  revokeInviteAction,
  type PairingActionState,
} from '@/server/actions/pairing-actions'
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
import { Copy, Check } from 'lucide-react'

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

/** Invite creation: link + 6-digit code shown once, revoke/reissue (spec §7). */
export function InvitePanel() {
  const [state, formAction, pending] = useActionState<PairingActionState, FormData>(
    createInviteAction,
    {},
  )
  const [stage, setStage] = useState<RelationshipStage>('dating')

  if (state.invite) {
    const expires = new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(state.invite.expiresAt))
    return (
      <Card data-testid="invite-created">
        <CardHeader>
          <CardTitle>招待を作成しました</CardTitle>
          <CardDescription>
            リンクまたは6桁のコードをパートナーに伝えてください。有効期限: {expires}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>招待リンク</Label>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-card-sm bg-surface-muted px-3 py-2.5 text-xs">
                {state.invite.inviteUrl}
              </code>
              <CopyButton text={state.invite.inviteUrl} label="招待リンク" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>6桁の招待コード</Label>
            <div className="flex items-center gap-2">
              <p
                data-testid="invite-code"
                className="flex-1 rounded-card-sm bg-surface-muted px-3 py-2 text-center text-2xl font-bold tracking-[0.4em]"
              >
                {state.invite.code}
              </p>
              <CopyButton text={state.invite.code} label="招待コード" />
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
      </CardContent>
    </Card>
  )
}
