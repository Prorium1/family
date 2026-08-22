import { defineQuestions } from './helpers'

/**
 * Journey専用の追加質問。既存パックにない切り口だけをここに置き、
 * それ以外のJourneyステップは既存の質問IDを参照する。
 */
export const journeyExtraQuestions = defineQuestions(
  {
    packId: 'pack-journey-extra',
    idPrefix: 'jrny',
    category: 'personality',
    defaults: { estimatedMinutes: 4 },
  },
  [
    // 恋人として深く知る
    { text: '不安になりやすいのは、どんな状況？', category: 'anxiety', sensitivity: 1 },
    { text: '今、いちばん応援してほしいことは？', category: 'dreams' },
    // 同棲準備
    { text: '平日の生活リズム（起床・就寝・食事）はどんな感じ？', category: 'living' },
    { text: '衛生感覚で「これだけは譲れない」ことは？', category: 'living', sensitivity: 1 },
    { text: '友人や家族を家に呼ぶ頻度は、どのくらいが心地いい？', category: 'living' },
    { text: '睡眠環境（温度・明るさ・音）のこだわりは？', category: 'health' },
    { text: '食事のスタイル（自炊・外食・好き嫌い）について共有したいことは？', category: 'health' },
    { text: '生活費の分担は、同棲ではどうしたい？', category: 'money', sensitivity: 1 },
    { text: 'もし同棲を解消することになった場合のルールを、先に決めるなら？', category: 'living', sensitivity: 2, difficulty: 3 },
    // 新婚
    { text: '結婚して最初の1年で、二人の習慣にしたいことは？', category: 'marriage' },
    { text: '家庭内での役割は、どう分けると心地よさそう？', category: 'housework' },
    { text: '二人の記念日は、どう祝いたい？', category: 'affection' },
    // 妊娠・出産準備
    { text: '子どもを望む気持ちについて、今の率直な温度感は？', category: 'children', sensitivity: 3, difficulty: 3 },
    { text: '妊娠・出産の医療やサポートについて、調べておきたいことは？', category: 'children', sensitivity: 2 },
    { text: '出産前後の仕事と育休について、どんな形が理想？', category: 'parenting', sensitivity: 2 },
    { text: '夜間対応や家事の分担は、産後どうしたい？', category: 'parenting', sensitivity: 2 },
    { text: '両親や周囲のサポートは、どのくらい頼りたい？', category: 'parents_family', sensitivity: 2 },
  ],
)
