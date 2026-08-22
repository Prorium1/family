import { defineConfig, devices } from '@playwright/test'

// The sandbox pre-installs Chromium at a pinned path; a version-mismatched
// @playwright/test would otherwise try to download its own build.
const CHROMIUM_PATH = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'

const PORT = Number(process.env.PORT ?? 3100)
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './src/tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The demo store is shared server state — specs reset it, so one worker.
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], launchOptions: { executablePath: CHROMIUM_PATH } },
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: CHROMIUM_PATH } },
      testMatch: ['pairing.spec.ts', 'pwa.spec.ts'],
    },
  ],
  webServer: {
    command: `pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_DEMO_MODE: 'true',
      AI_MOCK_MODE: 'true',
      DEMO_STORE_PERSIST: 'false',
    },
  },
})
