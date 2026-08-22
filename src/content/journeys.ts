import type { Journey, JourneyStep } from '@/types/entities'

/**
 * 初期Journey 5本（spec §11）。ステップは質問IDを参照する。
 * 管理画面から追加・編集・停止できる前提のデータ構造。
 */
export const journeys: Journey[] = [
  {
    id: 'journey-know-deeper',
    slug: 'know-deeper',
    title: '恋人として深く知る',
    description: '愛情の感じ方、一人の時間、不安になりやすいこと。5ステップで、恋人としての理解を深める。',
    stageHint: ['dating', 'long_distance', 'cohabiting'],
    premium: false,
    active: true,
    order: 1,
  },
  {
    id: 'journey-premarriage-30',
    slug: 'premarriage-30',
    title: '結婚前に話す30の質問',
    description: 'お金、住まい、子ども、両親、喧嘩のルール。結婚前に向き合っておきたい30のテーマを、二人のペースで。',
    stageHint: ['considering_engagement', 'engaged', 'cohabiting'],
    premium: false,
    active: true,
    order: 2,
  },
  {
    id: 'journey-cohabit-prep',
    slug: 'cohabit-prep',
    title: '同棲準備',
    description: '生活リズム、家事、生活費、一人の時間。一緒に暮らす前にすり合わせたい9つのテーマ。',
    stageHint: ['dating', 'long_distance'],
    premium: true,
    active: true,
    order: 3,
  },
  {
    id: 'journey-newlywed',
    slug: 'newlywed',
    title: '新婚',
    description: '二人の習慣、親族との付き合い、家庭内の役割。新しい生活を心地よく始めるための7ステップ。',
    stageHint: ['married'],
    premium: true,
    active: true,
    order: 4,
  },
  {
    id: 'journey-baby-prep',
    slug: 'baby-prep',
    title: '妊娠・出産準備',
    description: '子どもを望む気持ちから、育休、夜間対応、サポート体制まで。焦らず、正直に話すための9ステップ。',
    stageHint: ['married', 'preparing_for_children'],
    premium: true,
    active: true,
    order: 5,
  },
]

function steps(journeyId: string, entries: Array<[title: string, questionId: string]>): JourneyStep[] {
  return entries.map(([title, questionId], i) => ({
    id: `${journeyId}-step-${String(i + 1).padStart(2, '0')}`,
    journeyId,
    order: i + 1,
    title,
    questionId,
  }))
}

export const journeySteps: JourneyStep[] = [
  ...steps('journey-know-deeper', [
    ['愛情を感じる瞬間', 'affe-01'],
    ['一人の時間', 'prem-23'],
    ['休日の過ごし方', 'daily-08'],
    ['不安になりやすいこと', 'jrny-01'],
    ['応援してほしいこと', 'jrny-02'],
  ]),
  ...steps(
    'journey-premarriage-30',
    Array.from({ length: 30 }, (_, i) => {
      const id = `prem-${String(i + 1).padStart(2, '0')}`
      const titles = [
        '幸せな人生', '結婚と人生', '守りたい習慣', '仕事と家庭', '結婚後の働き方',
        '生活費', '貯金とお金の優先順位', '借入の共有', '住む場所', '実家との距離感',
        '子どもへの気持ち', '教育観', '考えが変わったとき', '家事分担', '得意な家事・苦手な家事',
        '両親との付き合い', '介護', '親族の行事', '苗字', '結婚式',
        '喧嘩のルール', '不満の伝え方', '一人の時間', '困難への向き合い方', '病気のときの支え合い',
        '友人関係', '10年後の毎日', '老後', '変わらないでほしいところ', '二人の結婚宣言',
      ]
      return [titles[i], id] as [string, string]
    }),
  ),
  ...steps('journey-cohabit-prep', [
    ['生活リズム', 'jrny-03'],
    ['家事', 'prem-14'],
    ['生活費', 'jrny-08'],
    ['一人の時間', 'prem-23'],
    ['来客', 'jrny-05'],
    ['衛生感覚', 'jrny-04'],
    ['睡眠', 'jrny-06'],
    ['食事', 'jrny-07'],
    ['退去時のルール', 'jrny-09'],
  ]),
  ...steps('journey-newlywed', [
    ['二人の習慣', 'jrny-10'],
    ['親族との付き合い', 'prem-16'],
    ['記念日', 'jrny-12'],
    ['貯金', 'prem-07'],
    ['仕事', 'prem-05'],
    ['家庭内の役割', 'jrny-11'],
    ['将来計画', 'futu-15'],
  ]),
  ...steps('journey-baby-prep', [
    ['子どもを望むか', 'jrny-13'],
    ['時期', 'futu-07'],
    ['医療', 'jrny-14'],
    ['仕事', 'prem-04'],
    ['育休', 'jrny-15'],
    ['夜間対応', 'jrny-16'],
    ['家事', 'prem-14'],
    ['サポート体制', 'jrny-17'],
    ['教育観', 'prem-12'],
  ]),
]

export function getJourneyBySlug(slug: string): Journey | undefined {
  return journeys.find((j) => j.slug === slug)
}

export function getStepsForJourney(journeyId: string): JourneyStep[] {
  return journeySteps.filter((s) => s.journeyId === journeyId).sort((a, b) => a.order - b.order)
}
