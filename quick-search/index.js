// 从主应用获取搜索数据
let searchData = []

class QuickSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput')
        this.resultsContainer = document.getElementById('resultsContainer')
        this.noResults = document.getElementById('noResults')
        this.selectedIndex = -1
        this.currentResults = []

        this.initEventListeners()
        this.initDataSync()
        this.loadDefaultResults()
    }

    // 检查是否在 Tauri 环境中
    isTauriEnvironment() {
        return typeof window !== 'undefined' && window.__TAURI__
    }

    // 初始化与主窗口的数据同步
    async initDataSync() {
        try {
            if (this.isTauriEnvironment()) {
                // 在 Tauri 环境中使用事件通信
                await this.setupTauriEventListeners()
                await this.requestSearchDataTauri()
            } else {
                // Web 环境中使用 postMessage
                this.setupMessageListener()
                await this.requestSearchData()
            }
        } catch (error) {
            console.error('数据同步初始化失败:', error)
            // 使用默认数据
            this.loadFallbackData()
        }
    }

    // 设置 Tauri 事件监听器
    async setupTauriEventListeners() {
        try {
            // 使用全局 Tauri API
            if (!window.__TAURI__) {
                throw new Error('Tauri API not available')
            }

            const { webviewWindow, event } = window.__TAURI__
            const currentWindow = webviewWindow.getCurrentWebviewWindow()

            // 监听来自主窗口的搜索数据
            await currentWindow.listen('search-data-updated', eventData => {
                console.log('收到搜索数据:', eventData.payload)
                searchData = eventData.payload || []
                if (this.searchInput.value.trim()) {
                    this.handleSearch(this.searchInput.value)
                } else {
                    this.loadDefaultResults()
                }
            })

            console.log('Tauri 事件监听器设置完成')
        } catch (error) {
            console.error('设置 Tauri 事件监听器失败:', error)
            // 降级到 postMessage
            this.setupMessageListener()
        }
    }

    // 通过 Tauri 事件请求搜索数据
    async requestSearchDataTauri() {
        try {
            // 使用全局 Tauri API
            if (!window.__TAURI__) {
                throw new Error('Tauri API not available')
            }

            const { event } = window.__TAURI__
            await event.emit('request-search-data', {})
            console.log('已通过 Tauri 事件发送搜索数据请求')
        } catch (error) {
            console.error('Tauri 事件请求失败:', error)
            // 降级到 postMessage
            await this.requestSearchData()
        }
    }

    // 设置消息监听器
    setupMessageListener() {
        window.addEventListener('message', event => {
            if (event.data && event.data.type === 'search-data-updated') {
                searchData = event.data.payload || []
                if (this.searchInput.value.trim()) {
                    this.handleSearch(this.searchInput.value)
                } else {
                    this.loadDefaultResults()
                }
            }
        })
    }

    // 请求主窗口提供搜索数据
    async requestSearchData() {
        try {
            // 直接使用 postMessage，无论是否在 Tauri 环境中
            if (window.opener) {
                // 如果是弹出窗口
                window.opener.postMessage({ type: 'request-search-data' }, '*')
            } else if (window.parent && window.parent !== window) {
                // 如果是 iframe
                window.parent.postMessage({ type: 'request-search-data' }, '*')
            } else {
                // 尝试通过全局事件
                document.dispatchEvent(new CustomEvent('request-search-data'))
            }

            console.log('已发送搜索数据请求')
        } catch (error) {
            console.error('请求搜索数据失败:', error)
        }
    } // 加载默认搜索数据
    loadFallbackData() {
        searchData = [
            {
                type: 'application',
                title: 'Visual Studio Code',
                description: '代码编辑器',
                icon: '💻',
                path: 'code.exe',
                category: '应用程序',
            },
            {
                type: 'function',
                title: '设置',
                description: '应用程序设置',
                icon: '⚙️',
                action: 'open-settings',
                category: '系统功能',
            },
        ]
    }

    initEventListeners() {
        // 搜索输入事件
        this.searchInput.addEventListener('input', e => {
            this.handleSearch(e.target.value)
        })

        // 键盘导航
        this.searchInput.addEventListener('keydown', e => {
            this.handleKeyNavigation(e)
        })

        // ESC 关闭窗口
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                this.closeWindow()
            }
        })

        // 点击结果项
        this.resultsContainer.addEventListener('click', e => {
            const resultItem = e.target.closest('.result-item')
            if (resultItem) {
                const index = parseInt(resultItem.dataset.index)
                this.selectResult(index)
            }
        })
    }

    loadDefaultResults() {
        // 显示默认的热门应用和功能
        const defaultResults = searchData.slice(0, 8)
        this.displayResults(defaultResults)
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.loadDefaultResults()
            return
        }

        // 通过已加载插件的 search_regexps 进行搜索
        const results = this.performPluginSearch(query)
        this.displayResults(results)
    }

    // 通过插件搜索算法进行搜索
    performPluginSearch(query) {
        const queryLower = query.toLowerCase()
        const results = []

        // 遍历所有搜索数据
        for (const item of searchData) {
            let score = 0
            let matched = false

            // 基础匹配（名称、描述）
            if (item.title && item.title.toLowerCase().includes(queryLower)) {
                score += item.title.toLowerCase() === queryLower ? 100 : 50
                matched = true
            }

            if (
                item.description &&
                item.description.toLowerCase().includes(queryLower)
            ) {
                score += 20
                matched = true
            }

            // 插件正则匹配 - 检查是否有 search_regexps
            if (item.search_regexps && Array.isArray(item.search_regexps)) {
                for (const pattern of item.search_regexps) {
                    try {
                        const regex = new RegExp(pattern, 'i')
                        if (regex.test(query)) {
                            score += 60 // 正则匹配给高分
                            matched = true
                        }
                    } catch (error) {
                        console.warn('无效的正则表达式:', pattern, error)
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

            if (matched) {
                results.push({ ...item, score })
            }
        }

        // 按评分排序
        return results.sort((a, b) => b.score - a.score)
    }

    displayResults(results) {
        this.currentResults = results
        this.selectedIndex = -1

        if (results.length === 0) {
            this.resultsContainer.innerHTML =
                '<div class="no-results">未找到匹配的结果</div>'
            return
        }

        // 按类别分组
        const groupedResults = this.groupByCategory(results)
        let html = ''

        Object.keys(groupedResults).forEach((category, categoryIndex) => {
            if (categoryIndex > 0) {
                html += `<div class="category-divider">${category}</div>`
            }

            groupedResults[category].forEach((result, index) => {
                const globalIndex = results.indexOf(result)
                html += `
                            <div class="result-item" data-index="${globalIndex}">
                                <div class="result-icon">${result.icon}</div>
                                <div class="result-content">
                                    <div class="result-title">${result.title}</div>
                                    <div class="result-description">${result.description}</div>
                                </div>
                            </div>
                        `
            })
        })

        this.resultsContainer.innerHTML = html
    }

    groupByCategory(results) {
        const grouped = {}
        results.forEach(result => {
            const category = result.category || '其他'
            if (!grouped[category]) {
                grouped[category] = []
            }
            grouped[category].push(result)
        })
        return grouped
    }

    handleKeyNavigation(e) {
        const resultItems = this.resultsContainer.querySelectorAll('.result-item')

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                this.selectedIndex = Math.min(
                    this.selectedIndex + 1,
                    resultItems.length - 1,
                )
                this.updateSelection()
                break

            case 'ArrowUp':
                e.preventDefault()
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1)
                this.updateSelection()
                break

            case 'Enter':
                e.preventDefault()
                if (this.selectedIndex >= 0) {
                    this.selectResult(this.selectedIndex)
                }
                break
        }
    }

    updateSelection() {
        const resultItems = this.resultsContainer.querySelectorAll('.result-item')
        resultItems.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex)
        })

        // 滚动到选中项
        if (this.selectedIndex >= 0 && resultItems[this.selectedIndex]) {
            resultItems[this.selectedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
            })
        }
    }

    selectResult(index) {
        const result = this.currentResults[index]
        if (!result) return

        console.log('选择结果:', result)

        // 通过事件通信通知主应用
        this.notifyMainApp(result)

        // 关闭窗口
        this.closeWindow()
    }

    async notifyMainApp(result) {
        try {
            if (this.isTauriEnvironment()) {
                // 在 Tauri 环境中使用事件通信
                if (!window.__TAURI__) {
                    throw new Error('Tauri API not available')
                }

                const { event } = window.__TAURI__
                await event.emit('quick-search-result-selected', result)
                console.log('已通过 Tauri 事件通知主应用选择结果:', result)
            } else {
                // Web 环境中使用 postMessage
                if (window.opener) {
                    window.opener.postMessage(
                        {
                            type: 'quick-search-result-selected',
                            data: result,
                        },
                        '*',
                    )
                } else if (window.parent && window.parent !== window) {
                    window.parent.postMessage(
                        {
                            type: 'quick-search-result-selected',
                            data: result,
                        },
                        '*',
                    )
                } else {
                    document.dispatchEvent(
                        new CustomEvent('quick-search-result-selected', {
                            detail: result,
                        }),
                    )
                }
                console.log('已通过 postMessage 通知主应用选择结果:', result)
            }
        } catch (error) {
            console.error('通知主应用失败:', error)
            this.simulateAction(result)
        }
    }

    simulateAction(result) {
        switch (result.type) {
            case 'application':
                console.log(`启动应用: ${result.title} (${result.path})`)
                break
            case 'function':
                console.log(`执行功能: ${result.action}`)
                break
            case 'file':
                console.log(`打开文件: ${result.path}`)
                break
        }
    }

    async closeWindow() {
        try {
            if (this.isTauriEnvironment()) {
                // 在 Tauri 环境中使用窗口 API
                if (!window.__TAURI__) {
                    throw new Error('Tauri API not available')
                }

                const { webviewWindow } = window.__TAURI__
                const currentWindow = webviewWindow.getCurrentWebviewWindow()
                await currentWindow.close()
                console.log('Tauri 窗口已关闭')
            } else {
                // Web 环境中尝试关闭窗口
                if (window.close) {
                    window.close()
                } else {
                    document.body.style.display = 'none'
                }
            }
        } catch (error) {
            console.error('关闭窗口失败:', error)
            document.body.style.display = 'none'
        }
    }
}

// 初始化快速搜索
document.addEventListener('DOMContentLoaded', () => {
    new QuickSearch()
})

// 禁用右键菜单
document.addEventListener('contextmenu', e => e.preventDefault())

// 禁用选择文本
document.addEventListener('selectstart', e => e.preventDefault())
