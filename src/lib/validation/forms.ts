import { z } from 'zod'
import { FUTURE_CATEGORIES, GENDERS, RELATIONSHIP_STAGES, VISIBILITY_LEVELS } from '@/types/domain'

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(1, '表示名を入力してください').max(30),
  gender: z.enum(GENDERS, { error: '性別を選んでください' }),
  locale: z.enum(['ja', 'en']),
  timezone: z.string().min(1),
  stage: z.enum(RELATIONSHIP_STAGES),
  ageConfirmed: z.literal(true, { error: '18歳以上であることの確認が必要です' }),
  termsAccepted: z.literal(true, { error: '利用規約への同意が必要です' }),
  aiConsent: z.boolean(),
})

export const inviteAcceptSchema = z.object({
  secret: z.string().trim().min(6).max(64),
})

export const answerValueSchema = z.union([
  z.object({ kind: z.literal('text'), text: z.string().max(4000) }),
  z.object({ kind: z.literal('choice'), selected: z.array(z.string().max(200)).max(10) }),
  z.object({ kind: z.literal('scale'), value: z.number().int().min(1).max(5) as z.ZodType<1 | 2 | 3 | 4 | 5> }),
  z.object({ kind: z.literal('ranking'), ordered: z.array(z.string().max(200)).max(10) }),
])

export const draftSchema = z.object({
  assignmentId: z.string().min(1),
  value: answerValueSchema,
  visibility: z.enum(VISIBILITY_LEVELS),
})

export const repairEntriesSchema = z.object({
  sessionId: z.string().min(1),
  entries: z.array(z.object({ promptId: z.string(), text: z.string().max(4000) })).max(10),
  visibility: z.enum(VISIBILITY_LEVELS),
  submit: z.boolean(),
})

export const agreementSchema = z.object({
  category: z.enum(FUTURE_CATEGORIES),
  title: z.string().trim().min(1).max(80),
  background: z.string().max(2000),
  decision: z.string().trim().min(1).max(2000),
  startsOn: z.string().nullable(),
  reviewOn: z.string().nullable(),
})

export const checkinAnswersSchema = z.object({
  checkinId: z.string().min(1),
  answers: z.array(z.object({ questionId: z.string(), text: z.string().max(2000) })).min(1).max(5),
})
