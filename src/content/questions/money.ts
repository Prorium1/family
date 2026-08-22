import { defineQuestions } from './helpers'

/** お金：10問（spec §34） */
export const moneyQuestions = defineQuestions(
  { packId: 'pack-money', idPrefix: 'mone', category: 'money', defaults: { difficulty: 2, sensitivity: 1 } },
  [
    { text: 'お金を使ってよかったと思うのは、どんなこと？', sensitivity: 0 },
    { text: '節約したいところと、ここは削りたくないところは？' },
    { text: '毎月の貯金は、どのくらいを目安にしたい？' },
    { text: '大きな買い物をするとき、いくら以上なら相談したい？' },
    { text: 'お金の管理は、どんな形が心地いい？', format: 'single_choice', options: ['完全に一緒', '共通口座＋個人口座', '完全に別々', 'まだわからない'] },
    { text: '自由に使えるお小遣いは、どのくらい必要？', sensitivity: 1 },
    { text: 'ご祝儀や親戚づきあいの出費について、考え方は？', category: 'parents_family' },
    { text: '投資や資産運用への興味は？', format: 'scale_5' },
    { text: '将来に向けた大きな出費（住宅・車など）で、優先したいものは？', format: 'ranking', options: ['住まい', '車', '旅行', '教育', '老後資金'] },
    { text: 'お金の話をすること自体、どのくらい気軽にできている？', format: 'scale_5' },
  ],
)
