'use client'

import { useState } from 'react'
import { createNoteAction } from '@/server/actions/life-actions'
import { COUPLE_NOTE_KINDS, type CoupleNoteKind } from '@/types/domain'
import { NOTE_KIND_LABELS } from '@/lib/ui/couple-life'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const placeholders: Record<CoupleNoteKind, { title: string; body: string }> = {
  memo: { title: '例: 買っておくもの', body: '二人で覚えておきたいこと' },
  trip: { title: '例: 秋の京都', body: '行きたい場所、泊まりたい宿、持ちもの…' },
  emergency: {
    title: '例: もしものとき',
    body: '保険・かかりつけ・連絡してほしい人など、いざというとき相手が困らないことを。パスワードそのものは書かないでください。',
  },
}

/** Start a shared note. The kind only changes the guidance, not the rules. */
export function NoteForm() {
  const [kind, setKind] = useState<CoupleNoteKind>('memo')

  return (
    <form action={createNoteAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="note-kind">種類</Label>
        <Select value={kind} onValueChange={(v) => setKind(v as CoupleNoteKind)}>
          <SelectTrigger id="note-kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUPLE_NOTE_KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {NOTE_KIND_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="kind" value={kind} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note-title">タイトル</Label>
        <Input
          id="note-title"
          name="title"
          required
          maxLength={80}
          placeholder={placeholders[kind].title}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note-body">本文</Label>
        <Textarea
          id="note-body"
          name="body"
          rows={4}
          maxLength={8000}
          placeholder={placeholders[kind].body}
        />
      </div>

      <Button type="submit" variant="secondary" className="w-full">
        メモをつくる
      </Button>
    </form>
  )
}
