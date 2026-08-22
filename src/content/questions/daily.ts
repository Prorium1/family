import { defineQuestions } from './helpers'

/** 軽いDaily Question：20問（spec §34）。誘導せず、罪悪感を与えない中立的な文。 */
export const dailyQuestions = defineQuestions(
  { packId: 'pack-daily', idPrefix: 'daily', category: 'daily' },
  [
    { text: '一緒にいると安心するのは、どんなとき？' },
    { text: '最近、二人で笑ったのはどんな瞬間だった？' },
    { text: '今日をひとことで表すと、どんな一日だった？' },
    { text: '相手と一緒に食べたい、今いちばんのごはんは？' },
    { text: '最近ハマっていることを、相手にひとつ紹介するなら？' },
    { text: '子どもの頃に好きだった遊びは何？', category: 'past' },
    { text: '今週、ちょっと頑張ったことは何？' },
    { text: '二人でのんびりするなら、家と外どっちが好き？', format: 'binary', options: ['家でのんびり', '外へ出かける'], category: 'weekend' },
    { text: '休みの日の理想の起床時間は？', category: 'weekend' },
    { text: '最近見た景色で、相手に見せたかったものは？' },
    { text: '相手の声や話し方で、好きなところは？', category: 'affection' },
    { text: '今の生活リズムに、どのくらい満足している?', format: 'scale_5', category: 'health' },
    { text: '疲れた日は、そっとしておいてほしい？それとも話を聞いてほしい？', format: 'binary', options: ['そっとしておいてほしい', '話を聞いてほしい'], category: 'personality' },
    { text: '二人で新しく始めてみたいことはある？', category: 'dreams' },
    { text: '最近「ありがとう」と言いそびれたことはある?', category: 'gratitude' },
    { text: '今日、相手に聞いてみたいことをひとつ挙げるなら？' },
    { text: '季節の中で、二人で過ごすのが一番好きな季節は？', format: 'single_choice', options: ['春', '夏', '秋', '冬'] },
    { text: '最近の小さな幸せは何だった？' },
    { text: '相手が隣にいてくれてよかった、と思った瞬間は？', category: 'affection' },
    { text: '明日が休みだったら、何をしたい？', category: 'weekend' },
  ],
)
