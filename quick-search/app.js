/* eslint-disable vue/no-reserved-component-names */
/* eslint-disable no-undef */
/* eslint-disable indent */
// Vue 3 Quick Search Application
// 基于 CDN 版本的 Vue 3 和 PrimeVue
// 集成Tauri事件通信系统

const { createApp, ref, onMounted, nextTick } = window.Vue

// 主应用组件定义
const QuickSearchApp = {
    template: `
    <div class="quick-search-app">
      <div class="search-container">
        <!-- 搜索输入区域 - 使用SearchInput组件 -->
        <SearchInput
          ref="searchInput"
          @search="handleSearch"
          @keydown="handleKeyNavigation"
          @focus="handleSearchFocus"
          @clear="handleSearchClear"
          placeholder="搜索应用程序、文件或功能..."
          :auto-focus="true"
          :debounce-ms="300"
        />
        
        <!-- 搜索结果区域 -->
        <div class="results-container" ref="resultsContainer">
          <!-- 历史记录面板 - 当没有搜索查询时显示 -->
          <HistoryPanel
            v-if="!searchQuery.trim()"
            :show-history="true"
            :selected-index="selectedIndex"
            :current-query="searchQuery"
            :max-items="10"
            storage-key="quick-search-history"
            @select="handleHistorySelect"
            @selected-index-change="handleSelectedIndexChange"
            @mouse-enter="handleHistoryMouseEnter"
            @mouse-leave="handleHistoryMouseLeave"
            @history-update="handleHistoryUpdate"
          />
          
          <!-- 使用ResultList组件 - 当有搜索查询时显示 -->
          <ResultList
            v-else
            :results="currentResults"
            :selected-index="selectedIndex"
            :search-query="searchQuery"
            :loading="false"
            :empty-state="getEmptyState()"
            :show-score="false"
            :max-visible-items="10"
            @select="handleResultSelect"
            @selected-index-change="handleSelectedIndexChange"
            @mouse-enter="handleResultMouseEnter"
            @mouse-leave="handleResultMouseLeave"
          />
        </div>
      </div>
      
      <!-- 快捷键提示 -->
      <div class="hotkey-hint p-2 text-center border-top-1 surface-border text-sm">
        <span class="hotkey px-2 py-1 border-1 surface-border border-round mr-2">ESC</span> 关闭
        <span class="hotkey px-2 py-1 border-1 surface-border border-round mr-2">↑↓</span> 选择
        <span class="hotkey px-2 py-1 border-1 surface-border border-round">Enter</span> 打开
      </div>
    </div>
  `,

    setup() {
        // 响应式数据定义
        const searchQuery = ref('')
        const searchData = ref([])
        const currentResults = ref([])
        const selectedIndex = ref(-1)
        const searchInput = ref(null)
        const resultsContainer = ref(null)

        // 搜索防抖计时器
        let searchTimeout = null

        // 检查是否在 Tauri 环境中
        const isTauriEnvironment = () => {
            return typeof window !== 'undefined' && window.__TAURI__
        }

        // 初始化数据同步
        const initDataSync = async () => {
            try {
                if (isTauriEnvironment()) {
                    // 在 Tauri 环境中使用事件通信
                    await setupTauriEventListeners()
                    await requestSearchDataTauri()
                } else {
                    // Web 环境中使用 postMessage
                    setupMessageListener()
                    await requestSearchData()
                }
            } catch (error) {
                console.error('数据同步初始化失败:', error)
                // 使用默认数据
                loadFallbackData()
            }
        }

        // 设置 Tauri 事件监听器
        const setupTauriEventListeners = async () => {
            try {
                if (!window.__TAURI__) {
                    throw new Error('Tauri API not available')
                }

                const { webviewWindow } = window.__TAURI__
                const currentWindow = webviewWindow.getCurrentWebviewWindow()

                // 监听来自主窗口的搜索数据
                await currentWindow.listen('search-data-updated', eventData => {
                    console.log('收到搜索数据:', eventData.payload)
                    searchData.value = eventData.payload || []
                    if (searchQuery.value.trim()) {
                        performSearch(searchQuery.value)
                    } else {
                        loadDefaultResults()
                    }
                })

                console.log('Tauri 事件监听器设置完成')
            } catch (error) {
                console.error('设置 Tauri 事件监听器失败:', error)
                // 降级到 postMessage
                setupMessageListener()
            }
        }

        // 通过 Tauri 事件请求搜索数据
        const requestSearchDataTauri = async () => {
            try {
                if (!window.__TAURI__) {
                    throw new Error('Tauri API not available')
                }

                const { event } = window.__TAURI__
                await event.emit('request-search-data', {})
                console.log('已通过 Tauri 事件发送搜索数据请求')
            } catch (error) {
                console.error('Tauri 事件请求失败:', error)
                // 降级到 postMessage
                await requestSearchData()
            }
        }

        // 设置消息监听器
        const setupMessageListener = () => {
            window.addEventListener('message', event => {
                if (event.data && event.data.type === 'search-data-updated') {
                    searchData.value = event.data.payload || []
                    if (searchQuery.value.trim()) {
                        performSearch(searchQuery.value)
                    } else {
                        loadDefaultResults()
                    }
                }
            })
        }

        // 请求主窗口提供搜索数据
        const requestSearchData = async () => {
            try {
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
        }

        // 加载默认搜索数据
        const loadFallbackData = () => {
            searchData.value = [
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
            loadDefaultResults()
        }

        // 加载默认结果
        const loadDefaultResults = () => {
            // 显示默认的热门应用和功能
            const defaultResults = searchData.value.slice(0, 8)
            currentResults.value = defaultResults
        }

        // 处理搜索输入 (替换为SearchInput组件的回调)
        const handleSearch = (query) => {
            searchQuery.value = query
            if (!query.trim()) {
                loadDefaultResults()
            } else {
                performSearch(query)
            }
            selectedIndex.value = -1
        }

        // 搜索焦点事件处理
        const handleSearchFocus = () => {
            // 搜索获得焦点时的处理逻辑
            console.log('Search input focused')
        }

        // 搜索清空事件处理
        const handleSearchClear = () => {
            searchQuery.value = ''
            loadDefaultResults()
            selectedIndex.value = -1
        }

        // 获取空状态配置
        const getEmptyState = () => {
            if (!searchQuery.value.trim()) {
                return {
                    icon: 'pi pi-search',
                    iconColor: '#6b7280',
                    title: '开始输入以搜索',
                    subtitle: '搜索应用程序、文件或功能',
                }
            } else {
                return {
                    icon: 'pi pi-exclamation-circle',
                    iconColor: '#f59e0b',
                    title: '未找到匹配的结果',
                    subtitle: '尝试使用不同的关键词',
                }
            }
        }

        // ResultList 事件处理器
        const handleResultSelect = ({ index }) => {
            selectResult(index)
        }

        const handleSelectedIndexChange = (newIndex) => {
            selectedIndex.value = newIndex
        }

        const handleResultMouseEnter = ({ index, item }) => {
            // 鼠标悬停事件处理
            console.log(`鼠标悬停在结果 ${index}:`, item.name)
        }

        const handleResultMouseLeave = () => {
            // 鼠标离开事件处理
            // 可以在这里添加需要的逻辑
        }

        // HistoryPanel 事件处理器
        const handleHistorySelect = ({ query }) => {
            // 选择历史记录时设置为搜索查询
            searchQuery.value = query
            handleSearch(query)
            selectedIndex.value = -1
        }

        const handleHistoryMouseEnter = ({ index, item }) => {
            // 历史记录鼠标悬停事件
            console.log(`鼠标悬停在历史记录 ${index}:`, item)
        }

        const handleHistoryMouseLeave = () => {
            // 历史记录鼠标离开事件
        }

        const handleHistoryUpdate = (historyItems) => {
            // 历史记录更新事件
            console.log('历史记录已更新:', historyItems.length, '条记录')
        }

        // 处理搜索输入 (保留原有逻辑用于兼容)
        const handleSearchInput = () => {
            // 清除之前的计时器
            if (searchTimeout) {
                clearTimeout(searchTimeout)
            }

            // 防抖搜索
            searchTimeout = setTimeout(() => {
                if (!searchQuery.value.trim()) {
                    loadDefaultResults()
                } else {
                    performSearch(searchQuery.value)
                }
                selectedIndex.value = -1
            }, 300)
        }

        // 执行搜索
        const performSearch = (query) => {
            const queryLower = query.toLowerCase()
            const results = []

            // 遍历所有搜索数据
            for (const item of searchData.value) {
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

                // 插件正则匹配
                if (item.search_regexps && Array.isArray(item.search_regexps)) {
                    for (const pattern of item.search_regexps) {
                        try {
                            const regex = new RegExp(pattern, 'i')
                            if (regex.test(query)) {
                                score += 60
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
            currentResults.value = results.sort((a, b) => b.score - a.score)
        }

        // 处理键盘导航
        const handleKeyNavigation = (event) => {
            const resultCount = currentResults.value.length

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault()
                    selectedIndex.value = Math.min(selectedIndex.value + 1, resultCount - 1)
                    scrollToSelected()
                    break

                case 'ArrowUp':
                    event.preventDefault()
                    selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
                    scrollToSelected()
                    break

                case 'Enter':
                    event.preventDefault()
                    if (selectedIndex.value >= 0) {
                        selectResult(selectedIndex.value)
                    }
                    break

                case 'Escape':
                    event.preventDefault()
                    closeWindow()
                    break
            }
        }

        // 滚动到选中项
        const scrollToSelected = () => {
            nextTick(() => {
                if (selectedIndex.value >= 0) {
                    const resultItems = resultsContainer.value?.querySelectorAll('.result-item')
                    if (resultItems && resultItems[selectedIndex.value]) {
                        resultItems[selectedIndex.value].scrollIntoView({
                            block: 'nearest',
                            behavior: 'smooth',
                        })
                    }
                }
            })
        }

        // 选择结果
        const selectResult = (index) => {
            const result = currentResults.value[index]
            if (!result) return

            console.log('选择结果:', result)

            // 通过事件通信通知主应用
            notifyMainApp(result)

            // 关闭窗口
            closeWindow()
        }

        // 通知主应用
        const notifyMainApp = async (result) => {
            try {
                if (isTauriEnvironment()) {
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
                        window.opener.postMessage({
                            type: 'quick-search-result-selected',
                            data: result,
                        }, '*')
                    } else if (window.parent && window.parent !== window) {
                        window.parent.postMessage({
                            type: 'quick-search-result-selected',
                            data: result,
                        }, '*')
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
                simulateAction(result)
            }
        }

        // 模拟动作
        const simulateAction = (result) => {
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

        // 关闭窗口
        const closeWindow = async () => {
            try {
                if (isTauriEnvironment()) {
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

        // 组件挂载后初始化
        onMounted(async () => {
            // 初始化数据同步
            await initDataSync()

            // 聚焦搜索输入框
            nextTick(() => {
                if (searchInput.value) {
                    searchInput.value.$el.focus()
                }
            })

            // 全局键盘事件监听
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeWindow()
                }
            })
        })

        return {
            searchQuery,
            currentResults,
            selectedIndex,
            searchInput,
            resultsContainer,
            handleSearch,
            handleSearchFocus,
            handleSearchClear,
            handleSearchInput,
            handleKeyNavigation,
            selectResult,
            getEmptyState,
            handleResultSelect,
            handleSelectedIndexChange,
            handleResultMouseEnter,
            handleResultMouseLeave,
            handleHistorySelect,
            handleHistoryMouseEnter,
            handleHistoryMouseLeave,
            handleHistoryUpdate,
        }
    },
}

// 创建 Vue 应用实例
const app = createApp(QuickSearchApp)

// 注意：我们使用独立的主题系统，不需要 PrimeVue 组件
// 只使用 PrimeIcons 图标字体

// 注册自定义组件
app.component('SearchInput', SearchInput)
app.component('ResultList', ResultList)
app.component('HistoryPanel', HistoryPanel)

// 挂载应用
app.mount('#app')

// 禁用右键菜单和文本选择
document.addEventListener('contextmenu', e => e.preventDefault())
document.addEventListener('selectstart', e => e.preventDefault())
