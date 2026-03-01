import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    watch: {
      // Prevent data/*.json writes from triggering HMR reloads
      ignored: ['**/data/**'],
    },
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    nitro({ serverDir: 'server' }),
    viteReact(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
