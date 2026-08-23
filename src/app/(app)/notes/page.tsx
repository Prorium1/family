import { requireCoupleSession } from '@/lib/auth/session'
import { listNotes } from '@/server/services/notes-service'
import { removeNoteAction, saveNoteAction } from '@/server/actions/life-actions'
import { NOTE_KIND_LABELS } from '@/lib/ui/couple-life'
import { NoteForm } from '@/features/life/components/note-form'
import { PageTitle } from '@/components/shared/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { ShieldCheck } from 'lucide-react'

export const metadata = { title: 'ふたりのメモ' }

/** メモ (spec: メモ・旅行計画・万が一メモ) — shared, editable by both. */
export default async function NotesPage() {
  const session = await requireCoupleSession()
  const notes = await listNotes(session.coupleId, session.userId)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle
        title="ふたりのメモ"
        subtitle="買いものメモから旅行の計画、もしものときの控えまで。どちらからでも書けて、どちらでも直せます。"
      />

      <p className="rounded-card bg-surface-muted text-text-muted flex items-start gap-2 px-4 py-3 text-xs">
        <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
        メモの本文は暗号化して保存され、読めるのは二人だけです。運営も読めません。
      </p>

      {notes.length === 0 ? (
        <EmptyState title="最初のメモを、下からつくってみてください" />
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-card border-border bg-surface shadow-card border">
              <details>
                <summary className="cursor-pointer p-4">
                  <div className="inline-flex flex-wrap items-center gap-2">
                    <Badge variant={note.kind === 'emergency' ? 'outline' : 'together'}>
                      {NOTE_KIND_LABELS[note.kind]}
                    </Badge>
                    <span className="font-semibold">{note.title}</span>
                  </div>
                  {note.body ? (
                    <p className="text-text-muted mt-1 line-clamp-2 text-sm whitespace-pre-line">
                      {note.body}
                    </p>
                  ) : null}
                </summary>
                <div className="border-border border-t p-4">
                  <form action={saveNoteAction} className="space-y-3">
                    <input type="hidden" name="id" value={note.id} />
                    <div className="space-y-1.5">
                      <Label htmlFor={`title-${note.id}`}>タイトル</Label>
                      <Input
                        id={`title-${note.id}`}
                        name="title"
                        defaultValue={note.title}
                        required
                        maxLength={80}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`body-${note.id}`}>本文</Label>
                      <Textarea
                        id={`body-${note.id}`}
                        name="body"
                        defaultValue={note.body}
                        rows={5}
                        maxLength={8000}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Button type="submit" variant="secondary" size="sm">
                        保存する
                      </Button>
                    </div>
                  </form>
                  <form action={removeNoteAction} className="mt-2 text-right">
                    <input type="hidden" name="id" value={note.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      削除
                    </Button>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader>
          <CardTitle>あたらしいメモ</CardTitle>
          <CardDescription>
            「もしものときメモ」には、いざというとき相手が困らないことを書いておけます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NoteForm />
        </CardContent>
      </Card>
    </div>
  )
}
