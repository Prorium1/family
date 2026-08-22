/**
 * Demo accounts. They are blank on purpose: nobody is handed a ready-made
 * identity, so the walkthrough exercises the real registration — the visitor
 * types their own name and picks how they want to be described.
 *
 * A and B are the two sides of the couple; C is the third party the security
 * tests use; admin only sees the admin surface. The labels below name the
 * *role in the walkthrough*, never a person.
 * IDs mirror src/server/repositories/demo/seed.ts.
 */
export const DEMO_USERS = [
  { id: 'demo-user-a', key: 'a', label: '1人目' },
  { id: 'demo-user-b', key: 'b', label: '2人目' },
  { id: 'demo-user-c', key: 'c', label: '第三者' },
  { id: 'demo-user-admin', key: 'admin', label: '管理者' },
] as const

export type DemoUserKey = (typeof DEMO_USERS)[number]['key']

export const DEMO_COOKIE = 'family_demo_uid'

export function demoUserByKey(key: string) {
  return DEMO_USERS.find((u) => u.key === key) ?? null
}

export function demoUserById(id: string) {
  return DEMO_USERS.find((u) => u.id === id) ?? null
}
