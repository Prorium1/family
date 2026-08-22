import { defineQuestions } from './helpers'

/** 感謝の質問：10問（spec §34） */
export const gratitudeQuestions = defineQuestions(
  { packId: 'pack-gratitude', idPrefix: 'grat', category: 'gratitude' },
  [
    { text: '最近、相手に一番感謝したことは？' },
    { text: '相手が当たり前のようにしてくれていて、実はありがたいことは？' },
    { text: '今週、相手に助けられたと感じた場面は？' },
    { text: '付き合い始めた頃に、相手にもらって嬉しかった言葉は？' },
    { text: '相手のどんな気づかいに、支えられている？' },
    { text: '「ありがとう」を伝えるなら、言葉と行動どちらが自分らしい？', format: 'binary', options: ['言葉で伝える', '行動で伝える'] },
    { text: '相手の家族や友人に、感謝していることはある？', category: 'parents_family', sensitivity: 1 },
    { text: '自分の変化の中で、相手のおかげだと思うことは？' },
    { text: 'ここ1ヶ月で、相手に感謝を伝えられた回数は自分でどう感じる?', format: 'scale_5' },
    { text: '今日、相手へ短い感謝のメッセージを書くとしたら？' },
  ],
)
