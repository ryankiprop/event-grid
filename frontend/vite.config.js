import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    https: true,
    host: true, // listen on all addresses (LAN/devices)
    port: 5173,
  },
  preview: {
    https: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
