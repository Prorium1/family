import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { InsightCard } from '@/features/daily-questions/components/insight-card'
import { RevealPanel } from '@/features/daily-questions/components/reveal-panel'
import { SafetyPause } from '@/features/repair/components/safety-pause'
import { EmptyState } from '@/components/shared/empty-state'
import type { DailyInsight } from '@/lib/validation/ai-insight'

vi.mock('next/navigation', () => ({
  usePathname: () => '/home',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

const insight: DailyInsight = {
  title: '今日の二人へ',
  sharedValues: ['安心できる時間'],
  meaningfulDifferences: [
    { topic: '休日の過ごし方', neutralExplanation: '違いは悪いことではありません。' },
  ],
  reflection: '二人とも自分の言葉で向き合いました。',
  conversationQuestion: '相手の答えで意外だったところは？',
  microAction: { title: '感謝をひとこと', description: '今日の答えに触れて伝える', estimatedMinutes: 3 },
  confidence: 'medium',
  safetyLevel: 'none',
}

describe('InsightCard', () => {
  it('renders every structured section, without any score', () => {
    render(<InsightCard insight={insight} />)
    expect(screen.getByText('愛の通訳から、二人へのメッセージ')).toBeInTheDocument()
    expect(screen.getByText('今日の二人へ')).toBeInTheDocument()
    expect(screen.getByText('安心できる時間')).toBeInTheDocument()
    expect(screen.getByText('相手の答えで意外だったところは？')).toBeInTheDocument()
    expect(screen.getByText(/今日できる小さなこと（約3分）/)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/相性|\d+点/)
  })
})

describe('RevealPanel', () => {
  it('shows both revealed answers', () => {
    render(
      <RevealPanel
        mine={{
          userId: 'a',
          displayName: 'あかり',
          value: { kind: 'text', text: '私の答え' },
          submittedAt: null,
        }}
        partner={{
          userId: 'b',
          displayName: 'ゆうと',
          value: { kind: 'text', text: '相手の答え' },
          submittedAt: null,
        }}
      />,
    )
    expect(screen.getByText('二人の答えがそろいました')).toBeInTheDocument()
    expect(screen.getByText('私の答え')).toBeInTheDocument()
    expect(screen.getByText('相手の答え')).toBeInTheDocument()
  })

  it('renders scale values readably', () => {
    render(
      <RevealPanel
        mine={null}
        partner={{
          userId: 'b',
          displayName: 'ゆうと',
          value: { kind: 'scale', value: 4 },
          submittedAt: null,
        }}
      />,
    )
    expect(screen.getByText('5段階中 4')).toBeInTheDocument()
  })
})

describe('SafetyPause', () => {
  it('shows resources, quick exit, and the no-notification promise', () => {
    render(<SafetyPause />)
    expect(screen.getByText('まず、あなたの安全を大切にしてください')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'すぐに閉じる' })).toBeInTheDocument()
    expect(
      screen.getByText('この内容がパートナーへ自動で通知されることはありません。'),
    ).toBeInTheDocument()
    expect(screen.getByText('DV相談ナビ')).toBeInTheDocument()
    expect(screen.getByText('110')).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders title, body and action', () => {
    render(<EmptyState title="まだありません" body="これからです" action={<button>作る</button>} />)
    expect(screen.getByText('まだありません')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '作る' })).toBeInTheDocument()
  })
})
