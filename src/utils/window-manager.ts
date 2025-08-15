/**
 * 窗口管理工具
 * 统一管理 Tauri WebviewWindow 的创建和操作
 */

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
    visible: false // 先隐藏，加载完成后显示
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
            // 如果窗口已存在，显示并聚焦
            await existingWindow.show()
            await existingWindow.setFocus()
            console.log('[WindowManager] Quick search window focused')
            return
        }

        // 合并配置选项
        const windowOptions = { ...DEFAULT_QUICK_SEARCH_OPTIONS, ...options }

        // 创建新的快速搜索窗口
        const quickSearchWindow = new WebviewWindow('quick-search', {
            url: '/quick-search',
            title: '快速搜索',
            ...windowOptions
        })

        // 监听窗口事件
        quickSearchWindow.once('tauri://created', () => {
            console.log('[WindowManager] Quick search window created')
        })

        quickSearchWindow.once('tauri://error', (e) => {
            console.error('[WindowManager] Quick search window creation failed:', e)
        })

        // 窗口加载完成后显示
        quickSearchWindow.once('tauri://window-created', async () => {
            try {
                await quickSearchWindow.show()
                await quickSearchWindow.setFocus()
                console.log('[WindowManager] Quick search window shown and focused')
            } catch (error) {
                console.error('[WindowManager] Failed to show/focus window:', error)
            }
        })

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
}

/**
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
