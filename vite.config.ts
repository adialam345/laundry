import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true, // wajib agar bisa diakses dari reverse proxy
    port: 5173, // samakan dengan ProxyPass Apache
    allowedHosts: ['laundry.antarixa.qzz.io'], // domain yang diizinkan
  }
})
