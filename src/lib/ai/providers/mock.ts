import 'server-only'
import { createHash } from 'node:crypto'
import type { AiProvider, StructuredRequest, StructuredResult } from '../provider'
import type { DailyInsight, RepairInsight, WeeklySummary } from '@/lib/validation/ai-insight'
import type { SafetyLevel } from '@/types/domain'

/**
 * Deterministic mock provider: schema-valid Japanese output synthesized from
 * the actual (visibility-filtered) answers. Same input → same output, so e2e
 * tests can assert on it. It fails on demand when the input contains the
 * marker `[[force-ai-error]]` — that is how the §37 "AI failure still reveals
 * answers" scenario is exercised end to end.
 */

export interface MockDailyContext {
  question: { text: string; category: string }
  answers: Array<{ name: string; text: string }>
  safetyLevel: SafetyLevel
}

export interface MockRepairContext {
  entries: Array<{ name: string; promptId: string; text: string }>
  safetyLevel: SafetyLevel
}

export interface MockWeeklyContext {
  weeks: Array<{ name: string; highlights: string[] }>
  safetyLevel: SafetyLevel
}

const FORCE_ERROR_MARKER = '[[force-ai-error]]'

function seededIndex(seed: string, modulo: number): number {
  const digest = createHash('sha256').update(seed).digest()
  return digest[0] % modulo
}

function firstClause(text: string, max = 42): string {
  const clause = text.split(/[。\n！？!?]/)[0]?.trim() ?? ''
  return clause.length > max ? `${clause.slice(0, max)}…` : clause
}

function containsErrorMarker(context: unknown): boolean {
  return JSON.stringify(context ?? '').includes(FORCE_ERROR_MARKER)
}

const CONVERSATION_QUESTIONS = [
  '相手の答えの中で、いちばん意外だったのはどこですか？',
  'お互いの答えに共通していた気持ちは、何だと思いますか？',
  '相手の答えについて、もう少し聞いてみたいことは何ですか？',
]

const MICRO_ACTIONS: Array<DailyInsight['microAction']> = [
  {
    title: '今日の「ありがとう」をひとつ',
    description: '今日の相手の答えに触れながら、感謝をひとこと伝えてみましょう。',
    estimatedMinutes: 3,
  },
  {
    title: '5分だけ、ながら時間をやめる',
    description: 'スマホを置いて、今日の質問の話を5分だけ続けてみましょう。',
    estimatedMinutes: 5,
  },
  {
    title: '相手の答えを一度、声に出して読む',
    description: '相手の答えを読み上げて、受け取った気持ちをひとことで返してみましょう。',
    estimatedMinutes: 3,
  },
]

function buildDailyInsight(context: MockDailyContext): DailyInsight {
  const seed = JSON.stringify(context)
  const [a, b] = context.answers
  const differences =
    a && b && a.text.trim() !== b.text.trim()
      ? [
          {
            topic: context.question.text,
            neutralExplanation: `${a.name}さんと${b.name}さんの答えには、それぞれ違う視点が含まれているようです。違いは悪いことではなく、お互いを知る入口かもしれません。`,
          },
        ]
      : []
  return {
    title: '今日の二人へ',
    sharedValues: context.answers.map((ans) => firstClause(ans.text)).filter((s) => s.length > 0),
    meaningfulDifferences: differences,
    reflection: `「${context.question.text}」という問いに、二人とも自分の言葉で向き合いました。${
      a ? `${a.name}さんは「${firstClause(a.text)}」と答え、` : ''
    }${b ? `${b.name}さんは「${firstClause(b.text)}」と答えています。` : ''}どちらの答えにも、相手を大切に思う気持ちが表れている可能性があります。`,
    conversationQuestion:
      CONVERSATION_QUESTIONS[seededIndex(seed, CONVERSATION_QUESTIONS.length)],
    microAction: MICRO_ACTIONS[seededIndex(`${seed}:action`, MICRO_ACTIONS.length)],
    confidence: 'medium',
    safetyLevel: context.safetyLevel,
  }
}

function buildRepairInsight(context: MockRepairContext): RepairInsight {
  if (context.safetyLevel === 'urgent') {
    return {
      neutralSummary:
        'いただいた内容には、通常の話し合いよりも先に、あなた自身の安全を確認したい状況が含まれているようです。',
      emotions: ['恐れ', '不安'],
      underlyingNeeds: ['安全', '安心できる環境'],
      sharedGoal: null,
      misunderstandingPattern: null,
      conversationSteps: [],
      suggestedPhrases: [],
      microAction: null,
      safetyLevel: 'urgent',
      safetyMessage:
        '無理に話し合いを続ける必要はありません。信頼できる人や専門の相談窓口に頼ってください。この内容がパートナーへ自動で共有されることはありません。',
      shouldPauseMediation: true,
    }
  }
  const names = [...new Set(context.entries.map((e) => e.name))]
  const feelings = context.entries
    .filter((e) => e.promptId === 'rp-02')
    .map((e) => firstClause(e.text))
    .filter(Boolean)
  return {
    neutralSummary: `${names.join('さんと')}さんは、それぞれの視点から出来事を振り返りました。お互いに「わかってほしい」という気持ちがあるのかもしれません。`,
    emotions: feelings.length > 0 ? feelings : ['すれ違いによる戸惑い'],
    underlyingNeeds: ['理解されること', '安心して話せること'],
    sharedGoal: '二人が安心して気持ちを伝え合える関係に戻ること',
    misunderstandingPattern:
      '事実そのものより、受け取り方のタイミングや言葉の選び方で、気持ちがすれ違った可能性があります。',
    conversationSteps: [
      'まず、お互いの「一番つらかったこと」を、遮らずに聞き合う',
      '次に、「本当はどうしてほしかったか」を一つずつ共有する',
      '最後に、次に同じことが起きたときの小さな合図を決める',
    ],
    suggestedPhrases: [
      '「責めたいわけじゃなくて、わかってほしかった」',
      '「あのとき、本当は〜してほしかった」',
    ],
    microAction: '今日はどちらかが「聞き役の10分」をプレゼントしてみましょう。',
    safetyLevel: context.safetyLevel,
    safetyMessage: null,
    shouldPauseMediation: false,
  }
}

function buildWeeklySummary(context: MockWeeklyContext): WeeklySummary {
  return {
    headline: '今週も、二人の言葉が積み重なりました',
    appreciation: context.weeks.flatMap((w) => w.highlights.map((h) => firstClause(h))).slice(0, 4),
    gentleNote: null,
    nextWeekSuggestion: '来週は「二人でしたいこと」から、ひとつだけ予定にしてみましょう。',
    safetyLevel: context.safetyLevel,
  }
}

export function createMockProvider(): AiProvider {
  return {
    name: 'mock',
    model: 'mock-love-interpreter-v1',
    async generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
      if (containsErrorMarker(request.context)) {
        throw new Error('mock provider: forced failure marker present')
      }
      let object: unknown
      switch (request.kind) {
        case 'daily_insight':
          object = buildDailyInsight(request.context as MockDailyContext)
          break
        case 'repair_insight':
          object = buildRepairInsight(request.context as MockRepairContext)
          break
        case 'weekly_summary':
          object = buildWeeklySummary(request.context as MockWeeklyContext)
          break
        case 'relationship_manual':
          object = []
          break
      }
      const parsed = request.schema.parse(object)
      return { object: parsed, model: 'mock-love-interpreter-v1', inputTokens: 0, outputTokens: 0 }
    },
  }
}
