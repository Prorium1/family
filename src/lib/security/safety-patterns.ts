import type { SafetyCategory, SafetyLevel } from '@/types/domain'

export interface SafetyPattern {
  category: SafetyCategory
  level: Exclude<SafetyLevel, 'none'>
  patterns: RegExp[]
}

/**
 * Rule-based detection table (JA + EN) for spec §19. Patterns intentionally
 * favor recall on urgent categories; `needs_support` categories favor
 * precision to avoid over-triggering on ordinary couple friction.
 * Input is NFKC-normalized and lowercased before matching.
 */
export const safetyPatterns: SafetyPattern[] = [
  {
    category: 'violence',
    level: 'urgent',
    patterns: [
      /殴られ|蹴られ|叩かれ|突き飛ばされ|首を絞め|暴力を(振|ふ)るわれ/,
      /(彼|彼女|夫|妻|パートナー|相手)(に|から).{0,8}(殴|蹴|叩)/,
      /(hits? me|beats? me|hurt me physically|physically abus)/,
    ],
  },
  {
    category: 'threat',
    level: 'urgent',
    patterns: [
      /殺すと(言|い)われ|殺されそう|脅され|脅迫され/,
      /(threatens? (to )?(kill|hurt)|death threat)/,
    ],
  },
  {
    category: 'homicidal_threat',
    level: 'urgent',
    patterns: [/(相手|彼|彼女|夫|妻)を殺し(たい|てやる)|ぶっ殺す/, /(i('| a)?m going to|i will|want to) kill (him|her|them|my)/],
  },
  {
    category: 'sexual_coercion',
    level: 'urgent',
    patterns: [
      /性行為を強要|無理やり(触|さ|迫)|同意なく.{0,6}(触|関係)|嫌がっても(やめ|止め)て/,
      /(forc(es|ed|ing) me (in)?to (sex|it)|sexual(ly)? (coerc|assault))/,
    ],
  },
  {
    category: 'stalking',
    level: 'urgent',
    patterns: [/つきまとわれ|後をつけられ|待ち伏せされ|ストーカー/, /(stalks? me|follows? me everywhere)/],
  },
  {
    category: 'surveillance',
    level: 'needs_support',
    patterns: [
      /(位置情報|gps).{0,10}(監視|追跡|勝手に)|盗聴|盗撮|スマホを勝手に(見|チェック)|パスワードを(要求|強要)され/,
      /(tracks? my (phone|location)|reads? my messages without)/,
    ],
  },
  {
    category: 'financial_control',
    level: 'needs_support',
    patterns: [
      /(お金|通帳|カード|給料)を(全部)?(取り上げ|管理され|渡してもらえ|握られ)|お金を(使わせて|自由に)もらえない/,
      /(controls? (all )?(the |my )?money|won'?t let me spend)/,
    ],
  },
  {
    category: 'self_harm',
    level: 'urgent',
    patterns: [/自傷|リストカット|自分を(傷つけ|切っ)/, /(cut(ting)? myself|self[- ]harm)/],
  },
  {
    category: 'suicide',
    level: 'urgent',
    patterns: [
      /死にたい|消えたい|自殺|命を絶ち|生きて(いて|る)?(も)?(意味|価値)が?ない/,
      /(want to die|kill myself|suicid|end my life)/,
    ],
  },
  {
    category: 'minor',
    level: 'urgent',
    patterns: [/(私|僕|わたし|ぼく)は?1[0-7]歳|未成年です/, /i('| a)?m (1[0-7]|a minor)\b/],
  },
  {
    category: 'personal_data_leak',
    level: 'needs_support',
    patterns: [
      /\b\d{3}-?\d{4}-?\d{4}\b.{0,12}(電話|携帯|number)/,
      /(マイナンバー|クレジットカード番号)[はを:：]?\s*\d/,
    ],
  },
  {
    category: 'secret_leak',
    level: 'needs_support',
    patterns: [/\bsk-[a-z0-9-]{16,}/i, /\bAKIA[0-9A-Z]{16}\b/, /api[_-]?key\s*[=:]\s*['"a-z0-9]{12,}/i, /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  },
  {
    category: 'prompt_injection',
    level: 'needs_support',
    patterns: [
      /(これまで|以前|上記)の(指示|命令|プロンプト)を(無視|忘れ)/,
      /システムプロンプト(を|の)(表示|開示|教え)/,
      /(ignore|disregard) (all )?(previous|prior|above) (instructions|prompts)/,
      /reveal (your )?(system )?prompt/,
    ],
  },
  {
    category: 'role_override',
    level: 'needs_support',
    patterns: [
      /あなたは今から.{0,20}(として|になり)|役割を変更|制限を解除|開発者モード/,
      /(you are now|act as|pretend to be) (a|an|the)?\s*(?!love)/i,
      /jailbreak|dan mode|developer mode/,
    ],
  },
  {
    category: 'cross_user_data_request',
    level: 'needs_support',
    patterns: [
      /(他の|別の)(カップル|ユーザー)の.{0,12}(見せ|教え|取得)/,
      /(show|give) me (other|another) (user|couple)('s)? (data|answers)/,
    ],
  },
]
