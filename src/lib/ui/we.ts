import type { WeEntryKind } from '@/types/domain'

/**
 * NEW WE vocabulary (docs/BRAND.md §0.2). One module owns these labels so the
 * four kinds read the same on every surface.
 */
export const WE_KIND_LABELS: Record<WeEntryKind, { label: string; hint: string }> = {
  discovery: { label: '知ったこと', hint: '相手について、新しく知った価値観' },
  answer: { label: '二人の答え', hint: 'どちらでもない、二人だけの第三の答え' },
  promise: { label: '約束', hint: '二人で決めたこと' },
  future: { label: '未来', hint: '二人で見つけた、これからの姿' },
}

export const WE_KIND_ORDER: WeEntryKind[] = ['answer', 'discovery', 'promise', 'future']
