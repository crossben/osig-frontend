import type { MetadataRoute } from 'next';

// Installable app (Add to Home Screen) with its own window and icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OSIG',
    short_name: 'OSIG',
    description: 'Check links and messages for scams, and watch your own email, phone and accounts for exposure.',
    start_url: '/#/footprint',
    scope: '/',
    display: 'standalone',
    background_color: '#E9EDF2',
    theme_color: '#13233F',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Check a link or message', url: '/#/check' },
      { name: 'My footprint', url: '/#/footprint' },
    ],
  };
}
