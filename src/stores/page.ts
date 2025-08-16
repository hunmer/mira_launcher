import type { Page, PageConfig, PageHistory, PageNavigation, PageState } from '@/types/components'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useGridStore } from './grid'

/**
 * 插件页面接口
 */
interface PluginPage extends Page {
  pluginId?: string
  pluginType?: 'overlay' | 'modal' | 'fullscreen' | 'embedded'
  pluginData?: Record<string, any>
  isPluginManaged?: boolean
}

/**
 * 插件页面配置
 */
interface PluginPageConfig {
  allowPluginPages: boolean
  maxPluginPages: number
  pluginPagePrefix: string
  isolatePluginRoutes: boolean
}

export const usePageStore = defineStore('page', () => {
  // 页面列表
  const pages = ref<Page[]>([])

  // 当前页面索引
  const currentPageIndex = ref(0)

  // 页面切换历史
  const history = ref<PageHistory[]>([])

  // 页面导航历史
  const navigation = ref<PageNavigation[]>([])

  // 页面状态
  const pageState = ref<PageState>({
    loading: false,
    isDirty: false,
  })

  // 页面配置
  const config = ref<PageConfig>({
    maxPages: 10,
    enableAnimation: true,
    autoSave: true,
    saveInterval: 5000,
    layout: 'grid',
    theme: 'inherit',
  })

  // 插件页面配置
  const pluginPageConfig = ref<PluginPageConfig>({
    allowPluginPages: true,
    maxPluginPages: 20,
    pluginPagePrefix: '/plugin/',
    isolatePluginRoutes: true,
  })

  // 插件页面组件注册表
  const pluginPageComponents = ref<Map<string, {
    component: any
    metadata: Record<string, any>
    lifecycle: {
      onMount?: () => void
      onUnmount?: () => void
      onActivate?: () => void
      onDeactivate?: () => void
        }
        }>>(new Map())

  // 计算属性
  const currentPage = computed(() => {
    return pages.value[currentPageIndex.value] || null
  })

  const pageCount = computed(() => pages.value.length)

  const hasPages = computed(() => pages.value.length > 0)

  const canNavigateNext = computed(() => {
    return currentPageIndex.value < pages.value.length - 1
  })

  const canNavigatePrevious = computed(() => {
    return currentPageIndex.value > 0
  })

  const pinnedPages = computed(() => {
    return pages.value.filter(page => page.pinned)
  })

  const recentPages = computed(() => {
    return [...pages.value]
      .sort((a, b) => b.lastVisited.getTime() - a.lastVisited.getTime())
      .slice(0, 5)
  })

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 添加到历史记录
  const addToHistory = (action: PageHistory['action'], pageId: string, data?: any) => {
    const historyEntry: PageHistory = {
      id: generateId(),
      pageId,
      timestamp: new Date(),
      action,
      data,
    }

    history.value.unshift(historyEntry)

    // 限制历史记录数量
    if (history.value.length > 100) {
      history.value = history.value.slice(0, 100)
    }
  }

  // 添加导航记录
  const addNavigation = (from: string, to: string, duration?: number) => {
    const navEntry: PageNavigation = {
      from,
      to,
      timestamp: new Date(),
    }

    if (duration !== undefined) {
      navEntry.duration = duration
    }

    navigation.value.unshift(navEntry)

    // 限制导航记录数量
    if (navigation.value.length > 50) {
      navigation.value = navigation.value.slice(0, 50)
    }
  }

  // 页面管理方法
  const addPage = (pageData?: Partial<Page>) => {
    if (pages.value.length >= config.value.maxPages!) {
      throw new Error(`无法添加更多页面，已达到最大限制 ${config.value.maxPages}`)
    }

    const newPage: Page = {
      id: generateId(),
      name: pageData?.name || `页面 ${pages.value.length + 1}`,
      route: pageData?.route || '/home',
      gridData: pageData?.gridData || [],
      config: pageData?.config || {},
      createdAt: new Date(),
      lastVisited: new Date(),
      pinned: pageData?.pinned || false,
    }

    if (pageData?.icon) {
      newPage.icon = pageData.icon
    }

    if (pageData?.description) {
      newPage.description = pageData.description
    }

    pages.value.push(newPage)
    addToHistory('create', newPage.id, { name: newPage.name })
    saveToStorage()

    return newPage.id
  }

  const removePage = (pageId: string) => {
    const index = pages.value.findIndex(p => p.id === pageId)
    if (index === -1) return false

    const removedPage = pages.value[index]
    if (!removedPage) return false

    pages.value.splice(index, 1)

    // 调整当前页面索引
    if (currentPageIndex.value >= pages.value.length) {
      currentPageIndex.value = Math.max(0, pages.value.length - 1)
    } else if (index <= currentPageIndex.value && currentPageIndex.value > 0) {
      currentPageIndex.value--
    }

    addToHistory('delete', pageId, { name: removedPage.name })
    saveToStorage()

    return true
  }

  const updatePage = (pageId: string, updates: Partial<Page>) => {
    const index = pages.value.findIndex(p => p.id === pageId)
    if (index === -1) return false

    const currentPageData = pages.value[index]
    if (!currentPageData) return false

    const oldData = { ...currentPageData }
    const updatedPage = { ...currentPageData, ...updates }
    pages.value[index] = updatedPage

    addToHistory('update', pageId, { oldData, newData: updates })
    saveToStorage()

    return true
  }

  const getPage = (pageId: string) => {
    return pages.value.find(p => p.id === pageId)
  }

  const findPageIndex = (pageId: string) => {
    return pages.value.findIndex(p => p.id === pageId)
  }

  // 页面切换方法
  const switchToPage = (index: number) => {
    if (index < 0 || index >= pages.value.length) return false

    const fromPage = currentPage.value
    const oldIndex = currentPageIndex.value

    // 同步当前页面的网格数据
    syncCurrentPageGridData()

    currentPageIndex.value = index
    const toPage = currentPage.value

    if (toPage) {
      toPage.lastVisited = new Date()
      loadPageGridData(index)

      if (fromPage && toPage.id !== fromPage.id) {
        addNavigation(fromPage.id, toPage.id)
        addToHistory('visit', toPage.id)
      }
    }

    saveToStorage()
    return true
  }

  const switchToPageById = (pageId: string) => {
    const index = findPageIndex(pageId)
    if (index === -1) return false

    return switchToPage(index)
  }

  const nextPage = () => {
    if (canNavigateNext.value) {
      return switchToPage(currentPageIndex.value + 1)
    }
    return false
  }

  const previousPage = () => {
    if (canNavigatePrevious.value) {
      return switchToPage(currentPageIndex.value - 1)
    }
    return false
  }

  // 与gridStore协同工作
  const syncCurrentPageGridData = () => {
    const gridStore = useGridStore()
    const current = currentPage.value
    if (current) {
      current.gridData = [...gridStore.items]
      pageState.value.isDirty = true
    }
  }

  const loadPageGridData = (pageIndex: number) => {
    const gridStore = useGridStore()
    const page = pages.value[pageIndex]
    if (page) {
      gridStore.loadItems(page.gridData)
      pageState.value.isDirty = false
    }
  }

  const saveCurrentPageData = () => {
    syncCurrentPageGridData()
    saveToStorage()
    pageState.value.isDirty = false
    pageState.value.lastSaved = new Date()
  }

  // 批量操作
  const duplicatePage = (pageId: string) => {
    const page = getPage(pageId)
    if (!page) return null

    const duplicatedPage = {
      ...page,
      name: `${page.name} (副本)`,
      gridData: [...page.gridData],
      createdAt: new Date(),
      lastVisited: new Date(),
      pinned: false,
    }

    return addPage(duplicatedPage)
  }

  const movePage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 ||
            fromIndex >= pages.value.length || toIndex >= pages.value.length) {
      return false
    }

    const page = pages.value[fromIndex]
    if (!page) return false

    pages.value.splice(fromIndex, 1)
    pages.value.splice(toIndex, 0, page)

    // 调整当前页面索引
    if (currentPageIndex.value === fromIndex) {
      currentPageIndex.value = toIndex
    } else if (fromIndex < currentPageIndex.value && toIndex >= currentPageIndex.value) {
      currentPageIndex.value--
    } else if (fromIndex > currentPageIndex.value && toIndex <= currentPageIndex.value) {
      currentPageIndex.value++
    }

    saveToStorage()
    return true
  }

  // 配置管理
  const updateConfig = (newConfig: Partial<PageConfig>) => {
    config.value = { ...config.value, ...newConfig }
    saveToStorage()
  }

  const resetConfig = () => {
    config.value = {
      maxPages: 10,
      enableAnimation: true,
      autoSave: true,
      saveInterval: 5000,
      layout: 'grid',
      theme: 'inherit',
    }
    saveToStorage()
  }

  // 数据导入导出
  const exportPages = () => {
    return {
      pages: pages.value,
      config: config.value,
      exportedAt: new Date(),
      version: '1.0',
    }
  }

  const importPages = (data: any) => {
    try {
      // 数据验证
      if (!data || !Array.isArray(data.pages)) {
        throw new Error('无效的页面数据格式')
      }

      // 验证页面数据结构
      for (const page of data.pages) {
        if (!page.id || !page.name || !page.route) {
          throw new Error('页面数据缺少必要字段')
        }
      }

      pages.value = data.pages.map((page: any) => ({
        ...page,
        createdAt: new Date(page.createdAt),
        lastVisited: new Date(page.lastVisited),
      }))

      if (data.config) {
        config.value = { ...config.value, ...data.config }
      }

      currentPageIndex.value = 0
      saveToStorage()

      return true
    } catch (error) {
      console.error('导入页面数据失败:', error)
      return false
    }
  }

  // 持久化存储
  const saveToStorage = () => {
    if (config.value.autoSave) {
      try {
        const data = {
          pages: pages.value,
          currentPageIndex: currentPageIndex.value,
          config: config.value,
          pluginPageConfig: pluginPageConfig.value,
          history: history.value.slice(0, 50), // 只保存最近50条历史
          navigation: navigation.value.slice(0, 25), // 只保存最近25条导航
        }
        localStorage.setItem('pageStore', JSON.stringify(data))
      } catch (error) {
        console.error('保存页面数据失败:', error)
      }
    }
  }

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('pageStore')
      if (stored) {
        const data = JSON.parse(stored)

        if (data.pages && Array.isArray(data.pages)) {
          pages.value = data.pages.map((page: any) => ({
            ...page,
            createdAt: new Date(page.createdAt),
            lastVisited: new Date(page.lastVisited),
          }))
        }

        if (typeof data.currentPageIndex === 'number') {
          currentPageIndex.value = Math.max(0, Math.min(data.currentPageIndex, pages.value.length - 1))
        }

        if (data.config) {
          config.value = { ...config.value, ...data.config }
        }

        if (data.pluginPageConfig) {
          pluginPageConfig.value = { ...pluginPageConfig.value, ...data.pluginPageConfig }
        }

        if (data.history && Array.isArray(data.history)) {
          history.value = data.history.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        }

        if (data.navigation && Array.isArray(data.navigation)) {
          navigation.value = data.navigation.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        }
      }
    } catch (error) {
      console.error('加载页面数据失败:', error)
    }
  }

  const clearStorage = () => {
    localStorage.removeItem('pageStore')
  }

  // 搜索功能
  const searchPages = (query: string) => {
    if (!query.trim()) return pages.value

    const lowercaseQuery = query.toLowerCase()
    return pages.value.filter(page =>
      page.name.toLowerCase().includes(lowercaseQuery) ||
            page.description?.toLowerCase().includes(lowercaseQuery) ||
            page.route.toLowerCase().includes(lowercaseQuery),
    )
  }

  // 自动保存监听
  let autoSaveTimer: number | null = null

  const startAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
    }

    if (config.value.autoSave && config.value.saveInterval) {
      autoSaveTimer = setInterval(() => {
        if (pageState.value.isDirty) {
          saveCurrentPageData()
        }
      }, config.value.saveInterval)
    }
  }

  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // 插件页面管理方法
  const registerPluginPage = (
    pluginId: string,
    pageId: string,
    component: any,
    metadata: Record<string, any> = {},
    lifecycle: any = {},
  ) => {
    if (!pluginPageConfig.value.allowPluginPages) {
      throw new Error('Plugin pages are disabled')
    }

    const pluginPages = pages.value.filter((page: any) => page.pluginId)
    if (pluginPages.length >= pluginPageConfig.value.maxPluginPages) {
      throw new Error(`Plugin pages limit reached: ${pluginPageConfig.value.maxPluginPages}`)
    }

    const componentKey = `${pluginId}.${pageId}`
    pluginPageComponents.value.set(componentKey, {
      component,
      metadata,
      lifecycle,
    })

    const route = pluginPageConfig.value.isolatePluginRoutes 
      ? `${pluginPageConfig.value.pluginPagePrefix}${pluginId}/${pageId}`
      : `/${pageId}`

    const newPageId = addPage({
      name: metadata['title'] || pageId,
      route,
      description: metadata['description'] || `Plugin page: ${pageId}`,
      pluginId,
      pluginType: metadata['type'] || 'embedded',
      pluginData: metadata['data'] || {},
      isPluginManaged: true,
    } as PluginPage)

    console.log(`[Page] Registered plugin page: ${componentKey}`)
    return newPageId
  }

  const unregisterPluginPage = (pluginId: string, pageId?: string) => {
    if (pageId) {
      const componentKey = `${pluginId}.${pageId}`
      const entry = pluginPageComponents.value.get(componentKey)
      
      if (entry && entry.lifecycle.onUnmount) {
        try {
          entry.lifecycle.onUnmount()
        } catch (error) {
          console.error('[Page] Error in plugin page unmount lifecycle:', error)
        }
      }

      pluginPageComponents.value.delete(componentKey)
      
      // 移除页面
      const pageIndex = pages.value.findIndex((page: any) => 
        page.pluginId === pluginId && page.route.includes(pageId),
      )
      if (pageIndex !== -1) {
        removePage(pages.value[pageIndex]!.id)
      }
      
      console.log(`[Page] Unregistered plugin page: ${componentKey}`)
    } else {
      // 移除该插件的所有页面
      const pluginPages = pages.value.filter((page: any) => page.pluginId === pluginId)
      
      for (const page of pluginPages) {
        removePage(page.id)
      }
      
      // 清理组件注册
      for (const [key] of pluginPageComponents.value) {
        if (key.startsWith(`${pluginId}.`)) {
          const entry = pluginPageComponents.value.get(key)
          if (entry && entry.lifecycle.onUnmount) {
            try {
              entry.lifecycle.onUnmount()
            } catch (error) {
              console.error('[Page] Error in plugin page unmount lifecycle:', error)
            }
          }
          pluginPageComponents.value.delete(key)
        }
      }
      
      console.log(`[Page] Unregistered all pages for plugin: ${pluginId}`)
    }
  }

  const getPluginPageComponent = (pluginId: string, pageId: string) => {
    const componentKey = `${pluginId}.${pageId}`
    return pluginPageComponents.value.get(componentKey)
  }

  const activatePluginPage = (pluginId: string, pageId: string) => {
    const componentKey = `${pluginId}.${pageId}`
    const entry = pluginPageComponents.value.get(componentKey)
    
    if (entry && entry.lifecycle.onActivate) {
      try {
        entry.lifecycle.onActivate()
        console.log(`[Page] Activated plugin page: ${componentKey}`)
      } catch (error) {
        console.error('[Page] Error in plugin page activate lifecycle:', error)
      }
    }
  }

  const deactivatePluginPage = (pluginId: string, pageId: string) => {
    const componentKey = `${pluginId}.${pageId}`
    const entry = pluginPageComponents.value.get(componentKey)
    
    if (entry && entry.lifecycle.onDeactivate) {
      try {
        entry.lifecycle.onDeactivate()
        console.log(`[Page] Deactivated plugin page: ${componentKey}`)
      } catch (error) {
        console.error('[Page] Error in plugin page deactivate lifecycle:', error)
      }
    }
  }

  const updatePluginPageConfig = (newConfig: Partial<PluginPageConfig>) => {
    pluginPageConfig.value = { ...pluginPageConfig.value, ...newConfig }
    saveToStorage()
    console.log('[Page] Updated plugin page config:', newConfig)
  }

  const getPluginPages = (pluginId?: string) => {
    const pluginPages = pages.value.filter((page: any) => page.pluginId)
    
    if (pluginId) {
      return pluginPages.filter((page: any) => page.pluginId === pluginId)
    }
    
    return pluginPages
  }

  // 监听配置变化
  watch(() => config.value.autoSave, (newValue) => {
    if (newValue) {
      startAutoSave()
    } else {
      stopAutoSave()
    }
  }, { immediate: true })

  watch(() => config.value.saveInterval, () => {
    if (config.value.autoSave) {
      startAutoSave()
    }
  })

  // 初始化
  loadFromStorage()

  // 如果没有页面，创建默认页面
  if (pages.value.length === 0) {
    addPage({
      name: '首页',
      route: '/home',
      description: '默认首页',
      pinned: true,
    })
  }

  return {
    // 状态
    pages,
    currentPageIndex,
    history,
    navigation,
    pageState,
    config,
    pluginPageConfig,
    pluginPageComponents,

    // 计算属性
    currentPage,
    pageCount,
    hasPages,
    canNavigateNext,
    canNavigatePrevious,
    pinnedPages,
    recentPages,

    // 页面管理
    addPage,
    removePage,
    updatePage,
    getPage,
    findPageIndex,
    duplicatePage,
    movePage,

    // 页面切换
    switchToPage,
    switchToPageById,
    nextPage,
    previousPage,

    // 数据同步
    syncCurrentPageGridData,
    loadPageGridData,
    saveCurrentPageData,

    // 配置管理
    updateConfig,
    resetConfig,

    // 导入导出
    exportPages,
    importPages,

    // 存储管理
    saveToStorage,
    loadFromStorage,
    clearStorage,

    // 搜索
    searchPages,

    // 自动保存
    startAutoSave,
    stopAutoSave,

    // 插件页面管理
    registerPluginPage,
    unregisterPluginPage,
    getPluginPageComponent,
    activatePluginPage,
    deactivatePluginPage,
    updatePluginPageConfig,
    getPluginPages,
  }
})
