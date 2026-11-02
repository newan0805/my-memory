import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ZenQuotes blocks browser (CORS) requests, so proxy it; vercel.json does the same in production.
const proxy = {
  '/api/quotes': {
    target: 'https://zenquotes.io',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    proxy,
  },
  preview: {
    proxy,
  },
})
