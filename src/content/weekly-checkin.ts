/** Weekly Check-in：5問（spec §24, §34） */
export interface WeeklyQuestion {
  id: string
  text: string
}

export const weeklyCheckinQuestions: WeeklyQuestion[] = [
  { id: 'wk-01', text: '今週、嬉しかったことは？' },
  { id: 'wk-02', text: '相手に感謝したいことは？' },
  { id: 'wk-03', text: '少し寂しかったこと・気になったことは？' },
  { id: 'wk-04', text: '来週、助けてほしいことは？' },
  { id: 'wk-05', text: '来週、二人でしたいことは？' },
]
