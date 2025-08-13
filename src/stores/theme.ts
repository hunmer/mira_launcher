import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 主题模式: 'light' | 'dark' | 'auto'
  const themeMode = ref<'light' | 'dark' | 'auto'>('auto')

  // 系统主题
  const systemTheme = ref<'light' | 'dark'>('light')

  // 当前实际主题
  const currentTheme = computed(() => {
    if (themeMode.value === 'auto') {
      return systemTheme.value
    }
    return themeMode.value
  })

  // 设置主题模式
  const setThemeMode = (mode: 'light' | 'dark' | 'auto') => {
    themeMode.value = mode
    applyTheme()
  }

  // 切换主题
  const toggleTheme = () => {
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

    if (currentTheme.value === 'dark') {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }

  // 监听系统主题变化
  const watchSystemTheme = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      systemTheme.value = e.matches ? 'dark' : 'light'
      applyTheme()
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
    const savedTheme = localStorage.getItem('theme-mode') as 'light' | 'dark' | 'auto' | null
    if (savedTheme) {
      themeMode.value = savedTheme
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
  }

  return {
    themeMode,
    systemTheme,
    currentTheme,
    setThemeMode,
    toggleTheme,
    applyTheme,
    initTheme,
    saveTheme
  }
})
