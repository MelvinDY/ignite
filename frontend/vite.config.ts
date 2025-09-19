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
  return 3001  // Updated default to match actual backend port
}

const backendPort = loadBackendPort()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3002,  // Use the actual port Vite is running on
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})
