import type { Metadata, Viewport } from 'next'
import './globals.css'
import { appConfig } from '@/config/app'
import { ServiceWorkerRegister } from '@/components/shared/sw-register'

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.tagline,
  applicationName: appConfig.name,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: appConfig.name,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf6ef' },
    { media: '(prefers-color-scheme: dark)', color: '#16181f' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang={appConfig.defaultLocale} className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-text">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
