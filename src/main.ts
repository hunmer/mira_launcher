import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 插件导入
import { registerGlobalComponents, setupComponentDevtools } from './plugins/components'
import { monitorMemoryUsage, setupPerformanceMonitor } from './plugins/performance'

// 導入樣式
import './styles/main.css'

// 創建 Vue 應用實例
const app = createApp(App)

// 注册全局组件
registerGlobalComponents(app)

// 使用 Pinia 狀態管理
const pinia = createPinia()
app.use(pinia)

// 使用路由
app.use(router)

// 開發環境下的額外配置
if (import.meta.env.DEV) {
  // 開發模式下的配置
  console.log('🚀 Mira Launcher 開發模式啟動')

  // 设置组件开发工具
  setupComponentDevtools(app)

  // 设置性能监控
  setupPerformanceMonitor(app)

  // 啟用 Vue DevTools
  app.config.performance = true

  // 打印路由信息
  console.log('[Router] Loaded', router.getRoutes().length, 'routes')

  // 监控内存使用
  setTimeout(monitorMemoryUsage, 2000)
}

// 生產環境下的配置
if (import.meta.env.PROD) {
  // 移除 console.log
  console.log = () => { }
  console.warn = () => { }
}

// 全局錯誤處理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue 全局錯誤:', err)
  console.error('錯誤組件:', vm)
  console.error('錯誤信息:', info)

  // 這裡可以集成錯誤報告服務
  // 例如 Sentry 或其他錯誤追蹤工具
}

// 全局警告處理
app.config.warnHandler = (msg, vm, trace) => {
  console.warn('Vue 警告:', msg)
  console.warn('警告組件:', vm)
  console.warn('組件追蹤:', trace)
}

// 掛載應用
app.mount('#app')

export default app
