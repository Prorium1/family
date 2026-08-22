/**
 * 地域別の相談窓口（spec §4-5, §19）。regionキーで拡張できる構造。
 * 高リスク検知時に表示され、パートナーへは決して自動通知されない。
 */
export interface SafetyResource {
  name: string
  contact: string
  description: string
  urgent: boolean
}

export const safetyResources: Record<string, SafetyResource[]> = {
  JP: [
    {
      name: '警察（緊急）',
      contact: '110',
      description: '身の危険を感じるとき、今すぐ助けが必要なとき',
      urgent: true,
    },
    {
      name: '救急（緊急）',
      contact: '119',
      description: 'けがや体調の急変があるとき',
      urgent: true,
    },
    {
      name: 'DV相談ナビ',
      contact: '#8008',
      description: 'パートナーからの暴力に関する相談（最寄りの相談窓口につながります）',
      urgent: false,
    },
    {
      name: 'DV相談＋（プラス）',
      contact: '0120-279-889',
      description: '24時間対応。電話・メール・チャットで相談できます',
      urgent: false,
    },
    {
      name: 'よりそいホットライン',
      contact: '0120-279-338',
      description: 'どんな悩みでも、24時間通話料無料で相談できます',
      urgent: false,
    },
    {
      name: 'いのちの電話',
      contact: '0570-783-556',
      description: 'つらい気持ち、消えてしまいたい気持ちがあるとき',
      urgent: false,
    },
    {
      name: '児童相談所 虐待対応ダイヤル',
      contact: '189',
      description: '子どもへの虐待が心配なとき',
      urgent: false,
    },
  ],
}

export function getSafetyResources(region: string): SafetyResource[] {
  return safetyResources[region] ?? safetyResources.JP
}
