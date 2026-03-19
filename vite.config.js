import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { qrcode } from 'vite-plugin-qrcode'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), command === 'serve' && qrcode()].filter(Boolean),
  server: { host: true },
}))
