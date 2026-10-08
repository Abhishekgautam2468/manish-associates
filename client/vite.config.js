import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // API_URL lets a second copy of the app point at a different backend.
      '/api': process.env.API_URL || 'http://localhost:4000',
    },
  },
})
