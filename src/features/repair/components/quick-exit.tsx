'use client'

import { Button } from '@/components/ui/button'

/**
 * "すぐに閉じる" (spec §4-5, §19): replaces the current history entry with a
 * neutral site so the sensitive screen doesn't linger in back navigation.
 */
export function QuickExit() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        window.location.replace('https://www.yahoo.co.jp/')
      }}
    >
      すぐに閉じる
    </Button>
  )
}
