import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// 自定义快捷键类型定义
export interface CustomShortcut {
  id: string
  key: string
  actionId: string
  type: 'global' | 'application'
  description?: string
  enabled: boolean
  createdAt: string
  modifiedAt: string
}

// 快捷键偏好设置
export interface ShortcutPreferences {
  enableGlobalShortcuts: boolean
  enableApplicationShortcuts: boolean
  captureTimeout: number
  showConflictWarnings: boolean
  autoSaveChanges: boolean
  exportFormat: 'json' | 'yaml'
}

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
    quickSearchHotkey: string
    settingsHotkey: string
    homeHotkey: string
    applicationsHotkey: string
    pluginsHotkey: string
    exitHotkey: string
  }

  // 自定义快捷键配置
  customShortcuts: CustomShortcut[]

  // 快捷键偏好设置
  shortcutPreferences: ShortcutPreferences

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
    showInTaskbar: true,
  },
  shortcuts: {
    globalHotkey: 'Ctrl+Space',
    searchHotkey: 'Ctrl+F',
    quickSearchHotkey: 'Ctrl+K',
    settingsHotkey: 'Ctrl+,',
    homeHotkey: 'Ctrl+1',
    applicationsHotkey: 'Ctrl+2',
    pluginsHotkey: 'Ctrl+3',
    exitHotkey: 'Ctrl+Q',
  },
  customShortcuts: [],
  shortcutPreferences: {
    enableGlobalShortcuts: true,
    enableApplicationShortcuts: true,
    captureTimeout: 5000,
    showConflictWarnings: true,
    autoSaveChanges: true,
    exportFormat: 'json',
  },
  startup: {
    autoStart: false,
    startMinimized: false,
    checkUpdates: true,
    loadPluginsOnStart: true,
  },
  plugins: {
    autoUpdate: true,
    allowBeta: false,
    pluginPath: './plugins',
    maxCacheSize: 100,
  },
  advanced: {
    debugMode: false,
    logLevel: 'info',
    maxLogFiles: 10,
    performanceMode: false,
    enableTelemetry: false,
  },
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
      localStorage.setItem(
        'mira-launcher-settings',
        JSON.stringify(settingsData),
      )
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
      const { writeTextFile, BaseDirectory, mkdir } = await import(
        '@tauri-apps/plugin-fs'
      )

      // 优先使用 AppConfig 目录
      try {
        await writeTextFile(
          'settings.json',
          JSON.stringify(settingsData, null, 2),
          {
            baseDir: BaseDirectory.AppConfig,
            create: true,
            createNew: true,
          },
        )
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
      const { readTextFile, BaseDirectory, exists } = await import(
        '@tauri-apps/plugin-fs'
      )

      // 尝试多个可能的目录位置
      const possibleLocations = [
        { baseDir: BaseDirectory.AppConfig, path: 'settings.json' },
        { baseDir: BaseDirectory.AppData, path: 'settings.json' },
        {
          baseDir: BaseDirectory.AppData,
          path: 'com.miralauncher.app/settings.json',
        },
        { baseDir: BaseDirectory.Config, path: 'mira-launcher/settings.json' },
      ]

      for (const location of possibleLocations) {
        try {
          const fileExists = await exists(location.path, {
            baseDir: location.baseDir,
          })
          if (fileExists) {
            const content = await readTextFile(location.path, {
              baseDir: location.baseDir,
            })
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
  const mergeSettings = (
    defaults: AppSettings,
    loaded: Partial<AppSettings>,
  ): AppSettings => {
    const result = { ...defaults }

    for (const key in loaded) {
      const typedKey = key as keyof AppSettings
      if (
        loaded.hasOwnProperty(key) &&
        typeof loaded[typedKey] === 'object' &&
        !Array.isArray(loaded[typedKey])
      ) {
        result[typedKey] = { ...defaults[typedKey], ...loaded[typedKey] } as any
      } else if (loaded.hasOwnProperty(key)) {
        result[typedKey] = loaded[typedKey] as any
      }
    }

    return result
  }

  // === 快捷键管理方法 ===

  // 添加自定义快捷键
  const addCustomShortcut = async (
    shortcut: Omit<CustomShortcut, 'id' | 'createdAt' | 'modifiedAt'>,
  ) => {
    const now = new Date().toISOString()
    const newShortcut: CustomShortcut = {
      ...shortcut,
      id: `shortcut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      modifiedAt: now,
    }

    settings.value.customShortcuts.push(newShortcut)
    await saveSettings()
    return newShortcut
  }

  // 更新自定义快捷键
  const updateCustomShortcut = async (
    id: string,
    updates: Partial<
      Pick<
        CustomShortcut,
        'key' | 'actionId' | 'type' | 'description' | 'enabled'
      >
    >,
  ) => {
    const index = settings.value.customShortcuts.findIndex(s => s.id === id)
    if (index !== -1) {
      const existing = settings.value.customShortcuts[index]
      if (existing) {
        // 直接更新属性
        if (updates.key !== undefined) existing.key = updates.key
        if (updates.actionId !== undefined) existing.actionId = updates.actionId
        if (updates.type !== undefined) existing.type = updates.type
        if (updates.description !== undefined)
          existing.description = updates.description
        if (updates.enabled !== undefined) existing.enabled = updates.enabled
        existing.modifiedAt = new Date().toISOString()

        await saveSettings()
        return existing
      }
    }
    return null
  }

  // 删除自定义快捷键
  const removeCustomShortcut = async (id: string) => {
    const index = settings.value.customShortcuts.findIndex(s => s.id === id)
    if (index !== -1) {
      const removed = settings.value.customShortcuts.splice(index, 1)[0]
      await saveSettings()
      return removed
    }
    return null
  }

  // 启用/禁用自定义快捷键
  const toggleCustomShortcut = async (id: string, enabled?: boolean) => {
    const shortcut = settings.value.customShortcuts.find(s => s.id === id)
    if (shortcut) {
      shortcut.enabled = enabled !== undefined ? enabled : !shortcut.enabled
      shortcut.modifiedAt = new Date().toISOString()
      await saveSettings()
      return shortcut
    }
    return null
  }

  // 获取所有自定义快捷键
  const getCustomShortcuts = () => {
    return settings.value.customShortcuts
  }

  // 获取启用的自定义快捷键
  const getEnabledCustomShortcuts = () => {
    return settings.value.customShortcuts.filter(s => s.enabled)
  }

  // 检查快捷键冲突
  const checkShortcutConflict = (key: string, excludeId?: string) => {
    // 检查系统快捷键
    const systemShortcuts = settings.value.shortcuts
    for (const [name, value] of Object.entries(systemShortcuts)) {
      if (value === key) {
        return { type: 'system', name, conflict: true }
      }
    }

    // 检查自定义快捷键
    const conflict = settings.value.customShortcuts.find(
      s => s.key === key && s.enabled && s.id !== excludeId,
    )
    if (conflict) {
      return {
        type: 'custom',
        name: conflict.description || conflict.actionId,
        conflict: true,
      }
    }

    return { conflict: false }
  }

  // 导出快捷键配置
  const exportShortcuts = () => {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      systemShortcuts: settings.value.shortcuts,
      customShortcuts: settings.value.customShortcuts,
      preferences: settings.value.shortcutPreferences,
    }

    const format = settings.value.shortcutPreferences.exportFormat
    if (format === 'json') {
      return {
        data: JSON.stringify(exportData, null, 2),
        filename: `shortcuts-${new Date().toISOString().split('T')[0]}.json`,
        mimeType: 'application/json',
      }
    } else {
      // YAML导出（如果需要的话）
      const yamlData = Object.entries(exportData)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n')
      return {
        data: yamlData,
        filename: `shortcuts-${new Date().toISOString().split('T')[0]}.yaml`,
        mimeType: 'text/yaml',
      }
    }
  }

  // 导入快捷键配置
  const importShortcuts = async (data: string, replaceExisting = false) => {
    try {
      const importData = JSON.parse(data)

      // 验证导入数据格式
      if (
        !importData.version ||
        !importData.systemShortcuts ||
        !Array.isArray(importData.customShortcuts)
      ) {
        throw new Error('Invalid import data format')
      }

      // 备份当前配置
      const backup = {
        systemShortcuts: { ...settings.value.shortcuts },
        customShortcuts: [...settings.value.customShortcuts],
        preferences: { ...settings.value.shortcutPreferences },
      }

      try {
        // 导入系统快捷键
        if (importData.systemShortcuts) {
          Object.assign(settings.value.shortcuts, importData.systemShortcuts)
        }

        // 导入自定义快捷键
        if (importData.customShortcuts) {
          if (replaceExisting) {
            settings.value.customShortcuts = importData.customShortcuts
          } else {
            // 合并模式：避免ID冲突
            const existingIds = new Set(
              settings.value.customShortcuts.map(s => s.id),
            )
            const newShortcuts = importData.customShortcuts.filter(
              (s: CustomShortcut) => !existingIds.has(s.id),
            )
            settings.value.customShortcuts.push(...newShortcuts)
          }
        }

        // 导入偏好设置
        if (importData.preferences) {
          Object.assign(
            settings.value.shortcutPreferences,
            importData.preferences,
          )
        }

        await saveSettings()
        return {
          success: true,
          imported: importData.customShortcuts?.length || 0,
        }
      } catch (saveError) {
        // 恢复备份
        settings.value.shortcuts = backup.systemShortcuts
        settings.value.customShortcuts = backup.customShortcuts
        settings.value.shortcutPreferences = backup.preferences
        throw saveError
      }
    } catch (error) {
      console.error('Failed to import shortcuts:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // 清理过期或无效的快捷键
  const cleanupShortcuts = async () => {
    const validShortcuts = settings.value.customShortcuts.filter(shortcut => {
      // 移除无效的快捷键（如空的key或actionId）
      return shortcut.key && shortcut.actionId && shortcut.id
    })

    if (validShortcuts.length !== settings.value.customShortcuts.length) {
      settings.value.customShortcuts = validShortcuts
      await saveSettings()
      return true
    }
    return false
  }

  // 重置设置
  const resetSettings = async () => {
    settings.value = { ...defaultSettings }
    await saveSettings()
  }

  // 更新特定设置
  const updateSetting = async (
    category: keyof AppSettings,
    key: string,
    value: any,
  ) => {
    if (
      settings.value[category] &&
      settings.value[category].hasOwnProperty(key)
    ) {
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
    { deep: true },
  )

  return {
    settings,
    isLoading,
    lastSaved,
    saveSettings,
    loadSettings,
    resetSettings,
    updateSetting,
    updateSettings,
    // 快捷键管理方法
    addCustomShortcut,
    updateCustomShortcut,
    removeCustomShortcut,
    toggleCustomShortcut,
    getCustomShortcuts,
    getEnabledCustomShortcuts,
    checkShortcutConflict,
    exportShortcuts,
    importShortcuts,
    cleanupShortcuts,
  }
})
