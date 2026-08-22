import type { Question } from '@/types/entities'
import type { QuestionCategory, QuestionFormat, SensitivityLevel } from '@/types/domain'

interface DefineOptions {
  packId: string
  idPrefix: string
  category: QuestionCategory
  defaults?: Partial<
    Pick<Question, 'difficulty' | 'estimatedMinutes' | 'premium' | 'stages' | 'format'>
  > & { sensitivity?: SensitivityLevel }
}

interface QuestionInput {
  text: string
  helper?: string
  format?: QuestionFormat
  options?: string[]
  category?: QuestionCategory
  sensitivity?: SensitivityLevel
  difficulty?: 1 | 2 | 3
  estimatedMinutes?: number
  premium?: boolean
  stages?: Question['stages']
  prerequisiteQuestionId?: string | null
}

/** Compact factory so 120+ seed questions stay readable and consistent. */
export function defineQuestions(opts: DefineOptions, inputs: QuestionInput[]): Question[] {
  return inputs.map((input, index) => ({
    id: `${opts.idPrefix}-${String(index + 1).padStart(2, '0')}`,
    packId: opts.packId,
    format: input.format ?? opts.defaults?.format ?? 'free_text',
    category: input.category ?? opts.category,
    stages: input.stages ?? opts.defaults?.stages ?? 'all',
    difficulty: input.difficulty ?? opts.defaults?.difficulty ?? 1,
    sensitivity: input.sensitivity ?? opts.defaults?.sensitivity ?? 0,
    estimatedMinutes: input.estimatedMinutes ?? opts.defaults?.estimatedMinutes ?? 3,
    preferredWeekday: null,
    prerequisiteQuestionId: input.prerequisiteQuestionId ?? null,
    locale: 'ja',
    version: 1,
    premium: input.premium ?? opts.defaults?.premium ?? false,
    active: true,
    aiFollowUpAllowed: true,
    text: input.text,
    helper: input.helper,
    options: input.options,
  }))
}
