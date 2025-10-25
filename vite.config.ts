import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(() => {
  
  return {
    server: {
      proxy: {
        '/api': {
          target: 'https://mis.twse.com.tw/stock/api',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    plugins: [
      vue(),
      vuetify({
        autoImport: true
      }),
      VitePWA({
        registerType: 'prompt', // 改為 prompt 模式，讓使用者控制更新
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'android-chrome-*.png'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // 快取策略
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/mis\.twse\.com\.tw\/stock\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'twse-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5, // 5 分鐘
                },
                networkTimeoutSeconds: 3,
              },
            },
          ],
        },
        devOptions: {
          enabled: true, // 開發模式也啟用 PWA
        },
        manifest: {
          name: 'StockBoard',
          short_name: 'StockBoard',
          description: '台股即時自選股觀察',
          theme_color: '#1976d2',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          orientation: 'portrait-primary',
          categories: ['finance', 'business'],
          lang: 'zh-TW',
          icons: [
            {
              src: '/favicon-16x16.png',
              sizes: '16x16',
              type: 'image/png'
            },
            {
              src: '/favicon-32x32.png',
              sizes: '32x32',
              type: 'image/png'
            },
            {
              src: '/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    }
  };
});