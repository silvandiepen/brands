import vue from '@vitejs/plugin-vue'
import { ui } from '@sil/ui/vite'
import { defineConfig } from 'vite'

// Theme colors are configured in src/styles/main.scss via `@use '@sil/ui/defaults' with (...)`.
export default defineConfig({
  plugins: [vue(), ui()],
  server: {
    fs: {
      allow: ['..', '../..'],
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('all-mono-svgs.json') || id.includes('all-svgs.json')) return 'svg-data'
          if (id.includes('all-brands.json')) return 'brands-data'
        },
      },
    },
  },
})
