import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// ============================================
// PORT CONFIGURATION
// ============================================
// Frontend runs on PORT 3000
// Backend API proxy points to PORT 5001
// ============================================
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000, // Frontend port - DO NOT CHANGE
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // Backend port - DO NOT CHANGE
        changeOrigin: true
      }
    }
  }
})
