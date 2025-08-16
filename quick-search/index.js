const { createApp } = Vue

// 主应用组件
const QuickSearchApp = {
  name: 'QuickSearchApp',
  template: `
        <div class="quick-search-app min-h-screen">
            <div class="mx-auto">
                <!-- 顶部标题栏 -->
                <HeaderBar
                    :connection-status="connectionStatus"
                    :current-theme="currentTheme"
                    @theme-toggle="handleThemeToggle"
                    @settings-open="handleSettingsOpen"
                />
                
                <!-- 主要内容区域 -->
                <div class="p-6 space-y-6">
                    <!-- 搜索输入框 -->
                    <SearchInput
                        v-model="searchQuery"
                        :placeholder="searchPlaceholder"
                        :autofocus="true"
                        :show-hints="showSearchHints"
                        :hints="searchHints"
                        :is-searching="isSearching"
                        @search="handleSearch"
                        @keydown="handleSearchKeyDown"
                        @clear="handleSearchClear"
                        @hint-select="handleHintSelect"
                    />

                    <!-- 搜索结果列表 -->
                    <ResultList
                        :results="searchResults"
                        :selected-index="selectedIndex"
                        :group-by-category="groupByCategory"
                        :show-category-headers="showCategoryHeaders"
                        :show-score="showScore"
                        :max-results="maxResults"
                        :show-load-more="showLoadMore"
                        :show-empty-state="showEmptyState"
                        :empty-state-type="emptyStateType"
                        @result-select="handleResultSelect"
                        @result-mouseenter="handleResultMouseEnter"
                        @load-more="handleLoadMore"
                    />
                </div>
            </div>
        </div>
    `,

  data() {
    return {
      // 搜索状态
      searchQuery: '',
      searchResults: [],
      selectedIndex: 0,
      isSearching: false,

      // 服务实例
      searchService: null,
      communicationService: null,
      keyboardManager: null,

      // 连接状态
      connectionStatus: 'disconnected',

      // UI 配置
      searchPlaceholder: '搜索应用程序、插件...',
      groupByCategory: false,
      showCategoryHeaders: true,
      showScore: false,
      maxResults: 10,
      showLoadMore: false,
      showEmptyState: true,
      showSearchHints: true,
      currentTheme: 'light',

      // 搜索提示
      searchHints: [],
    }
  },

  computed: {
    emptyStateType() {
      if (this.isSearching) return 'loading'
      if (this.searchQuery.trim()) return 'no-results'
      return 'default'
    },
  },

  async mounted() {
    this.initializeTheme()
    await this.initializeServices()
    this.setupKeyboardHandlers()
    this.loadSearchHints()
  },

  beforeUnmount() {
    this.cleanup()
  },

  methods: {
    /**
         * 初始化服务
         */
    async initializeServices() {
      try {
        // 初始化通信服务
        this.communicationService = new CommunicationService()
        await this.communicationService.initialize()

        // 监听连接状态变化
        this.communicationService.on('initialized', (data) => {
          this.connectionStatus = 'connected'
        })

        this.communicationService.on('error', () => {
          this.connectionStatus = 'error'
        })

        // 初始化搜索服务
        this.searchService = new SearchService()

        // 获取搜索数据
        const searchData = await this.communicationService.getSearchData()
        this.searchService.setSearchData(searchData)

        // 监听搜索数据更新
        this.communicationService.on('search-data-updated', (data) => {
          this.searchService.setSearchData(data)
          if (this.searchQuery.trim()) {
            this.performSearch(this.searchQuery)
          }
        })

        console.log('[应用] 服务初始化完成')
      } catch (error) {
        console.error('[应用] 服务初始化失败:', error)
        this.connectionStatus = 'error'
        // 使用降级数据
        this.searchService = new SearchService()
        this.searchService.setSearchData(this.communicationService?.getFallbackData() || [])
      }
    },

    /**
         * 设置键盘处理器
         */
    setupKeyboardHandlers() {
      this.keyboardManager = new KeyboardManager()
      this.keyboardManager.bind()

      // 导航快捷键
      const navigationHandlers = KeyboardManager.createNavigationHandler({
        onUp: () => this.navigateUp(),
        onDown: () => this.navigateDown(),
        onEnter: () => this.executeSelected(),
        onEscape: () => this.handleEscape(),
        onPageUp: () => this.navigatePageUp(),
        onPageDown: () => this.navigatePageDown(),
        onHome: () => this.navigateHome(),
        onEnd: () => this.navigateEnd(),
      })

      // 注册快捷键
      Object.entries(navigationHandlers).forEach(([key, handler]) => {
        this.keyboardManager.on(key, handler)
      })

      // 其他快捷键
      this.keyboardManager.on('ctrl+r', () => this.refreshData())
      this.keyboardManager.on('f1', () => this.showHelp())
    },

    /**
         * 加载搜索提示
         */
    loadSearchHints() {
      if (this.searchService) {
        this.searchHints = this.searchService.getPopularSearches()
      }
    },

    /**
         * 处理搜索
         */
    handleSearch(query) {
      this.searchQuery = query
      this.performSearch(query)
    },

    /**
         * 执行搜索
         */
    performSearch(query) {
      if (!this.searchService) return

      this.isSearching = true
      this.selectedIndex = 0

      try {
        if (!query.trim()) {
          this.searchResults = []
          this.searchHints = this.searchService.getPopularSearches()
        } else {
          this.searchResults = this.searchService.search(query, {
            maxResults: this.maxResults,
            includeScore: this.showScore,
          })

          // 更新搜索建议
          this.searchHints = this.searchService.getSuggestions(query)
        }
      } catch (error) {
        console.error('[应用] 搜索失败:', error)
        this.searchResults = []
      } finally {
        this.isSearching = false
      }
    },

    /**
         * 处理搜索框按键
         */
    handleSearchKeyDown(event) {
      // 在搜索框中的特殊按键处理已经在 KeyboardManager 中统一处理
    },

    /**
         * 处理搜索清除
         */
    handleSearchClear() {
      this.searchQuery = ''
      this.searchResults = []
      this.selectedIndex = 0
      this.loadSearchHints()
    },

    /**
         * 处理提示选择
         */
    handleHintSelect(hint) {
      this.searchQuery = hint
      this.performSearch(hint)
    },

    /**
         * 处理结果选择
         */
    async handleResultSelect(result) {
      try {
        if (this.communicationService) {
          await this.communicationService.executeResult(result)
          await this.communicationService.closeWindow()
        }
      } catch (error) {
        console.error('[应用] 执行结果失败:', error)
      }
    },

    /**
         * 处理鼠标悬停
         */
    handleResultMouseEnter(result, index) {
      this.selectedIndex = index
    },

    /**
         * 处理加载更多
         */
    handleLoadMore() {
      // 可以扩展为从服务器加载更多结果
      console.log('[应用] 加载更多结果')
    },

    /**
         * 导航 - 上一个
         */
    navigateUp() {
      if (this.searchResults.length > 0) {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1)
      }
    },

    /**
         * 导航 - 下一个
         */
    navigateDown() {
      if (this.searchResults.length > 0) {
        this.selectedIndex = Math.min(this.searchResults.length - 1, this.selectedIndex + 1)
      }
    },

    /**
         * 导航 - 页面上翻
         */
    navigatePageUp() {
      if (this.searchResults.length > 0) {
        this.selectedIndex = Math.max(0, this.selectedIndex - 5)
      }
    },

    /**
         * 导航 - 页面下翻
         */
    navigatePageDown() {
      if (this.searchResults.length > 0) {
        this.selectedIndex = Math.min(this.searchResults.length - 1, this.selectedIndex + 5)
      }
    },

    /**
         * 导航 - 首个
         */
    navigateHome() {
      if (this.searchResults.length > 0) {
        this.selectedIndex = 0
      }
    },

    /**
         * 导航 - 末个
         */
    navigateEnd() {
      if (this.searchResults.length > 0) {
        this.selectedIndex = this.searchResults.length - 1
      }
    },

    /**
         * 执行选中的结果
         */
    executeSelected() {
      if (this.searchResults[this.selectedIndex]) {
        this.handleResultSelect(this.searchResults[this.selectedIndex])
      }
    },

    /**
         * 处理 ESC 键
         */
    handleEscape() {
      if (this.searchQuery.trim()) {
        this.handleSearchClear()
      } else if (this.communicationService) {
        this.communicationService.closeWindow()
      }
    },

    /**
         * 刷新数据
         */
    async refreshData() {
      if (this.communicationService) {
        try {
          await this.communicationService.refreshData()
        } catch (error) {
          console.error('[应用] 刷新数据失败:', error)
        }
      }
    },

    /**
         * 显示帮助
         */
    showHelp() {
      const helpInfo = KeyboardManager.getHelpInfo()
      console.log('[应用] 快捷键帮助:', helpInfo)
      // 可以实现帮助弹窗
    },

    /**
         * 切换主题
         */
    handleThemeToggle() {
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light'
      console.log('[应用] 主题切换为:', this.currentTheme)

      // 应用主题到DOM
      this.applyTheme(this.currentTheme)
    },

    /**
         * 应用主题
         */
    applyTheme(theme) {
      const body = document.body
      const themeLink = document.getElementById('theme-link')

      if (theme === 'dark') {
        body.classList.add('dark')
        if (themeLink) {
          themeLink.href = 'https://unpkg.com/@primeuix/themes@^0.0.5/themes/aura/aura-dark/blue/theme.css'
        }
      } else {
        body.classList.remove('dark')
        if (themeLink) {
          themeLink.href = 'https://unpkg.com/@primeuix/themes@^0.0.5/themes/aura/aura-light/blue/theme.css'
        }
      }

      // 保存主题偏好
      localStorage.setItem('quick-search-theme', theme)
    },

    /**
         * 初始化主题
         */
    initializeTheme() {
      // 从本地存储读取主题偏好，或使用系统偏好
      const savedTheme = localStorage.getItem('quick-search-theme')
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

      this.currentTheme = savedTheme || (systemDark ? 'dark' : 'light')
      this.applyTheme(this.currentTheme)

      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('quick-search-theme')) {
          this.currentTheme = e.matches ? 'dark' : 'light'
          this.applyTheme(this.currentTheme)
        }
      })
    },

    /**
         * 打开设置
         */
    handleSettingsOpen() {
      console.log('[应用] 打开设置')
      // 这里可以实现设置界面
    },

    /**
         * 获取连接状态文本
         */
    getConnectionStatusText() {
      const statusMap = {
        'connected': '已连接',
        'disconnected': '未连接',
        'error': '连接错误',
      }
      return statusMap[this.connectionStatus] || '未知状态'
    },

    /**
         * 清理资源
         */
    cleanup() {
      if (this.keyboardManager) {
        this.keyboardManager.disable()
      }
    },
  },
}

// 创建并配置应用
const app = createApp(QuickSearchApp)

// 配置 PrimeVue
app.use(PrimeVue.Config, {
  theme: {
    preset: PrimeUIX.Themes.Aura,
  },
})

// 注册 PrimeVue 组件
app.component('Badge', PrimeVue.Badge)
app.component('Button', PrimeVue.Button)
app.component('Card', PrimeVue.Card)
app.component('InputText', PrimeVue.InputText)
app.component('Tag', PrimeVue.Tag)

// 注册 PrimeVue 指令
app.directive('tooltip', PrimeVue.Tooltip)

// 注册自定义组件
app.component('HeaderBar', HeaderBar)
app.component('SearchInput', SearchInput)
app.component('ResultItem', ResultItem)
app.component('ResultList', ResultList)
app.component('EmptyState', EmptyState)

// 挂载应用
app.mount('#app')

// 禁用右键菜单和文本选择
document.addEventListener('contextmenu', e => e.preventDefault())
document.addEventListener('selectstart', e => e.preventDefault())