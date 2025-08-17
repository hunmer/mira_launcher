import { defineStore } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'

/**
 * 插件主题接口
 */
interface PluginTheme {
  id: string
  name: string
  pluginId: string
  styles: Record<string, string>
  cssVariables: Record<string, string>
  isActive: boolean
  mode: 'light' | 'dark' | 'auto'
}

/**
 * 插件主题配置
 */
interface PluginThemeConfig {
  allowPluginThemes: boolean
  maxPluginThemes: number
  enableHotReload: boolean
  isolatePluginStyles: boolean
}

export const useThemeStore = defineStore('theme', () => {
  // 主题模式: 'light' | 'dark' | 'auto'
  const themeMode = ref<'light' | 'dark' | 'auto'>('auto')

  // 系统主题
  const systemTheme = ref<'light' | 'dark'>('light')

  // 插件主题配置
  const pluginThemeConfig = ref<PluginThemeConfig>({
    allowPluginThemes: true,
    maxPluginThemes: 30,
    enableHotReload: true,
    isolatePluginStyles: true,
  })

  // 插件主题注册表
  const pluginThemes = ref<Map<string, PluginTheme>>(new Map())

  // 活跃的插件主题
  const activePluginThemes = ref<Set<string>>(new Set())

  // 当前实际主题
  const currentTheme = computed(() => {
    if (themeMode.value === 'auto') {
      return systemTheme.value
    }
    return themeMode.value
  })

  // 设置主题模式
  const setThemeMode = (mode: 'light' | 'dark' | 'auto') => {
    if (themeMode.value === mode) {
      console.log(`[Theme] Theme mode already set to: ${mode}`)
      return
    }
    console.log(`[Theme] Setting theme mode: ${themeMode.value} -> ${mode}`)
    themeMode.value = mode
    // 让 watcher 处理应用和保存
  }

  // 切换主题
  const toggleTheme = () => {
    console.log(`[Theme] Toggling theme from: ${themeMode.value}`)
    if (themeMode.value === 'light') {
      setThemeMode('dark')
    } else if (themeMode.value === 'dark') {
      setThemeMode('auto')
    } else {
      setThemeMode('light')
    }
  }

  // 应用主题到 DOM
  const applyTheme = () => {
    const htmlElement = document.documentElement
    const isDark = currentTheme.value === 'dark'

    console.log(
      `[Theme] Applying theme: ${currentTheme.value} (mode: ${themeMode.value}, system: ${systemTheme.value})`,
    )

    if (isDark) {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }

    console.log(
      '[Theme] DOM classes after apply:',
      htmlElement.classList.toString(),
    )

    // 刷新插件主题
    refreshPluginThemes()
  }

  // 监听系统主题变化
  const watchSystemTheme = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      const newSystemTheme = e.matches ? 'dark' : 'light'
      console.log(`[Theme] System theme detected: ${newSystemTheme}`)
      systemTheme.value = newSystemTheme
      // 不在这里调用 applyTheme()，让 watcher 处理
    }

    // 初始化
    updateSystemTheme(mediaQuery)

    // 监听变化
    mediaQuery.addEventListener('change', updateSystemTheme)

    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme)
    }
  }

  // 初始化主题
  const initTheme = () => {
    // 从 localStorage 读取保存的主题设置
    const savedTheme = localStorage.getItem('theme-mode') as
      | 'light'
      | 'dark'
      | 'auto'
      | null
    if (savedTheme) {
      themeMode.value = savedTheme
    }

    // 加载插件主题配置
    try {
      const savedPluginConfig = localStorage.getItem('plugin-theme-config')
      if (savedPluginConfig) {
        const config = JSON.parse(savedPluginConfig)
        pluginThemeConfig.value = { ...pluginThemeConfig.value, ...config }
      }

      const savedActiveThemes = localStorage.getItem('active-plugin-themes')
      if (savedActiveThemes) {
        const themes = JSON.parse(savedActiveThemes)
        activePluginThemes.value = new Set(themes)
      }
    } catch (error) {
      console.error('[Theme] Failed to load plugin theme settings:', error)
    }

    // 开始监听系统主题
    const unwatch = watchSystemTheme()

    // 应用初始主题
    applyTheme()

    return unwatch
  }

  // 保存主题设置到 localStorage
  const saveTheme = () => {
    localStorage.setItem('theme-mode', themeMode.value)
    localStorage.setItem(
      'plugin-theme-config',
      JSON.stringify(pluginThemeConfig.value),
    )
    localStorage.setItem(
      'active-plugin-themes',
      JSON.stringify([...activePluginThemes.value]),
    )
  }

  // 插件主题管理方法
  const registerPluginTheme = (
    pluginId: string,
    themeData: Omit<PluginTheme, 'id' | 'pluginId' | 'isActive'>,
  ) => {
    if (!pluginThemeConfig.value.allowPluginThemes) {
      throw new Error('Plugin themes are disabled')
    }

    if (pluginThemes.value.size >= pluginThemeConfig.value.maxPluginThemes) {
      throw new Error(
        `Plugin themes limit reached: ${pluginThemeConfig.value.maxPluginThemes}`,
      )
    }

    const themeId = `${pluginId}.${themeData.name}`
    const pluginTheme: PluginTheme = {
      ...themeData,
      id: themeId,
      pluginId,
      isActive: false,
    }

    pluginThemes.value.set(themeId, pluginTheme)
    console.log(`[Theme] Registered plugin theme: ${themeId}`)

    // 如果主题符合当前模式，自动激活
    if (shouldActivateTheme(pluginTheme)) {
      activatePluginTheme(themeId)
    }

    return themeId
  }

  const unregisterPluginTheme = (pluginId: string, themeName?: string) => {
    if (themeName) {
      const themeId = `${pluginId}.${themeName}`
      deactivatePluginTheme(themeId)
      pluginThemes.value.delete(themeId)
      console.log(`[Theme] Unregistered plugin theme: ${themeId}`)
    } else {
      // 移除该插件的所有主题
      for (const [themeId, theme] of pluginThemes.value) {
        if (theme.pluginId === pluginId) {
          deactivatePluginTheme(themeId)
          pluginThemes.value.delete(themeId)
        }
      }
      console.log(`[Theme] Unregistered all themes for plugin: ${pluginId}`)
    }

    saveTheme()
  }

  const activatePluginTheme = (themeId: string) => {
    const theme = pluginThemes.value.get(themeId)
    if (!theme) {
      console.warn(`[Theme] Theme not found: ${themeId}`)
      return false
    }

    // 检查主题模式兼容性
    if (!shouldActivateTheme(theme)) {
      console.log(
        `[Theme] Theme ${themeId} not compatible with current mode: ${currentTheme.value}`,
      )
      return false
    }

    theme.isActive = true
    activePluginThemes.value.add(themeId)

    // 应用主题样式
    applyPluginTheme(theme)

    console.log(`[Theme] Activated plugin theme: ${themeId}`)
    saveTheme()
    return true
  }

  const deactivatePluginTheme = (themeId: string) => {
    const theme = pluginThemes.value.get(themeId)
    if (!theme) return false

    theme.isActive = false
    activePluginThemes.value.delete(themeId)

    // 移除主题样式
    removePluginTheme(theme)

    console.log(`[Theme] Deactivated plugin theme: ${themeId}`)
    saveTheme()
    return true
  }

  const shouldActivateTheme = (theme: PluginTheme): boolean => {
    if (theme.mode === 'auto') return true
    return theme.mode === currentTheme.value
  }

  const applyPluginTheme = (theme: PluginTheme) => {
    const styleId = `plugin-theme-${theme.id}`
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      styleElement.setAttribute('data-plugin-id', theme.pluginId)

      if (pluginThemeConfig.value.isolatePluginStyles) {
        // 添加插件样式隔离
        styleElement.setAttribute('data-isolated', 'true')
      }

      document.head.appendChild(styleElement)
    }

    // 构建CSS内容
    let cssContent = ''

    // 添加CSS变量
    if (Object.keys(theme.cssVariables).length > 0) {
      cssContent += ':root {\n'
      for (const [key, value] of Object.entries(theme.cssVariables)) {
        cssContent += `  --plugin-${theme.pluginId}-${key}: ${value};\n`
      }
      cssContent += '}\n\n'
    }

    // 添加样式规则
    for (const [selector, rules] of Object.entries(theme.styles)) {
      const prefixedSelector = pluginThemeConfig.value.isolatePluginStyles
        ? `[data-plugin="${theme.pluginId}"] ${selector}`
        : selector

      cssContent += `${prefixedSelector} {\n${rules}\n}\n\n`
    }

    styleElement.textContent = cssContent
  }

  const removePluginTheme = (theme: PluginTheme) => {
    const styleId = `plugin-theme-${theme.id}`
    const styleElement = document.getElementById(styleId)

    if (styleElement) {
      styleElement.remove()
    }
  }

  const refreshPluginThemes = () => {
    // 重新应用所有活跃的插件主题
    for (const themeId of activePluginThemes.value) {
      const theme = pluginThemes.value.get(themeId)
      if (theme && shouldActivateTheme(theme)) {
        applyPluginTheme(theme)
      } else if (theme) {
        deactivatePluginTheme(themeId)
      }
    }
  }

  const updatePluginThemeConfig = (newConfig: Partial<PluginThemeConfig>) => {
    pluginThemeConfig.value = { ...pluginThemeConfig.value, ...newConfig }
    saveTheme()

    // 如果禁用了插件主题，停用所有插件主题
    if (!newConfig.allowPluginThemes) {
      for (const themeId of activePluginThemes.value) {
        deactivatePluginTheme(themeId)
      }
    }

    console.log('[Theme] Updated plugin theme config:', newConfig)
  }

  const getPluginThemes = (pluginId?: string) => {
    const themes = Array.from(pluginThemes.value.values())

    if (pluginId) {
      return themes.filter(theme => theme.pluginId === pluginId)
    }

    return themes
  }

  const getActivePluginThemes = () => {
    return Array.from(activePluginThemes.value)
      .map(themeId => pluginThemes.value.get(themeId))
      .filter(Boolean) as PluginTheme[]
  }

  // 监听主题变化，自动刷新插件主题
  watch(currentTheme, () => {
    refreshPluginThemes()
  })

  // 监听主题模式变化，自动应用和保存
  watch(
    themeMode,
    newMode => {
      console.log(`[Theme] Theme mode changed to: ${newMode}`)
      nextTick(() => {
        applyTheme()
        saveTheme()
      })
    },
    { immediate: false },
  )

  // 监听系统主题变化
  watch(
    systemTheme,
    newSystemTheme => {
      console.log(`[Theme] System theme changed to: ${newSystemTheme}`)
      if (themeMode.value === 'auto') {
        nextTick(() => {
          applyTheme()
        })
      }
    },
    { immediate: false },
  )

  return {
    // 基础主题状态
    themeMode,
    systemTheme,
    currentTheme,

    // 插件主题状态
    pluginThemeConfig,
    pluginThemes,
    activePluginThemes,

    // 基础主题方法
    setThemeMode,
    toggleTheme,
    applyTheme,
    initTheme,
    saveTheme,

    // 插件主题方法
    registerPluginTheme,
    unregisterPluginTheme,
    activatePluginTheme,
    deactivatePluginTheme,
    refreshPluginThemes,
    updatePluginThemeConfig,
    getPluginThemes,
    getActivePluginThemes,
  }
})
