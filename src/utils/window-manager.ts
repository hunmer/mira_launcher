/**
 * 窗口管理工具
 * 统一管理 Tauri WebviewWindow 的创建和操作
 */
import router from '@/router'
import { useGridStore } from '@/stores/grid'
import { usePageStore } from '@/stores/page'
import { usePluginStore } from '@/stores/plugin'
import { listen } from '@tauri-apps/api/event'

/**
 * 搜索数据请求事件载荷
 */
interface SearchDataRequestPayload {
    query?: string
}

/**
 * 快速搜索窗口配置
 */
interface QuickSearchWindowOptions {
    width?: number
    height?: number
    center?: boolean
    resizable?: boolean
    decorations?: boolean
    transparent?: boolean
    alwaysOnTop?: boolean
    skipTaskbar?: boolean
    focus?: boolean
    visible?: boolean
    shadow?: boolean
}

/**
 * 默认的快速搜索窗口配置
 */
const DEFAULT_QUICK_SEARCH_OPTIONS: QuickSearchWindowOptions = {
  width: 800,
  height: 600,
  center: true,
  resizable: true,
  decorations: false, // 无边框窗口
  transparent: true,
  alwaysOnTop: true,
  skipTaskbar: true,
  focus: true,
  visible: false, // 先隐藏，加载完成后显示
  shadow: false, // 无阴影
}

// 快速搜索窗口实例
let quickSearchWindow: any = null
let isEventListenersSetup = false

/**
 * 设置事件监听器
 */
async function setupEventListeners() {
  if (isEventListenersSetup) return

  try {
    // 监听来自快速搜索窗口的数据请求
    await listen<SearchDataRequestPayload>('request-search-data', async (event) => {
      console.log('[WindowManager] 收到搜索数据请求:', event.payload)
      const query = event.payload?.query || ''
      const searchData = await getSearchData(query)
      console.log('[WindowManager] 准备发送搜索数据，条目数:', searchData.length)

      // 向快速搜索窗口发送数据 - 使用全局事件和窗口特定事件双重保障
      try {
        // 方法1: 使用全局事件系统
        const { emit } = await import('@tauri-apps/api/event')
        await emit('search-data-updated', searchData)
        console.log('[WindowManager] 通过全局事件发送搜索数据成功')

        // 方法2: 如果窗口实例存在，也通过窗口发送
        if (quickSearchWindow) {
          await quickSearchWindow.emit('search-data-updated', searchData)
          console.log('[WindowManager] 通过窗口实例发送搜索数据成功')
        } else {
          console.warn('[WindowManager] 窗口实例不存在，仅使用全局事件')
        }
      } catch (error) {
        console.error('[WindowManager] 发送搜索数据失败:', error)
      }
    })

    // 监听来自快速搜索窗口的结果选择
    await listen('quick-search-result-selected', async (event) => {
      console.log('[WindowManager] 收到搜索结果选择:', event.payload)
      await handleSearchResult(event.payload)

      // 选择结果后关闭快速搜索窗口
      closeQuickSearchWindow()
    })

    isEventListenersSetup = true
    console.log('[WindowManager] 事件监听器设置完成')
  } catch (error) {
    console.error('[WindowManager] 设置事件监听器失败:', error)
  }
}

/**
 * 获取搜索数据
 * @param query 搜索查询字符串，如果为空则返回所有数据
 */
async function getSearchData(query: string = '') {
  const gridStore = useGridStore()
  const pageStore = usePageStore()
  const pluginStore = usePluginStore()

  const allData = []

  try {
    // 系统功能
    const systemFunctions = [
      {
        id: 'settings',
        type: 'function',
        title: '设置',
        description: '应用程序设置',
        icon: '⚙️',
        action: 'open-settings',
        category: '系统功能',
      },
      {
        id: 'plugins',
        type: 'function',
        title: '插件管理',
        description: '管理已安装的插件',
        icon: '🧩',
        action: 'open-plugins',
        category: '系统功能',
      },
      {
        id: 'downloads',
        type: 'function',
        title: '下载管理',
        description: '查看下载历史',
        icon: '📥',
        action: 'open-downloads',
        category: '系统功能',
      },
    ]
    allData.push(...systemFunctions)

    // 页面数据
    const pages = pageStore.pages.map(page => ({
      id: page.id,
      type: 'page',
      title: page.name,
      description: page.description || '',
      icon: page.icon || '📄',
      path: page.route,
      category: '页面',
      tags: [],
    }))
    allData.push(...pages)

    // 插件数据 - 支持新的 PluginSearchEntry 格式
    const plugins = pluginStore.plugins
      .filter(plugin => plugin.state === 'active')
      .map(plugin => {
        const basePluginData = {
          id: plugin.metadata.id,
          type: 'plugin',
          title: plugin.metadata.name,
          description: plugin.metadata.description || '',
          icon: plugin.metadata.icon || '🧩',
          category: '插件',
          tags: plugin.metadata.keywords || [],
          author: plugin.metadata.author,
          version: plugin.metadata.version,
          state: plugin.state,
          pluginInstance: plugin.instance,
        }

        // 如果插件有搜索入口配置，为每个入口创建单独的搜索项
        if (plugin.instance.search_regexps && Array.isArray(plugin.instance.search_regexps)) {
          const searchEntries = []

          // 添加基础插件项（用于插件名称匹配）
          searchEntries.push({
            ...basePluginData,
            search_regexps: plugin.instance.search_regexps,
          })

          // 为每个搜索入口创建单独的项
          for (const entry of plugin.instance.search_regexps) {
            if (entry && typeof entry === 'object' && entry.regexps && Array.isArray(entry.regexps)) {
              searchEntries.push({
                ...basePluginData,
                id: `${plugin.metadata.id}:${entry.router}`,
                type: 'plugin_entry', // 区分插件入口类型
                title: entry.title || plugin.metadata.name,
                icon: entry.icon || plugin.metadata.icon || '🧩',
                tags: entry.tags || plugin.metadata.keywords || [],
                category: '插件入口',
                searchEntry: {
                  router: entry.router,
                  title: entry.title,
                  icon: entry.icon,
                  tags: entry.tags,
                  regexps: entry.regexps,
                  parser: entry.parser,
                  runner: entry.runner,
                },
                pluginInfo: {
                  id: plugin.metadata.id,
                  name: plugin.metadata.name,
                  icon: plugin.metadata.icon,
                  version: plugin.metadata.version,
                },
              })
            }
          }

          return searchEntries
        } else {
          // 兼容旧格式或没有搜索入口的插件
          return [basePluginData]
        }
      })
      .flat() // 展平数组，因为每个插件可能返回多个项

    allData.push(...plugins)

    // 如果没有查询字符串，返回所有数据
    if (!query.trim()) {
      return allData
    }

    // 执行搜索筛选
    return await performSearch(allData, query)
  } catch (error) {
    console.error('[WindowManager] 获取搜索数据失败:', error)
    return []
  }
}

/**
 * 执行搜索筛选
 * @param data 所有数据
 * @param query 搜索查询
 */
async function performSearch(data: any[], query: string) {
  const queryLower = query.toLowerCase()
  const results = []

  for (const item of data) {
    let score = 0
    let matched = false

    // 基础匹配（名称、描述）
    if (item.title && item.title.toLowerCase().includes(queryLower)) {
      score += item.title.toLowerCase() === queryLower ? 100 : 50
      matched = true
    }

    if (item.description && item.description.toLowerCase().includes(queryLower)) {
      score += 20
      matched = true
    }

    // 插件搜索入口匹配 - 支持新的 PluginSearchEntry 格式
    if (item.type === 'plugin_entry' && item.searchEntry) {
      // 这是一个插件搜索入口项
      const entry = item.searchEntry
      let entryMatched = false
      let matchedRegexp = null

      // 检查正则匹配
      for (const pattern of entry.regexps) {
        try {
          const regex = new RegExp(pattern, 'i')
          if (regex.test(query)) {
            matchedRegexp = pattern
            entryMatched = true
            break
          }
        } catch (error) {
          console.warn(`[WindowManager] 无效的正则表达式: ${pattern}`, error)
        }
      }

      // 如果正则匹配成功，检查是否需要通过parser额外验证
      if (entryMatched) {
        let shouldInclude = true

        // 如果有parser函数，需要额外验证
        if (entry.parser && typeof entry.parser === 'function') {
          try {
            const context = {
              args: {
                query,
                matchedRegexp,
                matches: query.match(new RegExp(matchedRegexp, 'i')),
              },
              api: null, // 这里可以传入实际的API实例
            }
            shouldInclude = await entry.parser(context)
          } catch (error) {
            console.warn('[WindowManager] Parser函数执行错误:', error)
            shouldInclude = false
          }
        }

        if (shouldInclude) {
          score += 80 // 搜索入口匹配给更高分数
          matched = true
          console.log(`[WindowManager] 插件入口 ${item.title} (${entry.router}) 通过正则 ${matchedRegexp} 匹配查询: ${query}`)
        }
      }
    }
    // 插件基础匹配 - 兼容旧格式
    else if (item.type === 'plugin' && item.search_regexps && Array.isArray(item.search_regexps)) {
      for (const pattern of item.search_regexps) {
        // 兼容旧的字符串格式
        if (typeof pattern === 'string') {
          try {
            const regex = new RegExp(pattern, 'i')
            if (regex.test(query)) {
              score += 60
              matched = true
              console.log(`[WindowManager] 插件 ${item.title} 通过正则 ${pattern} 匹配查询: ${query}`)
            }
          } catch (error) {
            console.warn(`[WindowManager] 无效的正则表达式: ${pattern}`, error)
          }
        }
        // 新格式的PluginSearchEntry（用于基础插件项）
        else if (pattern && typeof pattern === 'object' && pattern.regexps) {
          for (const regexp of pattern.regexps) {
            try {
              const regex = new RegExp(regexp, 'i')
              if (regex.test(query)) {
                score += 60
                matched = true
                console.log(`[WindowManager] 插件 ${item.title} 通过入口 ${pattern.router} 的正则 ${regexp} 匹配查询: ${query}`)
              }
            } catch (error) {
              console.warn(`[WindowManager] 无效的正则表达式: ${regexp}`, error)
            }
          }
        }
      }
    }

    // 标签匹配
    if (item.tags && Array.isArray(item.tags)) {
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          score += 15
          matched = true
        }
      }
    }

    // 分类匹配
    if (item.category && item.category.toLowerCase().includes(queryLower)) {
      score += 10
      matched = true
    }

    if (matched) {
      results.push({ ...item, score })
    }
  }

  // 按评分排序并返回
  const sortedResults = results.sort((a, b) => b.score - a.score)
  console.log(`[WindowManager] 搜索 "${query}" 找到 ${sortedResults.length} 个结果`)

  return sortedResults
}

/**
 * 处理搜索结果选择
 */
async function handleSearchResult(result: any) {
  console.log('[WindowManager] 处理搜索结果:', result)

  try {
    switch (result.type) {
    case 'function':
      // 执行系统功能
      handleSystemFunction(result)
      break

    case 'page':
      // 导航到页面
      router.push(result.path)
      break

    case 'plugin':
    case 'plugin_entry':
      // 处理插件搜索入口
      if (result.searchEntry && result.searchEntry.runner && typeof result.searchEntry.runner === 'function') {
        try {
          const context = {
            args: {
              query: '', // 这里可以从搜索上下文获取实际查询
              matchedRegexp: '',
              matches: null,
            },
            api: null, // 这里可以传入实际的API实例
          }

          console.log(`[WindowManager] 执行插件搜索入口 ${result.searchEntry.router} 的 runner 函数`)
          await result.searchEntry.runner(context)
        } catch (error) {
          console.error('[WindowManager] 执行插件搜索入口 runner 函数失败:', error)
        }
      } else {
        // 普通插件操作
        console.log(`插件操作: ${result.title}`)
        // TODO: 实现基础插件交互逻辑
      }
      break
    default:
      console.warn('未知的结果类型:', result.type)
    }
  } catch (error) {
    console.error('[WindowManager] 处理搜索结果失败:', error)
  }
}

/**
 * 处理系统功能
 */
function handleSystemFunction(result: any) {
  switch (result.action) {
  case 'open-settings':
    router.push('/settings')
    break
  case 'open-plugins':
    router.push('/plugins')
    break
  case 'open-downloads':
    router.push('/downloads')
    break
  default:
    console.warn('未知的系统功能:', result.action)
  }
}

/**
 * 打开或聚焦快速搜索窗口
 * @param options 窗口配置选项
 */
export async function openQuickSearchWindow(options: QuickSearchWindowOptions = {}): Promise<void> {
  try {
    // 检查是否在 Tauri 环境中
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
      console.warn('[WindowManager] Not in Tauri environment, using fallback')
      // Web 环境中的备用方案
      const event = new CustomEvent('show-quick-search')
      window.dispatchEvent(event)
      return
    }

    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')

    // 检查快速搜索窗口是否已经存在
    const existingWindow = await WebviewWindow.getByLabel('quick-search')
    if (existingWindow) {
      // 如果窗口已存在，更新窗口实例引用并显示、聚焦
      quickSearchWindow = existingWindow
      await existingWindow.show()
      await existingWindow.setFocus()

      // 发送最新的搜索数据 - 使用双重保障
      const searchData = await getSearchData()

      try {
        // 方法1: 使用全局事件系统
        const { emit } = await import('@tauri-apps/api/event')
        await emit('search-data-updated', searchData)
        console.log('[WindowManager] 通过全局事件发送搜索数据给现有窗口')

        // 方法2: 通过窗口实例发送
        await quickSearchWindow.emit('search-data-updated', searchData)
        console.log('[WindowManager] 通过窗口实例发送搜索数据给现有窗口')
      } catch (emitError) {
        console.error('[WindowManager] 发送数据给现有窗口失败:', emitError)
      }
      console.log('[WindowManager] Quick search window focused and data updated')
      return
    }

    // 合并配置选项
    const windowOptions = { ...DEFAULT_QUICK_SEARCH_OPTIONS, ...options }

    // 获取当前目录路径来加载独立的 HTML 文件
    const quickSearchUrl = window.location.protocol === 'https:'
      ? '/quick-search/index.html'  // 生产环境
      : 'http://localhost:1420/quick-search/index.html'  // 开发环境

    // 创建新的快速搜索窗口
    quickSearchWindow = new WebviewWindow('quick-search', {
      url: quickSearchUrl,
      title: '快速搜索',
      ...windowOptions,
    })

    // 监听窗口事件
    quickSearchWindow.once('tauri://created', () => {
      console.log('[WindowManager] Quick search window created')
    })

    quickSearchWindow.once('tauri://error', (e: any) => {
      console.error('[WindowManager] Quick search window creation failed:', e)
    })

    // 窗口加载完成后显示
    quickSearchWindow.once('tauri://window-created', async () => {
      try {
        // 确保窗口完全透明
        await quickSearchWindow.setDecorations(false)

        // 尝试设置阴影（可能在某些平台上不可用）
        try {
          await quickSearchWindow.setShadow(false)
        } catch (shadowError) {
          console.log('[WindowManager] Shadow setting not available on this platform')
        }

        await quickSearchWindow.show()
        await quickSearchWindow.setFocus()
        console.log('[WindowManager] Quick search window shown and focused')

        // 窗口创建后立即发送初始搜索数据 - 使用双重保障
        const searchData = await getSearchData()

        try {
          // 方法1: 使用全局事件系统
          const { emit } = await import('@tauri-apps/api/event')
          await emit('search-data-updated', searchData)
          console.log('[WindowManager] 通过全局事件发送初始搜索数据')

          // 方法2: 通过窗口实例发送
          await quickSearchWindow.emit('search-data-updated', searchData)
          console.log('[WindowManager] 通过窗口实例发送初始搜索数据')
        } catch (emitError) {
          console.error('[WindowManager] 发送初始搜索数据失败:', emitError)
        }
      } catch (error) {
        console.error('[WindowManager] Failed to show/focus window or send initial data:', error)
      }
    })

    // 设置事件监听器
    await setupEventListeners()

    console.log('[WindowManager] Quick search window creation initiated')
  } catch (error) {
    console.error('[WindowManager] Failed to open quick search window:', error)

    // 备用方案：使用应用内覆盖层
    try {
      const event = new CustomEvent('show-quick-search')
      window.dispatchEvent(event)
      console.log('[WindowManager] Fallback to overlay quick search')
    } catch (fallbackError) {
      console.error('[WindowManager] Fallback also failed:', fallbackError)
      throw fallbackError
    }
  }
}/**
 * 关闭快速搜索窗口
 */
export async function closeQuickSearchWindow(): Promise<void> {
  try {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
      console.warn('[WindowManager] Not in Tauri environment')
      return
    }

    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    const existingWindow = await WebviewWindow.getByLabel('quick-search')

    if (existingWindow) {
      await existingWindow.close()
      quickSearchWindow = null // 清理窗口实例
      console.log('[WindowManager] Quick search window closed')
    }
  } catch (error) {
    console.error('[WindowManager] Failed to close quick search window:', error)
  }
}

/**
 * 检查快速搜索窗口是否存在
 */
export async function isQuickSearchWindowOpen(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
      return false
    }

    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    const existingWindow = await WebviewWindow.getByLabel('quick-search')
    return existingWindow !== null
  } catch (error) {
    console.error('[WindowManager] Failed to check quick search window status:', error)
    return false
  }
}

/**
 * 初始化窗口管理器
 */
export async function initWindowManager() {
  try {
    await setupEventListeners()
    console.log('[WindowManager] 窗口管理器初始化完成')
  } catch (error) {
    console.error('[WindowManager] 窗口管理器初始化失败:', error)
  }
}

