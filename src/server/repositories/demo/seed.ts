import type { DemoStore } from './store'

export const DEMO_USER_IDS = {
  a: 'demo-user-a',
  b: 'demo-user-b',
  c: 'demo-user-c',
  admin: 'demo-user-admin',
} as const

/**
 * Fresh demo world: four blank accounts, no couple yet — the walkthrough
 * registers them live, so nobody is handed a ready-made identity. Names and
 * gender are whatever the visitor types. User C exists to prove third-party
 * isolation (§37); the admin persona only sees the admin surface.
 */
export function buildSeedStore(): DemoStore {
  const t = new Date().toISOString()
  return {
    version: 1,
    profiles: [
      {
        id: DEMO_USER_IDS.a,
        displayName: '',
        email: 'demo-a@example.com',
        gender: null,
        locale: 'ja',
        timezone: 'Asia/Tokyo',
        ageConfirmed: true,
        isAdmin: false,
        createdAt: t,
        updatedAt: t,
      },
      {
        id: DEMO_USER_IDS.b,
        displayName: '',
        email: 'demo-b@example.com',
        gender: null,
        locale: 'ja',
        timezone: 'Asia/Tokyo',
        ageConfirmed: true,
        isAdmin: false,
        createdAt: t,
        updatedAt: t,
      },
      {
        id: DEMO_USER_IDS.c,
        displayName: '',
        email: 'demo-c@example.com',
        gender: null,
        locale: 'ja',
        timezone: 'Asia/Tokyo',
        ageConfirmed: true,
        isAdmin: false,
        createdAt: t,
        updatedAt: t,
      },
      {
        id: DEMO_USER_IDS.admin,
        displayName: '管理者',
        email: 'admin@example.com',
        gender: null,
        locale: 'ja',
        timezone: 'Asia/Tokyo',
        ageConfirmed: true,
        isAdmin: true,
        createdAt: t,
        updatedAt: t,
      },
    ],
    couples: [],
    coupleMembers: [],
    invitations: [],
    assignments: [],
    answers: [],
    answerRevisions: [],
    insights: [],
    journeyProgress: [],
    checkins: [],
    checkinAnswers: [],
    repairSessions: [],
    repairEntries: [],
    repairInsights: [],
    repairAgreements: [],
    agreements: [],
    weEntries: [],
    agreementRevisions: [],
    timeline: [],
    manualItems: [],
    notificationPreferences: [],
    consents: [],
    dataRequests: [],
    safetyEvents: [],
    aiLogs: [],
    analyticsEvents: [],
  }
}
