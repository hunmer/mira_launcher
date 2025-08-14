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
  const isTauriEnv = () => !!window.__TAURI__

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
      const { writeTextFile, BaseDirectory } = await import('@tauri-apps/api/fs')
      await writeTextFile('settings.json', JSON.stringify(settingsData, null, 2), {
        dir: BaseDirectory.AppData
      })
      console.log('Settings saved to Tauri storage')
    } catch (error) {
      console.error('Failed to save settings to Tauri:', error)
      // 降级到 localStorage
      saveToLocalStorage(settingsData)
    }
  }

  // 从 Tauri 存储加载设置
  const loadFromTauri = async (): Promise<AppSettings | null> => {
    if (!isTauriEnv()) return null

    try {
      const { readTextFile, BaseDirectory } = await import('@tauri-apps/api/fs')
      const content = await readTextFile('settings.json', {
        dir: BaseDirectory.AppData
      })
      const parsed = JSON.parse(content)
      console.log('Settings loaded from Tauri storage')
      return { ...defaultSettings, ...parsed }
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
