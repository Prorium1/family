import type { DemoStore } from './store'

export const DEMO_USER_IDS = {
  a: 'demo-user-a',
  b: 'demo-user-b',
  c: 'demo-user-c',
  admin: 'demo-user-admin',
} as const

/**
 * Fresh demo world: four personas, no couple yet — pairing is exercised live
 * in the walkthrough. User C exists to prove third-party isolation (§37);
 * the admin persona only sees the admin surface.
 */
export function buildSeedStore(): DemoStore {
  const t = new Date().toISOString()
  return {
    version: 1,
    profiles: [
      {
        id: DEMO_USER_IDS.a,
        displayName: 'あかり',
        email: 'akari@example.com',
        locale: 'ja',
        timezone: 'Asia/Tokyo',
        ageConfirmed: true,
        isAdmin: false,
        createdAt: t,
        updatedAt: t,
      },
      {
        id: DEMO_USER_IDS.b,
        displayName: 'ゆうと',
        email: 'yuto@example.com',
        locale: 'ja',
        timezone: 'Asia/Tokyo',
        ageConfirmed: true,
        isAdmin: false,
        createdAt: t,
        updatedAt: t,
      },
      {
        id: DEMO_USER_IDS.c,
        displayName: 'みなと',
        email: 'minato@example.com',
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
