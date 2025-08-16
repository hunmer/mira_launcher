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
    shadow: false // 无阴影
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
            const query = event.payload?.query || ''
            const searchData = await getSearchData(query)

            // 向快速搜索窗口发送数据
            if (quickSearchWindow) {
                try {
                    await quickSearchWindow.emit('search-data-updated', searchData)
                } catch (error) {
                    console.error('[WindowManager] 发送搜索数据失败:', error)
                }
            }
        })

        // 监听来自快速搜索窗口的结果选择
        await listen('quick-search-result-selected', (event) => {
            console.log('[WindowManager] 收到搜索结果选择:', event.payload)
            handleSearchResult(event.payload)

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
        // 应用程序数据
        const apps = gridStore.items.map(item => ({
            id: item.id,
            type: 'application',
            title: item.name,
            description: item.description || '',
            icon: item.icon || '📱',
            path: item.path,
            category: '应用程序',
            tags: []
        }))
        allData.push(...apps)

        // 系统功能
        const systemFunctions = [
            {
                id: 'settings',
                type: 'function',
                title: '设置',
                description: '应用程序设置',
                icon: '⚙️',
                action: 'open-settings',
                category: '系统功能'
            },
            {
                id: 'plugins',
                type: 'function',
                title: '插件管理',
                description: '管理已安装的插件',
                icon: '🧩',
                action: 'open-plugins',
                category: '系统功能'
            },
            {
                id: 'downloads',
                type: 'function',
                title: '下载管理',
                description: '查看下载历史',
                icon: '📥',
                action: 'open-downloads',
                category: '系统功能'
            }
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
            tags: []
        }))
        allData.push(...pages)

        // 插件数据 - 包含 search_regexps
        const plugins = pluginStore.plugins
            .filter(plugin => plugin.state === 'active')
            .map(plugin => ({
                id: plugin.metadata.id,
                type: 'plugin',
                title: plugin.metadata.name,
                description: plugin.metadata.description || '',
                icon: plugin.metadata.icon || '🧩',
                category: '插件',
                tags: plugin.metadata.keywords || [],
                search_regexps: plugin.metadata.search_regexps || [], // 插件自定义搜索正则
                author: plugin.metadata.author,
                version: plugin.metadata.version,
                state: plugin.state
            }))
        allData.push(...plugins)

        // 如果没有查询字符串，返回所有数据
        if (!query.trim()) {
            return allData
        }

        // 执行搜索筛选
        return performSearch(allData, query)
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
function performSearch(data: any[], query: string) {
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

        // 插件正则匹配 - 只对插件类型进行正则匹配
        if (item.type === 'plugin' && item.search_regexps && Array.isArray(item.search_regexps)) {
            for (const pattern of item.search_regexps) {
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
function handleSearchResult(result: any) {
    console.log('[WindowManager] 处理搜索结果:', result)

    try {
        switch (result.type) {
            case 'application':
                // 启动应用程序
                console.log(`启动应用: ${result.title}`)
                // TODO: 实现应用启动逻辑
                break

            case 'function':
                // 执行系统功能
                handleSystemFunction(result)
                break

            case 'page':
                // 导航到页面
                router.push(result.path)
                break

            case 'plugin':
                // 插件相关操作
                console.log(`插件操作: ${result.title}`)
                // TODO: 实现插件交互逻辑
                break

            case 'file':
                // 打开文件
                console.log(`打开文件: ${result.path}`)
                // TODO: 实现文件打开逻辑
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

            // 发送最新的搜索数据
            const searchData = await getSearchData()
            await quickSearchWindow.emit('search-data-updated', searchData)
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
            ...windowOptions
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

                // 窗口创建后立即发送初始搜索数据
                const searchData = await getSearchData()
                await quickSearchWindow.emit('search-data-updated', searchData)
                console.log('[WindowManager] 初始搜索数据已发送')
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

