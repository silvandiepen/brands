import vue from '@vitejs/plugin-vue'
import { defineTheme, ui } from '@sil/ui/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      theme: defineTheme({
        colors: {
          dark: '#101114',
          light: '#ffffff',
          primary: '#2563eb',
        },
      }),
    }),
  ],
  server: {
    fs: {
      allow: ['..', '../..'],
    },
  },
  build: {
    target: 'es2022',
  },
})
