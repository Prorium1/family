'use client'

import { useActionState, useState } from 'react'
import {
  completeOnboardingAction,
  type OnboardingActionState,
} from '@/server/actions/onboarding-actions'
import { RELATIONSHIP_STAGES, type Gender, type RelationshipStage } from '@/types/domain'
import { GenderChoice } from './gender-choice'
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

/**
 * Minimal onboarding (spec §7): a name, one consent, one tap. An invited
 * partner is not asked for the relationship stage — the invitation already
 * carries it, so their path is even shorter.
 */
export function OnboardingForm({
  initialName,
  initialGender,
  invited,
  inviterName,
}: {
  initialName: string
  initialGender: Gender | null
  invited: boolean
  inviterName?: string
}) {
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(
    completeOnboardingAction,
    {},
  )
  const [stage, setStage] = useState<RelationshipStage>('dating')

  return (
    <form action={formAction} className="space-y-5">
      {invited && inviterName ? (
        <p className="bg-wash rounded-card px-4 py-3 text-sm">
          登録が終わると、自動で
          <span className="text-primary font-semibold">{inviterName}さん</span>
          とつながります。
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="displayName">表示名</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initialName}
          placeholder="ニックネームでも構いません"
          required
          autoFocus
          maxLength={30}
          autoComplete="nickname"
        />
        <p className="text-xs text-text-muted">パートナーに表示される名前です。</p>
      </div>

      {/* The mark's two circles, offered as the two entry colors (§3.1). */}
      <GenderChoice initial={initialGender} />

      {!invited ? (
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
        </div>
      ) : null}
      <input type="hidden" name="stage" value={stage} />

      <input type="hidden" name="locale" value="ja" />
      <input
        type="hidden"
        name="timezone"
        value={Intl.DateTimeFormat().resolvedOptions().timeZone}
      />

      <div className="space-y-3 rounded-card border border-border p-4">
        <Label className="flex items-start gap-3 font-normal">
          <Checkbox name="consent" required className="mt-0.5" />
          <span>
            私は18歳以上で、
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
        {invited ? '登録して、二人ではじめる' : 'はじめる'}
      </Button>
    </form>
  )
}
