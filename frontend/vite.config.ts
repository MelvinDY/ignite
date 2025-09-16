import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function loadBackendPort(): number {
  try {
    const envPath = resolve(__dirname, '..', 'backend', '.env')
    if (existsSync(envPath)) {
      const text = readFileSync(envPath, 'utf8')
      const m = text.match(/^PORT\s*=\s*(\d+)/m)
      if (m) return parseInt(m[1], 10)
    }
  } catch {}
  const envPort = process.env.BACKEND_PORT
  if (envPort) return parseInt(envPort, 10)
  return 5000
}

const backendPort = loadBackendPort()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
})
