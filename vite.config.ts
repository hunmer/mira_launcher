import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  // Path aliases
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@/components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@/plugins': fileURLToPath(new URL('./src/plugins', import.meta.url)),
      '@/stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@/types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@/utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@/composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
      '@/assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },

  // Build optimization
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          pinia: ['pinia'],
          primevue: ['primevue'],
          vueuse: ['@vueuse/core'],
          ui: ['@floating-ui/vue', 'lucide-vue-next'],
        },
      },
    },
    minify: 'esbuild',
    sourcemap: false, // 生产环境关闭sourcemap
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
  },

  // Development server configuration
  server: {
    host: process.env.TAURI_DEV_HOST || false,
    port: 1420,
    strictPort: true,
    hmr: process.env.TAURI_DEV_HOST
      ? {
        protocol: 'ws',
        host: process.env.TAURI_DEV_HOST,
        port: 1430,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },

  // Development configuration
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
  },

  // CSS configuration
  css: {
    devSourcemap: true,
  },

  // Environment variables
  envPrefix: ['VITE_', 'TAURI_'],

  clearScreen: false,
})
