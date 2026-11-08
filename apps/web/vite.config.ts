import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { seo } from './vite/seo.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), seo()],
  server: {
    port: 5177,
  },
})
