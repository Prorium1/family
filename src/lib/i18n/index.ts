import type { LocaleCode } from '@/types/domain'
import { ja, type Messages } from './messages/ja'
import { en } from './messages/en'

const catalogs: Record<LocaleCode, Messages> = { ja, en }

export function getMessages(locale: LocaleCode = 'ja'): Messages {
  return catalogs[locale] ?? ja
}

/** Tiny interpolation helper: fill('こんにちは、{name}さん', {name: '陽菜'}) */
export function fill(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in params ? String(params[key]) : `{${key}}`,
  )
}

export type { Messages }
