import { defineQuestions } from './helpers'

/**
 * 結婚前に話す30の質問（spec §34）。「結婚前に話す30の質問」Journeyの本体。
 * センシティブな話題ほど後半に置き、段階的に深まる構成。
 */
export const premarriageQuestions = defineQuestions(
  {
    packId: 'pack-premarriage',
    idPrefix: 'prem',
    category: 'marriage',
    defaults: { difficulty: 2, estimatedMinutes: 5, sensitivity: 1 },
  },
  [
    { text: 'あなたにとって「幸せな人生」とは、どんな状態？', category: 'life_values', sensitivity: 0 },
    { text: '結婚することで、人生がどう変わってほしい？', sensitivity: 0 },
    { text: '結婚後も大切にし続けたい、自分の習慣や時間は？', sensitivity: 0 },
    { text: '仕事と家庭の理想のバランスは？', category: 'work' },
    { text: '結婚後の働き方について、今の考えは？', category: 'work' },
    { text: '二人の生活費は、どう分担したい？', category: 'money' },
    { text: '貯金の目標や、お金の優先順位について考えは？', category: 'money' },
    { text: '借金やローンについて、伝えておきたいこと・確認したいことは？', category: 'money', sensitivity: 2 },
    { text: '住みたい場所や住環境の希望は？', category: 'living' },
    { text: '実家との距離感は、どのくらいが心地いい？', category: 'parents_family' },
    { text: '子どもについて、今の率直な気持ちは？', category: 'children', sensitivity: 2 },
    { text: 'もし子どもを育てるなら、大切にしたい教育観は？', category: 'parenting', sensitivity: 2 },
    { text: '子どもを持つ・持たないの考えが変わったとき、どう話し合いたい？', category: 'children', sensitivity: 2 },
    { text: '家事の分担は、どんな形が理想？', category: 'housework' },
    { text: '苦手な家事・得意な家事は？', category: 'housework', sensitivity: 0 },
    { text: 'お互いの両親との付き合い方について、希望は？', category: 'parents_family' },
    { text: '親の介護が必要になったら、どう向き合いたい？', category: 'parents_family', sensitivity: 2, difficulty: 3 },
    { text: '親族の行事（お盆・正月など）は、どう過ごしたい？', category: 'parents_family' },
    { text: '夫婦の苗字について、考えや希望はある？', sensitivity: 2 },
    { text: '結婚式は、どんな形にしたい？（しない選択も含めて）', sensitivity: 1 },
    { text: '喧嘩をしたときの「二人のルール」を作るなら？', category: 'conflict' },
    { text: '不満を感じたとき、どう伝えてもらえると受け取りやすい？', category: 'conflict' },
    { text: '一人の時間は、週にどのくらい必要？', category: 'personality', sensitivity: 0 },
    { text: '大きな困難が起きたとき、どんな二人でいたい？', category: 'life_values' },
    { text: '病気やけがのとき、どう支え合いたい？', category: 'health' },
    { text: 'お互いの友人関係について、大切にしたいことは？', sensitivity: 0 },
    { text: '10年後、どんな毎日を二人で過ごしていたい？', category: 'dreams', sensitivity: 0 },
    { text: '老後は、どんなふうに暮らしていたい？', category: 'later_life' },
    { text: '相手に「これだけは変わらないでほしい」と思うところは？', category: 'affection', sensitivity: 0 },
    {
      text: '二人の結婚宣言：結婚する二人として、大切にしたいことを一文にすると？',
      helper: 'この回答は「ふたりページ」に、二人の結婚宣言として記録できます。',
      difficulty: 3,
    },
  ],
)
