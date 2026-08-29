import { sendSignalAction } from '@/server/actions/life-actions'
import { SIGNAL_KINDS } from '@/types/domain'
import { SIGNAL_LABELS } from '@/lib/ui/couple-life'
import type { SignalBoardDTO } from '@/server/services/signals-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

function ago(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  return `${Math.floor(minutes / 60)}時間前`
}

/**
 * ひとことサイン (spec: チェックイン): one tap says 「元気だよ」. The partner's
 * latest sign sits above the buttons — receiving comes before sending.
 * No location is involved, by design.
 */
export function SignalCard({ board, partnerName }: { board: SignalBoardDTO; partnerName: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ひとことサイン</CardTitle>
        <CardDescription>
          ワンタップで「元気だよ」を伝えられます。位置情報は使いません。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {board.partner ? (
          <p className="rounded-card-sm bg-person-b-soft px-4 py-3 text-sm">
            <span className="text-person-b font-semibold">{partnerName}さん:</span> 「
            {SIGNAL_LABELS[board.partner.kind]}」
            <span className="text-text-muted ml-1 text-xs">{ago(board.partner.at)}</span>
          </p>
        ) : (
          <p className="rounded-card-sm bg-surface-muted text-text-muted px-4 py-3 text-sm">
            この24時間、{partnerName}さんからのサインはまだありません。
          </p>
        )}

        <form action={sendSignalAction} className="flex flex-wrap gap-2">
          {SIGNAL_KINDS.map((kind) => (
            <Button
              key={kind}
              type="submit"
              name="kind"
              value={kind}
              variant={board.mine?.kind === kind ? 'personA' : 'outline'}
              size="sm"
            >
              {SIGNAL_LABELS[kind]}
            </Button>
          ))}
        </form>
        {board.mine ? (
          <p className="text-text-muted text-xs">
            あなたの最新: 「{SIGNAL_LABELS[board.mine.kind]}」（{ago(board.mine.at)}）
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
