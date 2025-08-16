// vite.config.ts
import vue from 'file:///D:/mira_launcher/node_modules/@vitejs/plugin-vue/dist/index.mjs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'file:///D:/mira_launcher/node_modules/vite/dist/node/index.js'
const __vite_injected_original_import_meta_url = 'file:///D:/mira_launcher/vite.config.ts'
const vite_config_default = defineConfig({
  plugins: [vue()],
  // Path aliases
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', __vite_injected_original_import_meta_url)),
      '@/components': fileURLToPath(new URL('./src/components', __vite_injected_original_import_meta_url)),
      '@/plugins': fileURLToPath(new URL('./src/plugins', __vite_injected_original_import_meta_url)),
      '@/stores': fileURLToPath(new URL('./src/stores', __vite_injected_original_import_meta_url)),
      '@/types': fileURLToPath(new URL('./src/types', __vite_injected_original_import_meta_url)),
      '@/utils': fileURLToPath(new URL('./src/utils', __vite_injected_original_import_meta_url)),
      '@/composables': fileURLToPath(new URL('./src/composables', __vite_injected_original_import_meta_url)),
      '@/assets': fileURLToPath(new URL('./src/assets', __vite_injected_original_import_meta_url)),
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
    sourcemap: false,
    // 生产环境关闭sourcemap
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1e3,
  },
  // Development server configuration
  server: {
    host: process.env.TAURI_DEV_HOST || false,
    port: 1420,
    strictPort: true,
    hmr: process.env.TAURI_DEV_HOST ? {
      protocol: 'ws',
      host: process.env.TAURI_DEV_HOST,
      port: 1430,
    } : void 0,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
    fs: {
      // Allow serving files from the plugins directory and quick-search
      allow: ['..', '.', './plugins', './quick-search'],
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
export {
  vite_config_default as default,
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxtaXJhX2xhdW5jaGVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxtaXJhX2xhdW5jaGVyXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9taXJhX2xhdW5jaGVyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJ1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbdnVlKCldLFxyXG5cclxuICAvLyBQYXRoIGFsaWFzZXNcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcclxuICAgICAgJ0AvY29tcG9uZW50cyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvY29tcG9uZW50cycsIGltcG9ydC5tZXRhLnVybCkpLFxyXG4gICAgICAnQC9wbHVnaW5zJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9wbHVnaW5zJywgaW1wb3J0Lm1ldGEudXJsKSksXHJcbiAgICAgICdAL3N0b3Jlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvc3RvcmVzJywgaW1wb3J0Lm1ldGEudXJsKSksXHJcbiAgICAgICdAL3R5cGVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy90eXBlcycsIGltcG9ydC5tZXRhLnVybCkpLFxyXG4gICAgICAnQC91dGlscyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvdXRpbHMnLCBpbXBvcnQubWV0YS51cmwpKSxcclxuICAgICAgJ0AvY29tcG9zYWJsZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL2NvbXBvc2FibGVzJywgaW1wb3J0Lm1ldGEudXJsKSksXHJcbiAgICAgICdAL2Fzc2V0cyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvYXNzZXRzJywgaW1wb3J0Lm1ldGEudXJsKSksXHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIC8vIEJ1aWxkIG9wdGltaXphdGlvblxyXG4gIGJ1aWxkOiB7XHJcbiAgICB0YXJnZXQ6ICdlczIwMjAnLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgIHZ1ZTogWyd2dWUnXSxcclxuICAgICAgICAgIHBpbmlhOiBbJ3BpbmlhJ10sXHJcbiAgICAgICAgICBwcmltZXZ1ZTogWydwcmltZXZ1ZSddLFxyXG4gICAgICAgICAgdnVldXNlOiBbJ0B2dWV1c2UvY29yZSddLFxyXG4gICAgICAgICAgdWk6IFsnQGZsb2F0aW5nLXVpL3Z1ZScsICdsdWNpZGUtdnVlLW5leHQnXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxyXG4gICAgc291cmNlbWFwOiBmYWxzZSwgLy8gXHU3NTFGXHU0RUE3XHU3M0FGXHU1ODgzXHU1MTczXHU5NUVEc291cmNlbWFwXHJcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXHJcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXHJcbiAgfSxcclxuXHJcbiAgLy8gRGV2ZWxvcG1lbnQgc2VydmVyIGNvbmZpZ3VyYXRpb25cclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IHByb2Nlc3MuZW52LlRBVVJJX0RFVl9IT1NUIHx8IGZhbHNlLFxyXG4gICAgcG9ydDogMTQyMCxcclxuICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgICBobXI6IHByb2Nlc3MuZW52LlRBVVJJX0RFVl9IT1NUXHJcbiAgICAgID8ge1xyXG4gICAgICAgIHByb3RvY29sOiAnd3MnLFxyXG4gICAgICAgIGhvc3Q6IHByb2Nlc3MuZW52LlRBVVJJX0RFVl9IT1NULFxyXG4gICAgICAgIHBvcnQ6IDE0MzAsXHJcbiAgICAgIH1cclxuICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICB3YXRjaDoge1xyXG4gICAgICAvLyAzLiB0ZWxsIHZpdGUgdG8gaWdub3JlIHdhdGNoaW5nIGBzcmMtdGF1cmlgXHJcbiAgICAgIGlnbm9yZWQ6IFsnKiovc3JjLXRhdXJpLyoqJ10sXHJcbiAgICB9LFxyXG4gICAgZnM6IHtcclxuICAgICAgLy8gQWxsb3cgc2VydmluZyBmaWxlcyBmcm9tIHRoZSBwbHVnaW5zIGRpcmVjdG9yeSBhbmQgcXVpY2stc2VhcmNoXHJcbiAgICAgIGFsbG93OiBbJy4uJywgJy4nLCAnLi9wbHVnaW5zJywgJy4vcXVpY2stc2VhcmNoJ10sXHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIC8vIERldmVsb3BtZW50IGNvbmZpZ3VyYXRpb25cclxuICBkZWZpbmU6IHtcclxuICAgIF9fVlVFX09QVElPTlNfQVBJX186IHRydWUsXHJcbiAgICBfX1ZVRV9QUk9EX0RFVlRPT0xTX186IGZhbHNlLFxyXG4gIH0sXHJcblxyXG4gIC8vIENTUyBjb25maWd1cmF0aW9uXHJcbiAgY3NzOiB7XHJcbiAgICBkZXZTb3VyY2VtYXA6IHRydWUsXHJcbiAgfSxcclxuXHJcbiAgLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAgZW52UHJlZml4OiBbJ1ZJVEVfJywg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
