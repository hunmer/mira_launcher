// 搜索功能组合函数
// 提供搜索状态管理和搜索逻辑

import { useGridStore } from '@/stores/grid'
import { usePageStore } from '@/stores/page'
import { usePluginStore } from '@/stores/plugin'
import type { SearchableItem, SearchOptions, SearchResult } from '@/utils/search'
import { debounce, highlightText, performSearch, SearchHistory } from '@/utils/search'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

/**
 * 启动应用程序
 */
const launchApplication = async (path: string, name: string) => {
  try {
    // 检查是否在 Tauri 环境中
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { Command } = await import('@tauri-apps/plugin-shell')

      // 根据文件扩展名或路径类型决定启动方式
      if (path.endsWith('.exe') || path.endsWith('.app') || path.endsWith('.deb') || path.endsWith('.dmg')) {
        // 直接执行可执行文件
        const command = Command.create('run-executable', [path])
        await command.execute()
      } else {
        // 使用系统默认程序打开文件
        const { open } = await import('@tauri-apps/plugin-shell')
        await open(path)
      }

      console.log(`✅ 成功启动应用: ${name}`)
    } else {
      // 在 Web 环境中的备用方案
      console.warn('⚠️ 在 Web 环境中无法启动应用程序')
      // 可以尝试在新标签页中打开
      if (path.startsWith('http://') || path.startsWith('https://')) {
        window.open(path, '_blank')
      }
    }
  } catch (error) {
    console.error(`❌ 启动应用失败 ${name}:`, error)
    // 备用方案：尝试使用系统默认方式打开
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { open } = await import('@tauri-apps/plugin-shell')
        await open(path)
        console.log(`✅ 使用系统默认程序启动: ${name}`)
      }
    } catch (fallbackError) {
      console.error('❌ 备用启动方案也失败:', fallbackError)
    }
  }
}

export interface UseSearchOptions {
  debounceMs?: number
  maxResults?: number
  searchScope?: 'all' | 'current-page' | 'apps' | 'pages' | 'plugins'
  enableHistory?: boolean
  historyKey?: string
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const {
    debounceMs = 200,
    maxResults = 20,
    searchScope = 'all',
    enableHistory = true,
    historyKey = 'quick-search-history',
  } = options

  // 状态
  const visible = ref(false)
  const searchQuery = ref('')
  const selectedIndex = ref(0)
  const isSearching = ref(false)
  const searchResults = ref<SearchResult[]>([])
  const recentSearches = ref<string[]>([])

  // Store引用
  const gridStore = useGridStore()
  const pageStore = usePageStore()
  const pluginStore = usePluginStore()

  // 搜索历史管理
  const searchHistory = new SearchHistory(historyKey, 10)

  // 计算属性
  const hasResults = computed(() => searchResults.value.length > 0)
  const hasQuery = computed(() => searchQuery.value.trim().length > 0)
  const selectedResult = computed(() => searchResults.value[selectedIndex.value])

  // 获取搜索数据源
  const getSearchItems = (): SearchableItem[] => {
    const items: SearchableItem[] = []

    switch (searchScope) {
    case 'apps': {
      // 获取应用程序数据
      const apps = gridStore.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        category: item.category || '应用程序',
        tags: [],
        path: item.path || '',
        icon: item.icon || '',
        type: 'app',
      }))
      items.push(...apps)
      break
    }

    case 'pages': {
      // 获取页面数据
      const pages = pageStore.pages.map(page => ({
        id: page.id,
        name: page.name,
        description: page.description || '',
        category: '页面',
        tags: [],
        path: page.route,
        icon: page.icon || '',
        type: 'page',
      }))
      items.push(...pages)
      break
    }

    case 'plugins': {
      // 获取插件数据
      const plugins = pluginStore.plugins.map(plugin => ({
        id: plugin.metadata.id,
        name: plugin.metadata.name,
        description: plugin.metadata.description || '',
        category: '插件',
        tags: plugin.metadata.keywords || [],
        path: plugin.metadata.homepage || '',
        icon: plugin.metadata.icon || '',
        type: 'plugin',
        author: plugin.metadata.author,
        version: plugin.metadata.version,
        state: plugin.state,
      }))
      items.push(...plugins)
      break
    }

    case 'current-page': {
      // 仅当前页面的应用
      const currentPage = pageStore.currentPage
      if (currentPage) {
        const apps = currentPage.gridData.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          category: item.category || '应用程序',
          tags: [],
          path: item.path || '',
          icon: item.icon || '',
          type: 'app',
        }))
        items.push(...apps)
      }
      break
    }

    case 'all':
    default: {
      // 获取所有数据
      // 应用程序
      const apps = gridStore.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        category: item.category || '应用程序',
        tags: [],
        path: item.path || '',
        icon: item.icon || '',
        type: 'app',
      }))

      // 页面
      const pages = pageStore.pages.map(page => ({
        id: page.id,
        name: page.name,
        description: page.description || '',
        category: '页面',
        tags: [],
        path: page.route,
        icon: page.icon || '',
        type: 'page',
      }))

      // 插件
      const plugins = pluginStore.plugins.map(plugin => ({
        id: plugin.metadata.id,
        name: plugin.metadata.name,
        description: plugin.metadata.description || '',
        category: '插件',
        tags: plugin.metadata.keywords || [],
        path: plugin.metadata.homepage || '',
        icon: plugin.metadata.icon || '',
        type: 'plugin',
        author: plugin.metadata.author,
        version: plugin.metadata.version,
        state: plugin.state,
      }))

      items.push(...apps, ...pages, ...plugins)
      break
    }
    }

    return items
  }

  // 执行搜索
  const doSearch = (query: string) => {
    if (!query.trim()) {
      searchResults.value = []
      selectedIndex.value = 0
      isSearching.value = false
      return
    }

    isSearching.value = true

    try {
      const items = getSearchItems()
      const searchOptions: SearchOptions = {
        maxResults,
        fuzzyMatch: true,
        pinyinSearch: true,
        caseSensitive: false,
      }

      const results = performSearch(items, query, searchOptions)
      searchResults.value = results
      selectedIndex.value = 0
    } catch (error) {
      console.error('搜索失败:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  // 防抖搜索
  const debouncedSearch = debounce(doSearch, debounceMs)

  // 显示搜索面板
  const show = () => {
    visible.value = true
    selectedIndex.value = 0

    if (enableHistory) {
      recentSearches.value = searchHistory.get()
    }

    // 自动聚焦搜索框
    requestAnimationFrame(() => {
      const searchInput = document.querySelector('#quick-search-input') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    })
  }

  // 隐藏搜索面板
  const hide = () => {
    visible.value = false
    searchQuery.value = ''
    searchResults.value = []
    selectedIndex.value = 0
    isSearching.value = false
  }

  // 选择结果
  const selectResult = (result?: SearchResult) => {
    const target = result || selectedResult.value
    if (!target) return

    // 添加到搜索历史
    if (enableHistory && searchQuery.value.trim()) {
      searchHistory.add(searchQuery.value.trim())
    }

    // 执行相应操作
    if (target.type === 'app') {
      // 启动应用程序
      if (target.path) {
        console.log('启动应用:', target.name, target.path)
        // 使用 Tauri 的 shell API 在新窗口中启动应用
        launchApplication(target.path, target.name)
      }
    } else if (target.type === 'page') {
      // 切换到页面
      const pageIndex = pageStore.pages.findIndex(p => p.id === target.id)
      if (pageIndex !== -1) {
        pageStore.switchToPage(pageIndex)
      }
    } else if (target.type === 'plugin') {
      // 激活或配置插件
      const plugin = pluginStore.plugins.find(p => p.metadata.id === target.id)
      if (plugin) {
        if (plugin.state === 'loaded' || plugin.state === 'inactive') {
          // 激活插件
          pluginStore.activatePlugin(target.id).then(() => {
            console.log('插件已激活:', target.name)
          }).catch((error) => {
            console.error('激活插件失败:', error)
          })
        } else if (plugin.state === 'active') {
          // 插件已激活，可以显示配置界面或其他操作
          console.log('打开插件配置:', target.name)
          // 这里可以触发插件配置界面的显示
        }
      }
    }

    hide()
  }

  // 键盘导航
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (hasResults.value) {
        selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1)
      }
      break

    case 'ArrowUp':
      event.preventDefault()
      if (hasResults.value) {
        selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      }
      break

    case 'Enter':
      event.preventDefault()
      if (!hasQuery.value && recentSearches.value.length > 0) {
        // 没有查询内容时，选择最近搜索
        searchQuery.value = recentSearches.value[selectedIndex.value] || ''
      } else {
        selectResult()
      }
      break

    case 'Escape':
      event.preventDefault()
      hide()
      break

    case 'Tab':
      event.preventDefault()
      if (hasResults.value) {
        selectedIndex.value = (selectedIndex.value + 1) % searchResults.value.length
      }
      break
    }
  }

  // 高亮搜索文本
  const getHighlightedText = (text: string): string => {
    if (!searchQuery.value.trim()) return text
    return highlightText(text, searchQuery.value, 'search-highlight')
  }

  // 清除搜索历史
  const clearHistory = () => {
    searchHistory.clear()
    recentSearches.value = []
  }

  // 移除历史记录项
  const removeFromHistory = (query: string) => {
    searchHistory.remove(query)
    recentSearches.value = searchHistory.get()
  }

  // 使用历史搜索
  const useHistorySearch = (query: string) => {
    searchQuery.value = query
    debouncedSearch(query)
  }

  // 全局快捷键处理
  const handleGlobalKeyDown = (event: KeyboardEvent) => {
    // Ctrl+K 或 Cmd+K 显示搜索
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault()
      if (visible.value) {
        hide()
      } else {
        show()
      }
    }

    // ESC 隐藏搜索
    if (event.key === 'Escape' && visible.value) {
      hide()
    }
  }

  // 监听搜索查询变化
  watch(searchQuery, (newQuery) => {
    if (newQuery.trim()) {
      debouncedSearch(newQuery)
    } else {
      searchResults.value = []
      selectedIndex.value = 0
    }
  })

  // 监听搜索结果变化，重置选中索引
  watch(searchResults, () => {
    selectedIndex.value = 0
  })

  // 生命周期
  onMounted(() => {
    document.addEventListener('keydown', handleGlobalKeyDown)

    if (enableHistory) {
      recentSearches.value = searchHistory.get()
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleGlobalKeyDown)
  })

  return {
    // 状态
    visible,
    searchQuery,
    selectedIndex,
    isSearching,
    searchResults,
    recentSearches,

    // 计算属性
    hasResults,
    hasQuery,
    selectedResult,

    // 方法
    show,
    hide,
    selectResult,
    handleKeyDown,
    getHighlightedText,
    clearHistory,
    removeFromHistory,
    useHistorySearch,
  }
}
