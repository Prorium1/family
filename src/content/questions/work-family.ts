import { defineQuestions } from './helpers'

/** 仕事と家庭：10問（spec §34） */
export const workFamilyQuestions = defineQuestions(
  { packId: 'pack-work-family', idPrefix: 'work', category: 'work', defaults: { difficulty: 2 } },
  [
    { text: '今の仕事の好きなところと、大変なところは？' },
    { text: '仕事が忙しい時期、家庭とのバランスはどうありたい？' },
    { text: '帰宅後の30分、どう過ごせると一番回復できる？', category: 'health' },
    { text: '仕事の悩みは、相手にどのくらい話したい？', format: 'scale_5' },
    { text: '相手の仕事について、もっと知りたいことは？' },
    { text: '転勤や転職の可能性について、今の考えは？', sensitivity: 1 },
    { text: '「頑張りすぎているな」と相手に感じたら、どうしてほしい？' },
    { text: '家庭内の役割分担は、今どのくらい納得感がある？', format: 'scale_5', category: 'housework' },
    { text: '平日の夜、二人の時間はどのくらい持てると理想的？' },
    { text: '10年後、どんな働き方をしていたい？', category: 'dreams' },
  ],
)
