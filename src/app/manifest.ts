import type { MetadataRoute } from 'next'
import { appConfig } from '@/config/app'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.name,
    short_name: appConfig.name,
    description: appConfig.tagline,
    lang: appConfig.defaultLocale,
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: '#fbfafd',
    theme_color: '#fbfafd',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
