import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest (rather than the default generateSW) lets us own
      // src/sw.js directly, which is what handles incoming Web Push events
      // and notification clicks -- generateSW's auto-built service worker
      // has no hook for that.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}']
      },
      registerType: 'autoUpdate',
      includeAssets: ['images/*.jpg', 'images/*.jpeg'],
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: "Toyo's Pot",
        short_name: "Toyo's Pot",
        description: 'Homemade Nigerian meals, ordered in minutes.',
        theme_color: '#E1481F',
        background_color: '#FFF8F1',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  server: {
    port: 5173
  }
})
