import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
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
  ],
})
