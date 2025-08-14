import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// 设置项类型定义
export interface AppSettings {
  // 常规设置
  general: {
    language: string
    windowSize: string
    autoStart: boolean
    minimizeToTray: boolean
    showInTaskbar: boolean
  }

  // 快捷键设置
  shortcuts: {
    globalHotkey: string
    searchHotkey: string
    settingsHotkey: string
    exitHotkey: string
  }

  // 启动设置
  startup: {
    autoStart: boolean
    startMinimized: boolean
    checkUpdates: boolean
    loadPluginsOnStart: boolean
  }

  // 插件设置
  plugins: {
    autoUpdate: boolean
    allowBeta: boolean
    pluginPath: string
    maxCacheSize: number
  }

  // 高级设置
  advanced: {
    debugMode: boolean
    logLevel: string
    maxLogFiles: number
    performanceMode: boolean
    enableTelemetry: boolean
  }
}

// 默认设置
const defaultSettings: AppSettings = {
  general: {
    language: 'zh-CN',
    windowSize: 'medium',
    autoStart: false,
    minimizeToTray: true,
    showInTaskbar: true
  },
  shortcuts: {
    globalHotkey: 'Ctrl+Space',
    searchHotkey: 'Ctrl+F',
    settingsHotkey: 'Ctrl+,',
    exitHotkey: 'Ctrl+Q'
  },
  startup: {
    autoStart: false,
    startMinimized: false,
    checkUpdates: true,
    loadPluginsOnStart: true
  },
  plugins: {
    autoUpdate: true,
    allowBeta: false,
    pluginPath: './plugins',
    maxCacheSize: 100
  },
  advanced: {
    debugMode: false,
    logLevel: 'info',
    maxLogFiles: 10,
    performanceMode: false,
    enableTelemetry: false
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(defaultSettings)
  const isLoading = ref(false)
  const lastSaved = ref<Date | null>(null)

  // 检查是否在 Tauri 环境中
  const isTauriEnv = () => {
    try {
      return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
    } catch {
      return false
    }
  }

  // 保存设置到本地存储
  const saveToLocalStorage = (settingsData: AppSettings) => {
    try {
      localStorage.setItem('mira-launcher-settings', JSON.stringify(settingsData))
      console.log('Settings saved to localStorage')
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
    }
  }

  // 从本地存储加载设置
  const loadFromLocalStorage = (): AppSettings | null => {
    try {
      const stored = localStorage.getItem('mira-launcher-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('Settings loaded from localStorage')
        return { ...defaultSettings, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error)
    }
    return null
  }

  // 保存设置到 Tauri 存储
  const saveToTauri = async (settingsData: AppSettings) => {
    if (!isTauriEnv()) return

    try {
      const { writeTextFile, BaseDirectory, mkdir } = await import('@tauri-apps/plugin-fs')

      // 优先使用 AppConfig 目录
      try {
        await writeTextFile('settings.json', JSON.stringify(settingsData, null, 2), {
          baseDir: BaseDirectory.AppConfig,
          create: true,
          createNew: true,
        })
        console.log('Settings saved to Tauri storage (AppConfig)')
        return
      } catch (error) {
        console.log('Failed to save to AppConfig, trying AppData:', error)
      }
    } catch (error) {
      console.error('Failed to save to Tauri storage:', error)
    }
  }

  // 从 Tauri 存储加载设置
  const loadFromTauri = async (): Promise<AppSettings | null> => {
    if (!isTauriEnv()) return null

    try {
      const { readTextFile, BaseDirectory, exists } = await import('@tauri-apps/plugin-fs')

      // 尝试多个可能的目录位置
      const possibleLocations = [
        { baseDir: BaseDirectory.AppConfig, path: 'settings.json' },
        { baseDir: BaseDirectory.AppData, path: 'settings.json' },
        { baseDir: BaseDirectory.AppData, path: 'com.miralauncher.app/settings.json' },
        { baseDir: BaseDirectory.Config, path: 'mira-launcher/settings.json' }
      ]

      for (const location of possibleLocations) {
        try {
          const fileExists = await exists(location.path, { baseDir: location.baseDir })
          if (fileExists) {
            const content = await readTextFile(location.path, { baseDir: location.baseDir })
            const parsed = JSON.parse(content)
            console.log('Settings loaded from Tauri storage:', location)
            return { ...defaultSettings, ...parsed }
          }
        } catch (error) {
          // 继续尝试下一个位置
          console.log('Failed to load from location:', location, error)
        }
      }

      // 如果都失败了，降级到 localStorage
      console.log('No Tauri settings found, falling back to localStorage')
      return loadFromLocalStorage()
    } catch (error) {
      console.error('Failed to load settings from Tauri:', error)
      // 降级到 localStorage
      return loadFromLocalStorage()
    }
  }

  // 保存设置（统一接口）
  const saveSettings = async () => {
    isLoading.value = true
    try {
      if (isTauriEnv()) {
        await saveToTauri(settings.value)
      } else {
        saveToLocalStorage(settings.value)
      }
      lastSaved.value = new Date()
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 加载设置（统一接口）
  const loadSettings = async () => {
    isLoading.value = true
    try {
      let loadedSettings: AppSettings | null = null

      if (isTauriEnv()) {
        loadedSettings = await loadFromTauri()
      } else {
        loadedSettings = loadFromLocalStorage()
      }

      if (loadedSettings) {
        // 深度合并，确保新的默认设置项被包含
        settings.value = mergeSettings(defaultSettings, loadedSettings)
      } else {
        settings.value = { ...defaultSettings }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      settings.value = { ...defaultSettings }
    } finally {
      isLoading.value = false
    }
  }

  // 深度合并设置对象
  const mergeSettings = (defaults: AppSettings, loaded: Partial<AppSettings>): AppSettings => {
    const result = { ...defaults }

    for (const key in loaded) {
      const typedKey = key as keyof AppSettings
      if (loaded.hasOwnProperty(key) && typeof loaded[typedKey] === 'object' && !Array.isArray(loaded[typedKey])) {
        result[typedKey] = { ...defaults[typedKey], ...loaded[typedKey] } as any
      } else if (loaded.hasOwnProperty(key)) {
        result[typedKey] = loaded[typedKey] as any
      }
    }

    return result
  }

  // 重置设置
  const resetSettings = async () => {
    settings.value = { ...defaultSettings }
    await saveSettings()
  }

  // 更新特定设置
  const updateSetting = async (category: keyof AppSettings, key: string, value: any) => {
    if (settings.value[category] && settings.value[category].hasOwnProperty(key)) {
      (settings.value[category] as any)[key] = value
      await saveSettings()
    }
  }

  // 批量更新设置
  const updateSettings = async (updates: Partial<AppSettings>) => {
    Object.assign(settings.value, updates)
    await saveSettings()
  }

  // 监听设置变化，自动保存
  watch(
    settings,
    async () => {
      await saveSettings()
    },
    { deep: true }
  )

  return {
    settings,
    isLoading,
    lastSaved,
    saveSettings,
    loadSettings,
    resetSettings,
    updateSetting,
    updateSettings
  }
})
