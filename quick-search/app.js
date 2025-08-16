/* eslint-disable no-undef */
/* eslint-disable indent */
// Vue 3 Quick Search Application
// 基于 CDN 版本的 Vue 3 和 PrimeVue
// 集成Tauri事件通信系统

const { createApp, ref, onMounted, onUnmounted, nextTick } = window.Vue

// 主应用组件定义
const QuickSearchApp = {
    template: `
    <div class="quick-search-app">
      <!-- 应用级别操作按钮 -->
      <div class="app-header">
        <div class="header-actions">
          <button 
            @click="handleThemeToggle"
            class="action-button theme-button"
            :title="getThemeButtonTitle()"
          >
            <i :class="getThemeIcon()"></i>
          </button>
          <button 
            @click="handleSettings"
            class="action-button settings-button"
            title="设置"
          >
            <i class="pi pi-cog"></i>
          </button>
          <button 
            @click="handlePin"
            class="action-button pin-button"
            :class="{ 'pinned': isPinned }"
            title="固定窗口"
          >
            <i class="pi pi-thumbtack"></i>
          </button>
        </div>
      </div>
      
      <div class="search-container">
        <!-- 拖拽条移动到search-container顶部 -->
        <div class="drag-indicator" data-tauri-drag-region>
          <div class="drag-bar"></div>
        </div>
        
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
        <div 
          class="results-container" 
          ref="resultsContainer"
          :class="{ 
            'no-results': !searchQuery.trim() && !hasHistoryItems,
            'hidden': !searchQuery.trim() && !hasHistoryItems
          }"
        >
          <!-- 历史记录面板 - 当没有搜索查询时显示 -->
          <HistoryPanel
            v-if="!searchQuery.trim() && hasHistoryItems"
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
            v-else-if="searchQuery.trim()"
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
  `,

    setup() {
        // 响应式数据定义
        const searchQuery = ref('')
        const searchData = ref([])
        const currentResults = ref([])
        const selectedIndex = ref(-1)
        const searchInput = ref(null)
        const resultsContainer = ref(null)
        const hasHistoryItems = ref(false)

        // 主题响应式状态
        const currentTheme = ref('auto')
        const effectiveTheme = ref('light')

        // 搜索防抖计时器
        let searchTimeout = null
        // 请求搜索数据的节流计时器
        let requestDataTimeout = null

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

                const { webviewWindow, event } = window.__TAURI__
                const currentWindow = webviewWindow.getCurrentWebviewWindow()

                // 数据处理函数
                const handleSearchData = (eventData) => {
                    console.log('[QuickSearch] 收到搜索数据事件，来源:', eventData)
                    console.log('[QuickSearch] 事件载荷:', eventData.payload)
                    const receivedData = eventData.payload || []
                    console.log('[QuickSearch] 处理数据条目数:', receivedData.length)

                    // 现在接收到的数据已经是主进程筛选过的结果
                    // 如果有查询词，直接使用筛选后的结果
                    if (searchQuery.value.trim()) {
                        currentResults.value = receivedData
                        console.log('[QuickSearch] 更新搜索结果，当前查询:', searchQuery.value)
                    } else {
                        // 如果没有查询词，将数据存储为原始数据并显示默认结果
                        searchData.value = receivedData
                        loadDefaultResults()
                        console.log('[QuickSearch] 更新原始数据并加载默认结果')
                    }
                }

                // 方法1: 监听窗口特定事件
                await currentWindow.listen('search-data-updated', handleSearchData)
                console.log('窗口事件监听器设置完成')

                // 方法2: 监听全局事件（双重保障）
                await event.listen('search-data-updated', handleSearchData)
                console.log('全局事件监听器设置完成')

                console.log('Tauri 事件监听器设置完成')
            } catch (error) {
                console.error('设置 Tauri 事件监听器失败:', error)
                // 降级到 postMessage
                setupMessageListener()
            }
        }

        // 通过 Tauri 事件请求搜索数据（节流版本）
        const requestSearchDataTauriThrottled = async (query = '') => {
            // 清除之前的计时器
            if (requestDataTimeout) {
                clearTimeout(requestDataTimeout)
            }

            // 节流请求搜索数据
            requestDataTimeout = setTimeout(async () => {
                try {
                    if (!window.__TAURI__) {
                        throw new Error('Tauri API not available')
                    }

                    const { event } = window.__TAURI__
                    await event.emit('request-search-data', { query })
                    console.log('已通过 Tauri 事件发送搜索数据请求, 查询:', query)
                } catch (error) {
                    console.error('Tauri 事件请求失败:', error)
                    // 降级到 postMessage
                    await requestSearchData()
                }
            }, 200) // 200ms 节流延迟
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
                    const receivedData = event.data.payload || []

                    // 处理与 Tauri 事件监听器相同的逻辑
                    if (searchQuery.value.trim()) {
                        currentResults.value = receivedData
                    } else {
                        searchData.value = receivedData
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

            // 在每次输入后节流请求搜索数据
            if (isTauriEnvironment()) {
                requestSearchDataTauriThrottled(query)
            }

            // 不再在这里进行本地搜索，等待主进程返回筛选后的数据
            selectedIndex.value = -1
        }        // 搜索焦点事件处理
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

        // 设置按钮点击处理
        const handleSettings = () => {
            console.log('Settings button clicked')
            // TODO: 实现设置功能
            // 可以打开设置对话框或发送事件到主进程
            if (isTauriEnvironment()) {
                // 在 Tauri 环境中发送设置事件
                try {
                    const { webviewWindow } = window.__TAURI__
                    const currentWindow = webviewWindow.getCurrentWebviewWindow()
                    currentWindow.emit('show-settings')
                } catch (error) {
                    console.error('发送设置事件失败:', error)
                }
            }
        }

        // 主题切换按钮处理
        const handleThemeToggle = () => {
            if (window.themeManager) {
                window.themeManager.toggleTheme()
                // 更新响应式状态
                nextTick(() => {
                    currentTheme.value = window.themeManager.currentTheme
                    effectiveTheme.value = window.themeManager.getEffectiveTheme()
                })
            }
        }

        // 固定按钮状态
        const isPinned = ref(false)

        // 固定按钮点击处理
        const handlePin = () => {
            isPinned.value = !isPinned.value
            console.log('Pin button clicked, pinned:', isPinned.value)
            // TODO: 实现窗口固定功能
            if (isTauriEnvironment()) {
                try {
                    const { webviewWindow } = window.__TAURI__
                    const currentWindow = webviewWindow.getCurrentWebviewWindow()
                    currentWindow.emit('toggle-pin', isPinned.value)
                } catch (error) {
                    console.error('发送固定事件失败:', error)
                }
            }
        }

        // 获取主题图标
        const getThemeIcon = () => {
            if (window.themeManager) {
                const theme = window.themeManager.getEffectiveTheme()
                return theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'
            }
            return 'pi pi-moon'
        }

        // 获取主题按钮标题
        const getThemeButtonTitle = () => {
            if (window.themeManager) {
                const theme = window.themeManager.getEffectiveTheme()
                return theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'
            }
            return '切换主题'
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
            hasHistoryItems.value = historyItems && historyItems.length > 0
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
                // 在搜索执行时也节流请求搜索数据
                if (isTauriEnvironment()) {
                    requestSearchDataTauriThrottled(searchQuery.value)
                }

                // 不再在这里进行本地搜索，等待主进程返回筛选后的数据
                selectedIndex.value = -1
            }, 300)
        }        // 执行搜索 (备用方案，主要搜索逻辑现在在主进程中)
        const performSearch = async (query) => {
            console.log('使用备用搜索逻辑，查询:', query)
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

                // 插件搜索入口匹配
                if (item.search_regexps && Array.isArray(item.search_regexps)) {
                    for (const entry of item.search_regexps) {
                        // 支持新的 PluginSearchEntry 格式
                        if (entry && typeof entry === 'object' && entry.regexps && Array.isArray(entry.regexps)) {
                            // 检查正则匹配
                            let entryMatched = false
                            let matchedRegexp = null
                            for (const pattern of entry.regexps) {
                                try {
                                    const regex = new RegExp(pattern, 'i')
                                    if (regex.test(query)) {
                                        matchedRegexp = pattern
                                        entryMatched = true
                                        break
                                    }
                                } catch (error) {
                                    console.warn('无效的正则表达式:', pattern, error)
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
                                                query: query,
                                                matchedRegexp: matchedRegexp,
                                                matches: query.match(new RegExp(matchedRegexp, 'i'))
                                            },
                                            api: null // 这里可以传入实际的API实例
                                        }
                                        shouldInclude = await entry.parser(context)
                                    } catch (error) {
                                        console.warn('Parser函数执行错误:', error)
                                        shouldInclude = false
                                    }
                                }

                                // 如果通过所有验证，添加结果项
                                if (shouldInclude) {
                                    matched = true
                                    score += 60
                                    // 为每个匹配的搜索入口创建一个结果项
                                    const entryResult = {
                                        ...item,
                                        score: score + 10, // 搜索入口匹配额外加分
                                        searchEntry: {
                                            router: entry.router,
                                            title: entry.title,
                                            icon: entry.icon || item.icon,
                                            tags: entry.tags || item.tags,
                                            runner: entry.runner, // 保存runner函数供执行时使用
                                            matchedRegexp: matchedRegexp
                                        }
                                    }
                                    results.push(entryResult)
                                }
                            }
                        }
                        // 兼容旧的字符串格式
                        else if (typeof entry === 'string') {
                            try {
                                const regex = new RegExp(entry, 'i')
                                if (regex.test(query)) {
                                    score += 60
                                    matched = true
                                }
                            } catch (error) {
                                console.warn('无效的正则表达式:', entry, error)
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

                // 只有在没有通过搜索入口匹配的情况下才添加普通结果
                if (matched && !results.some(r => r.id === item.id && r.searchEntry)) {
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
        const selectResult = async (index) => {
            const result = currentResults.value[index]
            if (!result) return

            console.log('选择结果:', result)

            // 如果结果包含搜索入口的runner函数，先执行runner
            if (result.searchEntry && result.searchEntry.runner && typeof result.searchEntry.runner === 'function') {
                try {
                    const context = {
                        args: {
                            query: searchQuery.value,
                            matchedRegexp: result.searchEntry.matchedRegexp,
                            matches: searchQuery.value.match(new RegExp(result.searchEntry.matchedRegexp, 'i'))
                        },
                        api: null // 这里可以传入实际的API实例
                    }

                    console.log('执行搜索入口runner函数:', result.searchEntry.router)
                    await result.searchEntry.runner(context)

                    // 执行完runner后，仍然通知主应用
                    notifyMainApp(result)
                } catch (error) {
                    console.error('执行runner函数时出错:', error)
                    // 即使runner出错，也继续通知主应用
                    notifyMainApp(result)
                }
            } else {
                // 没有runner函数，直接通知主应用
                notifyMainApp(result)
            }

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
            // 初始化主题状态
            if (window.themeManager) {
                currentTheme.value = window.themeManager.currentTheme
                effectiveTheme.value = window.themeManager.getEffectiveTheme()

                // 监听主题变化事件
                window.addEventListener('themechange', (event) => {
                    currentTheme.value = event.detail.theme
                    effectiveTheme.value = event.detail.effectiveTheme
                })
            }

            // 初始化数据同步
            await initDataSync()

            // 聚焦搜索输入框
            nextTick(() => {
                if (searchInput.value && searchInput.value.focus) {
                    searchInput.value.focus()
                }
            })

            // 全局键盘事件监听
            document.addEventListener('keydown', (e) => {
                // 处理 Ctrl+A 全选
                if (e.ctrlKey && e.key === 'a') {
                    const activeElement = document.activeElement
                    if (activeElement && activeElement.tagName === 'INPUT') {
                        e.preventDefault()
                        activeElement.select()
                        return
                    }
                }

                // 禁用常见的浏览器快捷键（除了F12）
                if (e.ctrlKey && !['F12'].includes(e.key)) {
                    const allowedKeys = ['a', 'c', 'v', 'x', 'z', 'y'] // 基本编辑操作
                    const isInputFocused = document.activeElement && document.activeElement.tagName === 'INPUT'

                    // 如果不是在输入框中，或者不是允许的快捷键，则阻止
                    if (!isInputFocused || !allowedKeys.includes(e.key.toLowerCase())) {
                        // 特殊处理一些常见快捷键
                        if (['j', 'f', 'k', 'r', 't', 'w', 'n'].includes(e.key.toLowerCase())) {
                            e.preventDefault()
                            return
                        }
                    }
                }

                if (e.key === 'Escape') {
                    closeWindow()
                }
            })

            // 监听窗口显示事件，确保每次显示时都聚焦搜索框
            if (isTauriEnvironment()) {
                try {
                    const { webviewWindow } = window.__TAURI__
                    const currentWindow = webviewWindow.getCurrentWebviewWindow()

                    // 监听窗口显示事件
                    await currentWindow.listen('tauri://focus', () => {
                        nextTick(() => {
                            if (searchInput.value && searchInput.value.focus) {
                                searchInput.value.focus()
                            }
                        })
                    })
                } catch (error) {
                    console.error('设置窗口焦点监听失败:', error)
                }
            } else {
                // 在浏览器环境中，监听窗口获得焦点事件
                window.addEventListener('focus', () => {
                    nextTick(() => {
                        if (searchInput.value && searchInput.value.focus) {
                            searchInput.value.focus()
                        }
                    })
                })
            }
        })

        // 组件卸载前清理
        onUnmounted(() => {
            // 清理搜索防抖计时器
            if (searchTimeout) {
                clearTimeout(searchTimeout)
                searchTimeout = null
            }

            // 清理请求数据节流计时器
            if (requestDataTimeout) {
                clearTimeout(requestDataTimeout)
                requestDataTimeout = null
            }

            console.log('计时器已清理')
        })

        return {
            searchQuery,
            currentResults,
            selectedIndex,
            searchInput,
            resultsContainer,
            hasHistoryItems,
            isPinned,
            currentTheme,
            effectiveTheme,
            handleSearch,
            handleSearchFocus,
            handleSearchClear,
            handleSettings,
            handlePin,
            handleThemeToggle,
            getThemeIcon,
            getThemeButtonTitle,
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

// 窗口管理功能
class WindowManager {
    constructor() {
        this.isPinned = false
        this.isVisible = true
        this.init()
    }

    init() {
        this.setupPinButton()
        this.setupFocusHandling()
    }

    setupPinButton() {
        const pinButton = document.getElementById('pin-button')
        if (pinButton) {
            pinButton.addEventListener('click', () => {
                this.togglePin()
            })
        }
    }

    setupFocusHandling() {
        // 监听窗口失焦事件
        window.addEventListener('blur', () => {
            if (!this.isPinned && this.isVisible) {
                this.hideWindow()
            }
        })

        // 监听窗口获焦事件
        window.addEventListener('focus', () => {
            this.isVisible = true
        })

        // 监听键盘事件
        document.addEventListener('keydown', (e) => {
            // ESC 键隐藏窗口
            if (e.key === 'Escape') {
                this.hideWindow()
            }
        })
    }

    togglePin() {
        this.isPinned = !this.isPinned
        const pinButton = document.getElementById('pin-button')

        if (pinButton) {
            if (this.isPinned) {
                pinButton.classList.add('pinned')
                pinButton.title = '取消固定'
            } else {
                pinButton.classList.remove('pinned')
                pinButton.title = '固定窗口'
            }
        }

        console.log(`窗口${this.isPinned ? '已固定' : '已取消固定'}`)
    }

    async hideWindow() {
        return;
        if (this.isPinned) return

        try {
            if (window.__TAURI__) {
                const { webviewWindow } = window.__TAURI__
                const currentWindow = webviewWindow.getCurrentWebviewWindow()
                await currentWindow.hide()
                this.isVisible = false
                console.log('窗口已隐藏')
            } else {
                // 如果不在 Tauri 环境中，最小化到任务栏（备用方案）
                console.log('非 Tauri 环境，无法隐藏窗口')
            }
        } catch (error) {
            console.error('隐藏窗口失败:', error)
        }
    }

    async showWindow() {
        try {
            if (window.__TAURI__) {
                const { webviewWindow } = window.__TAURI__
                const currentWindow = webviewWindow.getCurrentWebviewWindow()
                await currentWindow.show()
                await currentWindow.setFocus()
                this.isVisible = true
                console.log('窗口已显示')
            }
        } catch (error) {
            console.error('显示窗口失败:', error)
        }
    }
}

// 初始化窗口管理器
const windowManager = new WindowManager()

// 导出到全局作用域（如果需要）
window.windowManager = windowManager
