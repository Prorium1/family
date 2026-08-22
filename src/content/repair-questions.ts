/** Repair Mode の7つの問い（spec §12, §34） */
export interface RepairPrompt {
  id: string
  text: string
  helper?: string
}

export const repairPrompts: RepairPrompt[] = [
  { id: 'rp-01', text: '何が起きましたか？', helper: '事実を、思い出せる範囲で構いません。' },
  { id: 'rp-02', text: 'そのとき、何を感じましたか？' },
  { id: 'rp-03', text: '一番つらかったのは何ですか？' },
  { id: 'rp-04', text: '本当は、どうしてほしかったですか？' },
  { id: 'rp-05', text: '相手を責めずに伝えるとしたら、どう言いますか？' },
  { id: 'rp-06', text: '自分にも変えられる部分はありますか？' },
  { id: 'rp-07', text: '二人として、どうなりたいですか？' },
]
