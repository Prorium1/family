'use client'

import { useActionState, useState } from 'react'
import {
  createAgreementAction,
  type AgreementActionState,
} from '@/server/actions/agreement-actions'
import { FUTURE_CATEGORIES, type FutureCategory } from '@/types/domain'
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

const categoryLabels: Record<FutureCategory, string> = {
  marriage: '結婚',
  money: 'お金',
  family: '家族',
  work: '仕事',
  dream: '夢',
}

export function AgreementForm({ defaultCategory }: { defaultCategory?: FutureCategory }) {
  const [state, formAction, pending] = useActionState<AgreementActionState, FormData>(
    createAgreementAction,
    {},
  )
  const [category, setCategory] = useState<FutureCategory>(defaultCategory ?? 'dream')

  if (state.createdId) {
    return (
      <p className="animate-gentle-rise rounded-card bg-accent-soft px-4 py-3 text-sm font-medium text-accent-foreground">
        二人の約束を記録しました。約束は固定された契約ではなく、いつでも見直せます。
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="agreement-category">カテゴリー</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as FutureCategory)}>
          <SelectTrigger id="agreement-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FUTURE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {categoryLabels[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="category" value={category} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="agreement-title">タイトル</Label>
        <Input id="agreement-title" name="title" required maxLength={80} placeholder="例: 毎月の貯金" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="agreement-background">背景（任意）</Label>
        <Textarea
          id="agreement-background"
          name="background"
          className="min-h-20"
          maxLength={2000}
          placeholder="どんな話し合いから生まれた約束ですか？"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="agreement-decision">二人で決めたこと</Label>
        <Textarea id="agreement-decision" name="decision" required className="min-h-24" maxLength={2000} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="agreement-starts">開始日（任意）</Label>
          <Input id="agreement-starts" name="startsOn" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agreement-review">見直し日（任意）</Label>
          <Input id="agreement-review" name="reviewOn" type="date" />
        </div>
      </div>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        約束を記録する
      </Button>
    </form>
  )
}
