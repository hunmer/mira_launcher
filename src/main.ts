import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import { createApp } from 'vue'
import App from './App.vue'
import { MiraPreset } from './config/primevue-theme'
import router from './router'
import type { AddEntry } from './stores/addEntries'
import { useAddEntriesStore } from './stores/addEntries'
import { useSettingsStore } from './stores/settings'

// PrimeVue 样式
import 'primeicons/primeicons.css'

// 插件导入
import {
  registerGlobalComponents,
  setupComponentDevtools,
} from './plugins/components'
import {
  monitorMemoryUsage,
  setupPerformanceMonitor,
} from './plugins/performance'
// Initialize plugin registry for development
import './plugins/registry'
// 初始化快捷键系统
import { initializeShortcutSystem } from './utils/shortcut-system'
// 初始化窗口管理器
import { initWindowManager } from './utils/window-manager'
// 注册字段组件
import { registerFieldComponents } from './components/business/fields/components'

// 導入樣式
import './styles/main.css'

// 創建 Vue 應用實例
const app = createApp(App)

// 配置 PrimeVue
app.use(PrimeVue, {
  theme: {
    preset: MiraPreset,
    options: {
      darkModeSelector: '.dark',
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue',
      },
    },
  },
})

// 添加 PrimeVue 服务
app.use(ToastService)
app.use(ConfirmationService)

// 添加 PrimeVue 指令
app.directive('tooltip', Tooltip)

// 注册全局组件
registerGlobalComponents(app)

// 使用 Pinia 狀態管理
const pinia = createPinia()
app.use(pinia)

// 暴露 addEntries store 访问器给插件（延迟获取，避免直接引用造成顺序问题）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    __miraAddEntriesStore?: () => {
      register: (entry: AddEntry) => void
      unregister: (id: string) => void
      entries: { id: string; label: string; icon: string; type: string; priority?: number; handler?: () => void | Promise<void>; pluginId?: string }[]
    } | null
  }
}

window.__miraAddEntriesStore = () => {
  try {
    return useAddEntriesStore()
  } catch (e) {
    console.warn('[AddEntries] store accessor unavailable', e)
    return null
  }
}

// 使用路由
app.use(router)

// 注册字段组件
registerFieldComponents(app)

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
  console.log = () => {}
  console.warn = () => {}
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

// 初始化设置和快捷键系统
const initializeAppSystems = async () => {
  try {
    console.log('[App] Initializing app systems...')

    // 初始化设置存储
    const settingsStore = useSettingsStore()
    await settingsStore.loadSettings()
    console.log('[Settings] Settings initialized')

    // 初始化快捷键系统
    await initializeShortcutSystem()
    console.log('[Shortcuts] Shortcut system initialized')

    // 初始化窗口管理器
    await initWindowManager()
    console.log('[WindowManager] Window manager initialized')
  } catch (error) {
    console.error('[App] Failed to initialize app systems:', error)
  }
}

// 在应用挂载后初始化系统
initializeAppSystems().catch(console.error)

export default app
