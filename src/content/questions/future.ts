import { defineQuestions } from './helpers'

/** 二人の未来：20問（spec §34）。未来ページの5カテゴリに対応。 */
export const futureQuestions = defineQuestions(
  {
    packId: 'pack-future',
    idPrefix: 'futu',
    category: 'dreams',
    defaults: { difficulty: 2, estimatedMinutes: 4 },
  },
  [
    { text: '結婚の時期について、今のイメージは？', category: 'marriage', sensitivity: 1 },
    { text: '入籍や法的な手続きについて、確認しておきたいことは？', category: 'marriage', sensitivity: 1 },
    { text: '二人の生活の拠点は、これからどこに置きたい？', category: 'living' },
    { text: '共通口座を作るなら、何に使う口座にしたい？', category: 'money', sensitivity: 1 },
    { text: '住宅は、賃貸と購入どちらに気持ちが向いている？', format: 'binary', options: ['賃貸がいい', '購入したい'], category: 'living', sensitivity: 1 },
    { text: '保険について、備えたいリスクは？', category: 'money', sensitivity: 1 },
    { text: '家族が増えるとしたら、どんな家庭にしたい？', category: 'children', sensitivity: 2 },
    { text: '出産や育児で、今から知っておきたい・調べたいことは？', category: 'parenting', sensitivity: 2 },
    { text: '家族の行事や記念日で、毎年続けたいものは？', category: 'parents_family' },
    { text: 'キャリアの中で、これから挑戦したいことは？', category: 'work' },
    { text: '起業や独立への興味は？', format: 'scale_5', category: 'work', sensitivity: 1 },
    { text: '海外で暮らすことになったら、どう感じる？', category: 'work', sensitivity: 1 },
    { text: '忙しい時期が続くとき、二人で決めておきたいルールは？', category: 'work' },
    { text: '育休は、どんな取り方が理想？', category: 'parenting', sensitivity: 2 },
    { text: '二人で実現したい夢をひとつ挙げるなら？' },
    { text: '一緒に行きたい旅行先は？' },
    { text: 'いつか住んでみたい場所は？', category: 'living' },
    { text: '社会や誰かのために、二人でできたらいいなと思うことは？', category: 'life_values' },
    { text: '老後の理想の一日を思い描くなら？', category: 'later_life' },
    { text: '人生の最終イメージ：ずっと先の未来、二人はどんな関係でいたい？', category: 'life_values', difficulty: 3 },
  ],
)
