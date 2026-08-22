'use client'

import { useActionState } from 'react'
import {
  completeOnboardingAction,
  type OnboardingActionState,
} from '@/server/actions/onboarding-actions'
import { RELATIONSHIP_STAGES, type RelationshipStage } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'

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

/** Minimal onboarding (spec §7): no birthdate, no address, no employer. */
export function OnboardingForm({ initialName }: { initialName: string }) {
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(
    completeOnboardingAction,
    {},
  )
  const [stage, setStage] = useState<RelationshipStage>('dating')

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">表示名</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initialName}
          required
          maxLength={30}
          autoComplete="nickname"
        />
        <p className="text-xs text-text-muted">
          パートナーに表示される名前です。ニックネームでも構いません。
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="stage-select">今の二人の関係</Label>
        <Select value={stage} onValueChange={(v) => setStage(v as RelationshipStage)}>
          <SelectTrigger id="stage-select">
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

      <input type="hidden" name="locale" value="ja" />
      <input
        type="hidden"
        name="timezone"
        value={Intl.DateTimeFormat().resolvedOptions().timeZone}
      />

      <div className="space-y-3 rounded-card border border-border p-4">
        <Label className="flex items-start gap-3 font-normal">
          <Checkbox name="ageConfirmed" required className="mt-0.5" />
          <span>私は18歳以上です</span>
        </Label>
        <Label className="flex items-start gap-3 font-normal">
          <Checkbox name="termsAccepted" required className="mt-0.5" />
          <span>
            <a href="/terms" className="text-primary underline" target="_blank">
              利用規約
            </a>
            と
            <a href="/privacy" className="text-primary underline" target="_blank">
              プライバシーポリシー
            </a>
            に同意します
          </span>
        </Label>
        <Label className="flex items-start gap-3 font-normal">
          <Checkbox name="aiConsent" defaultChecked className="mt-0.5" />
          <span>
            AIによる回答の分析に同意します
            <span className="mt-0.5 block text-xs text-text-muted">
              同意しない場合も、AI以外のすべての機能を利用できます。いつでも変更できます。
            </span>
          </span>
        </Label>
      </div>

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        はじめる
      </Button>
    </form>
  )
}
