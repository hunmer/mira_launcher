/* eslint-disable indent */
/**
 * Tauri事件通信桥接器
 * 将轻量化Vue组件与现有Tauri事件通信系统集成
 * 提供统一的通信接口和降级方案
 */

class CommunicationBridge {
    constructor() {
        this.isInitialized = false
        this.searchData = []
        this.listeners = new Map()
        this.isTauriEnvironment = false
        this.connectionStatus = 'disconnected'
        this.retryCount = 0
        this.maxRetries = 3

        // 绑定方法
        this.handleSearchDataUpdate = this.handleSearchDataUpdate.bind(this)
        this.handleResultSelection = this.handleResultSelection.bind(this)

        this.init()
    }

    /**
     * 初始化通信桥接器
     */
    async init() {
        try {
            console.log('[CommunicationBridge] 初始化通信桥接器...')

            // 检测Tauri环境
            this.isTauriEnvironment = this.detectTauriEnvironment()
            console.log(`[CommunicationBridge] 运行环境: ${this.isTauriEnvironment ? 'Tauri' : 'Web'}`)

            if (this.isTauriEnvironment) {
                await this.initTauriCommunication()
            } else {
                await this.initWebCommunication()
            }

            // 请求初始数据
            await this.requestSearchData()

            this.isInitialized = true
            this.connectionStatus = 'connected'
            this.emitEvent('communication-ready', {
                environment: this.isTauriEnvironment ? 'tauri' : 'web',
                dataCount: this.searchData.length,
            })

            console.log('[CommunicationBridge] 通信桥接器初始化完成')
        } catch (error) {
            console.error('[CommunicationBridge] 初始化失败:', error)
            this.connectionStatus = 'error'
            this.emitEvent('communication-error', { error: error.message })

            // 尝试降级方案
            await this.initFallbackMode()
        }
    }

    /**
     * 检测是否在Tauri环境中
     */
    detectTauriEnvironment() {
        return typeof window !== 'undefined' &&
            window.__TAURI__ &&
            window.__TAURI__.event &&
            window.__TAURI__.webviewWindow
    }

    /**
     * 初始化Tauri通信
     */
    async initTauriCommunication() {
        try {
            console.log('[CommunicationBridge] 设置Tauri事件监听器...')

            const { webviewWindow } = window.__TAURI__
            const currentWindow = webviewWindow.getCurrentWebviewWindow()

            // 监听搜索数据更新
            await currentWindow.listen('search-data-updated', (eventData) => {
                console.log('[CommunicationBridge] 收到Tauri搜索数据更新:', eventData.payload?.length || 0, '项')
                this.handleSearchDataUpdate(eventData.payload || [])
            })

            console.log('[CommunicationBridge] Tauri事件监听器设置完成')
        } catch (error) {
            console.error('[CommunicationBridge] Tauri通信初始化失败:', error)
            throw error
        }
    }

    /**
     * 初始化Web环境通信
     */
    async initWebCommunication() {
        console.log('[CommunicationBridge] 设置Web消息监听器...')

        // 监听postMessage
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'search-data-updated') {
                console.log('[CommunicationBridge] 收到Web搜索数据更新:', event.data.payload?.length || 0, '项')
                this.handleSearchDataUpdate(event.data.payload || [])
            }
        })

        // 监听自定义事件
        document.addEventListener('search-data-updated', (event) => {
            console.log('[CommunicationBridge] 收到自定义事件搜索数据更新')
            this.handleSearchDataUpdate(event.detail || [])
        })

        console.log('[CommunicationBridge] Web消息监听器设置完成')
    }

    /**
     * 初始化降级模式
     */
    async initFallbackMode() {
        console.log('[CommunicationBridge] 启用降级模式...')

        // 加载默认测试数据
        this.searchData = this.getFallbackData()
        this.connectionStatus = 'fallback'
        this.isInitialized = true

        this.emitEvent('communication-ready', {
            environment: 'fallback',
            dataCount: this.searchData.length,
        })
    }

    /**
     * 请求搜索数据
     */
    async requestSearchData() {
        try {
            if (this.isTauriEnvironment) {
                await this.requestSearchDataTauri()
            } else {
                await this.requestSearchDataWeb()
            }
        } catch (error) {
            console.error('[CommunicationBridge] 请求搜索数据失败:', error)

            // 重试机制
            if (this.retryCount < this.maxRetries) {
                this.retryCount++
                console.log(`[CommunicationBridge] 重试请求搜索数据 (${this.retryCount}/${this.maxRetries})`)
                setTimeout(() => this.requestSearchData(), 1000 * this.retryCount)
            } else {
                console.warn('[CommunicationBridge] 达到最大重试次数，使用降级数据')
                this.handleSearchDataUpdate(this.getFallbackData())
            }
        }
    }

    /**
     * 通过Tauri事件请求搜索数据
     */
    async requestSearchDataTauri() {
        try {
            const { event } = window.__TAURI__
            await event.emit('request-search-data', {
                timestamp: Date.now(),
                source: 'communication-bridge',
            })
            console.log('[CommunicationBridge] 已发送Tauri搜索数据请求')
        } catch (error) {
            console.error('[CommunicationBridge] Tauri搜索数据请求失败:', error)
            throw error
        }
    }

    /**
     * 通过Web方式请求搜索数据
     */
    async requestSearchDataWeb() {
        try {
            const requestData = {
                type: 'request-search-data',
                timestamp: Date.now(),
                source: 'communication-bridge',
            }

            // 尝试多种通信方式
            if (window.opener) {
                window.opener.postMessage(requestData, '*')
            } else if (window.parent && window.parent !== window) {
                window.parent.postMessage(requestData, '*')
            } else {
                document.dispatchEvent(new CustomEvent('request-search-data', { detail: requestData }))
            }

            console.log('[CommunicationBridge] 已发送Web搜索数据请求')
        } catch (error) {
            console.error('[CommunicationBridge] Web搜索数据请求失败:', error)
            throw error
        }
    }

    /**
     * 处理搜索数据更新
     */
    handleSearchDataUpdate(data) {
        try {
            this.searchData = Array.isArray(data) ? data : []
            this.connectionStatus = 'connected'
            this.retryCount = 0 // 重置重试计数

            console.log(`[CommunicationBridge] 搜索数据已更新: ${this.searchData.length} 项`)

            // 通知所有监听器
            this.emitEvent('search-data-updated', {
                data: this.searchData,
                timestamp: Date.now(),
            })
        } catch (error) {
            console.error('[CommunicationBridge] 处理搜索数据更新失败:', error)
        }
    }

    /**
     * 发送结果选择事件
     */
    async sendResultSelection(result) {
        try {
            console.log('[CommunicationBridge] 发送结果选择:', result)

            if (this.isTauriEnvironment) {
                await this.sendResultSelectionTauri(result)
            } else {
                await this.sendResultSelectionWeb(result)
            }

            // 通知本地监听器
            this.emitEvent('result-selected', { result, timestamp: Date.now() })

        } catch (error) {
            console.error('[CommunicationBridge] 发送结果选择失败:', error)

            // 降级到本地处理
            this.handleResultLocally(result)
            throw error
        }
    }

    /**
     * 通过Tauri发送结果选择
     */
    async sendResultSelectionTauri(result) {
        try {
            const { event } = window.__TAURI__
            await event.emit('quick-search-result-selected', result)
            console.log('[CommunicationBridge] 已通过Tauri发送结果选择')
        } catch (error) {
            console.error('[CommunicationBridge] Tauri结果选择发送失败:', error)
            throw error
        }
    }

    /**
     * 通过Web方式发送结果选择
     */
    async sendResultSelectionWeb(result) {
        try {
            const resultData = {
                type: 'quick-search-result-selected',
                data: result,
                timestamp: Date.now(),
            }

            if (window.opener) {
                window.opener.postMessage(resultData, '*')
            } else if (window.parent && window.parent !== window) {
                window.parent.postMessage(resultData, '*')
            } else {
                document.dispatchEvent(new CustomEvent('quick-search-result-selected', { detail: result }))
            }

            console.log('[CommunicationBridge] 已通过Web发送结果选择')
        } catch (error) {
            console.error('[CommunicationBridge] Web结果选择发送失败:', error)
            throw error
        }
    }

    /**
     * 本地处理结果选择
     */
    handleResultLocally(result) {
        console.log('[CommunicationBridge] 本地处理结果:', result)

        switch (result.type) {
            case 'application':
                console.log(`[本地模拟] 启动应用: ${result.title} (${result.path || '未知路径'})`)
                break
            case 'function':
                console.log(`[本地模拟] 执行功能: ${result.action || result.title}`)
                break
            case 'page':
                console.log(`[本地模拟] 导航到页面: ${result.path || result.title}`)
                break
            case 'plugin':
                console.log(`[本地模拟] 插件操作: ${result.title}`)
                break
            case 'file':
                console.log(`[本地模拟] 打开文件: ${result.path || result.title}`)
                break
            default:
                console.log(`[本地模拟] 未知操作类型: ${result.type}`, result)
        }
    }

    /**
     * 关闭窗口
     */
    async closeWindow() {
        try {
            console.log('[CommunicationBridge] 关闭窗口...')

            if (this.isTauriEnvironment) {
                const { webviewWindow } = window.__TAURI__
                const currentWindow = webviewWindow.getCurrentWebviewWindow()
                await currentWindow.close()
                console.log('[CommunicationBridge] Tauri窗口已关闭')
            } else {
                // Web环境降级方案
                if (window.close && !window.opener) {
                    // 尝试关闭窗口（可能不会成功）
                    window.close()
                }

                // 隐藏页面内容作为降级
                document.body.style.display = 'none'

                // 通知父窗口
                const closeEvent = { type: 'window-close-requested', timestamp: Date.now() }
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage(closeEvent, '*')
                }

                console.log('[CommunicationBridge] Web窗口关闭请求已发送')
            }

            this.emitEvent('window-closing', { timestamp: Date.now() })

        } catch (error) {
            console.error('[CommunicationBridge] 关闭窗口失败:', error)
            // 强制隐藏内容
            document.body.style.display = 'none'
        }
    }

    /**
     * 获取降级数据
     */
    getFallbackData() {
        return [
            {
                id: 'vscode',
                type: 'application',
                title: 'Visual Studio Code',
                description: '强大的代码编辑器',
                icon: '💻',
                path: 'code.exe',
                category: '应用程序',
                tags: ['编程', '开发', '编辑器'],
                score: 100,
            },
            {
                id: 'chrome',
                type: 'application',
                title: 'Google Chrome',
                description: '快速安全的网络浏览器',
                icon: '🌐',
                path: 'chrome.exe',
                category: '应用程序',
                tags: ['浏览器', '网络'],
                score: 95,
            },
            {
                id: 'settings',
                type: 'function',
                title: '设置',
                description: '应用程序设置',
                icon: '⚙️',
                action: 'open-settings',
                category: '系统功能',
                tags: ['配置', '选项'],
                score: 90,
            },
            {
                id: 'plugins',
                type: 'function',
                title: '插件管理',
                description: '管理已安装的插件',
                icon: '🧩',
                action: 'open-plugins',
                category: '系统功能',
                tags: ['插件', '扩展'],
                score: 85,
            },
            {
                id: 'downloads',
                type: 'function',
                title: '下载管理',
                description: '查看下载历史',
                icon: '📥',
                action: 'open-downloads',
                category: '系统功能',
                tags: ['下载', '历史'],
                score: 80,
            },
        ]
    }

    /**
     * 执行搜索
     */
    search(query) {
        if (!query || !query.trim()) {
            return this.searchData.slice(0, 10) // 返回前10个作为默认结果
        }

        const queryLower = query.toLowerCase()
        const results = []

        for (const item of this.searchData) {
            let score = 0
            let matched = false

            // 标题匹配
            if (item.title && item.title.toLowerCase().includes(queryLower)) {
                score += item.title.toLowerCase() === queryLower ? 100 : 50
                matched = true
            }

            // 描述匹配
            if (item.description && item.description.toLowerCase().includes(queryLower)) {
                score += 20
                matched = true
            }

            // 插件正则匹配
            if (item.search_regexps && Array.isArray(item.search_regexps)) {
                for (const pattern of item.search_regexps) {
                    try {
                        const regex = new RegExp(pattern, 'i')
                        if (regex.test(query)) {
                            score += 60
                            matched = true
                            break
                        }
                    } catch (error) {
                        console.warn('[CommunicationBridge] 无效正则表达式:', pattern)
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

            // 类别匹配
            if (item.category && item.category.toLowerCase().includes(queryLower)) {
                score += 10
                matched = true
            }

            if (matched) {
                results.push({ ...item, searchScore: score })
            }
        }

        // 按评分排序，然后按原始score排序
        return results.sort((a, b) => {
            if (b.searchScore !== a.searchScore) {
                return b.searchScore - a.searchScore
            }
            return (b.score || 0) - (a.score || 0)
        })
    }

    /**
     * 事件发射器
     */
    emitEvent(eventName, data) {
        const event = new CustomEvent(`communication-bridge:${eventName}`, {
            detail: data,
        })
        window.dispatchEvent(event)

        // 同时触发简化的事件名
        const simpleEvent = new CustomEvent(eventName, {
            detail: data,
        })
        window.dispatchEvent(simpleEvent)
    }

    /**
     * 事件监听器
     */
    addEventListener(eventName, callback) {
        const fullEventName = `communication-bridge:${eventName}`
        window.addEventListener(fullEventName, callback)

        // 返回清理函数
        return () => {
            window.removeEventListener(fullEventName, callback)
        }
    }

    /**
     * 获取连接状态
     */
    getConnectionStatus() {
        return {
            status: this.connectionStatus,
            environment: this.isTauriEnvironment ? 'tauri' : 'web',
            isInitialized: this.isInitialized,
            dataCount: this.searchData.length,
            retryCount: this.retryCount,
        }
    }

    /**
     * 获取搜索数据
     */
    getSearchData() {
        return [...this.searchData]
    }

    /**
     * 手动刷新数据
     */
    async refreshData() {
        console.log('[CommunicationBridge] 手动刷新数据...')
        this.retryCount = 0
        await this.requestSearchData()
    }

    /**
     * 销毁通信桥接器
     */
    destroy() {
        console.log('[CommunicationBridge] 销毁通信桥接器...')

        this.listeners.clear()
        this.searchData = []
        this.isInitialized = false
        this.connectionStatus = 'disconnected'

        this.emitEvent('communication-destroyed', { timestamp: Date.now() })
    }
}

// 全局通信桥接器实例
let globalCommunicationBridge = null

/**
 * 获取或创建全局通信桥接器实例
 */
function getCommunicationBridge() {
    if (!globalCommunicationBridge) {
        globalCommunicationBridge = new CommunicationBridge()
    }
    return globalCommunicationBridge
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.CommunicationBridge = CommunicationBridge
    window.getCommunicationBridge = getCommunicationBridge
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CommunicationBridge,
        getCommunicationBridge,
    }
}
