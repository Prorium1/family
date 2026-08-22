/**
 * Demo personas. A and B are the couple in the walkthrough; C is the third
 * party used by security tests; admin only sees the admin surface.
 * IDs mirror src/server/repositories/demo/seed.ts.
 */
export const DEMO_USERS = [
  { id: 'demo-user-a', key: 'a', displayName: 'あかり' },
  { id: 'demo-user-b', key: 'b', displayName: 'ゆうと' },
  { id: 'demo-user-c', key: 'c', displayName: 'みなと' },
  { id: 'demo-user-admin', key: 'admin', displayName: '管理者' },
] as const

export type DemoUserKey = (typeof DEMO_USERS)[number]['key']

export const DEMO_COOKIE = 'family_demo_uid'

export function demoUserByKey(key: string) {
  return DEMO_USERS.find((u) => u.key === key) ?? null
}

export function demoUserById(id: string) {
  return DEMO_USERS.find((u) => u.id === id) ?? null
}
