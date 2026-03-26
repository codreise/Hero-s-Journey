import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function parseCsvEnv(value) {
  return String(value || "")
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const allowedHosts = parseCsvEnv(process.env.DEV_ALLOWED_HOSTS)
const saveServerUrl = process.env.SAVE_SERVER_URL || 'http://localhost:3001'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  server: {
    allowedHosts: allowedHosts.length > 0 ? allowedHosts : true,
    proxy: {
      '/game-api': {
        target: saveServerUrl,
        changeOrigin: true,
      }
    }
  }
});