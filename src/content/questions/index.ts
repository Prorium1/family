import type { Question, QuestionPack } from '@/types/entities'
import { dailyQuestions } from './daily'
import { gratitudeQuestions } from './gratitude'
import { affectionQuestions } from './affection'
import { workFamilyQuestions } from './work-family'
import { moneyQuestions } from './money'
import { premarriageQuestions } from './premarriage'
import { futureQuestions } from './future'
import { journeyExtraQuestions } from './journey-extra'

export const questionPacks: QuestionPack[] = [
  { id: 'pack-daily', slug: 'daily', title: '毎日の質問', description: '3〜5分で答えられる、日々の対話のきっかけ', active: true },
  { id: 'pack-gratitude', slug: 'gratitude', title: '感謝', description: '伝えそびれた「ありがとう」を言葉にする', active: true },
  { id: 'pack-affection', slug: 'affection', title: '愛情表現', description: '愛の伝え方と受け取り方を知る', active: true },
  { id: 'pack-work-family', slug: 'work-family', title: '仕事と家庭', description: '働き方と暮らしのバランスを話す', active: true },
  { id: 'pack-money', slug: 'money', title: 'お金', description: '価値観のすれ違いが起きやすいお金の話を、安心して', active: true },
  { id: 'pack-premarriage', slug: 'premarriage', title: '結婚前に話す30の質問', description: '結婚前に向き合っておきたい30のテーマ', active: true },
  { id: 'pack-future', slug: 'future', title: '二人の未来', description: '人生設計を二人で描くための質問', active: true },
  { id: 'pack-journey-extra', slug: 'journey-extra', title: 'Journey専用質問', description: '各Journeyの専用ステップ', active: true },
]

export const allQuestions: Question[] = [
  ...dailyQuestions,
  ...gratitudeQuestions,
  ...affectionQuestions,
  ...workFamilyQuestions,
  ...moneyQuestions,
  ...premarriageQuestions,
  ...futureQuestions,
  ...journeyExtraQuestions,
]

const byId = new Map(allQuestions.map((q) => [q.id, q]))

export function getQuestionById(id: string): Question | undefined {
  return byId.get(id)
}

export {
  dailyQuestions,
  gratitudeQuestions,
  affectionQuestions,
  workFamilyQuestions,
  moneyQuestions,
  premarriageQuestions,
  futureQuestions,
  journeyExtraQuestions,
}
