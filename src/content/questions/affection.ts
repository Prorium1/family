import { defineQuestions } from './helpers'

/** 愛情表現の質問：10問（spec §34） */
export const affectionQuestions = defineQuestions(
  { packId: 'pack-affection', idPrefix: 'affe', category: 'affection' },
  [
    { text: 'どんなとき、相手からの愛情を一番感じる？' },
    {
      text: '愛情を受け取るなら、どれが一番うれしい？',
      format: 'single_choice',
      options: ['言葉で伝えてもらう', '一緒に時間を過ごす', 'ちょっとした贈り物', '手助けしてもらう', 'スキンシップ'],
    },
    { text: '自分が愛情を表すとき、つい選びがちな方法は？' },
    { text: '忙しいとき、どんな支え方をしてもらえると嬉しい？', category: 'work' },
    { text: '落ち込んでいるとき、どう接してもらえると安心する？', category: 'anxiety', sensitivity: 1 },
    { text: '相手に「もっとこうしてほしい」と言えていない小さな願いはある？', sensitivity: 1 },
    { text: '二人のスキンシップについて、今の頻度をどう感じている？', format: 'scale_5', category: 'intimacy', sensitivity: 2 },
    { text: '記念日や誕生日は、どのくらい大切にしたい？', format: 'scale_5' },
    { text: '人前での愛情表現は、どこまでが心地いい？', sensitivity: 1 },
    { text: '最近、相手を「かわいいな」「素敵だな」と思った瞬間は？' },
  ],
)
