/**
 * 搜索结果列表组件
 * 管理多个 ResultItem 组件
 */
const ResultList = {
  name: 'ResultList',
  template: `
        <div class="result-list" v-if="shouldShowList">
            <!-- 结果列表 -->
            <div v-if="results.length > 0" class="space-y-3 results-container bg-white/10 backdrop-blur-sm rounded-xl p-4 max-h-96 overflow-y-auto">
                <!-- 按类别分组显示 -->
                <template v-if="groupByCategory">
                    <div v-for="(group, category) in groupedResults" :key="category" class="result-group">
                        <!-- 类别标题 -->
                        <div v-if="showCategoryHeaders" class="category-header sticky top-0 bg-white/20 backdrop-blur-sm py-2 px-3 mb-3 rounded-lg">
                            <h4 class="text-sm font-medium text-white border-l-2 border-white/50 pl-2">
                                {{ category }} ({{ group.length }})
                            </h4>
                        </div>
                        
                        <!-- 该类别的结果项 -->
                        <ResultItem
                            v-for="(result, index) in group"
                            :key="getResultKey(result, index)"
                            :result="result"
                            :index="getGlobalIndex(result)"
                            :is-selected="getGlobalIndex(result) === selectedIndex"
                            :show-score="showScore"
                            @click="handleResultClick"
                            @mouseenter="handleResultMouseEnter"
                            @select="handleResultSelect"
                        />
                    </div>
                </template>
                
                <!-- 不分组显示 -->
                <template v-else>
                    <ResultItem
                        v-for="(result, index) in visibleResults"
                        :key="getResultKey(result, index)"
                        :result="result"
                        :index="index"
                        :is-selected="index === selectedIndex"
                        :show-score="showScore"
                        @click="handleResultClick"
                        @mouseenter="handleResultMouseEnter"
                        @select="handleResultSelect"
                    />
                </template>
                
                <!-- 加载更多按钮 -->
                <div v-if="hasMore && showLoadMore" class="text-center py-4">
                    <Button 
                        label="加载更多" 
                        severity="secondary" 
                        size="small"
                        @click="loadMore"
                        :loading="isLoadingMore"
                    />
                </div>
            </div>

            <!-- 无结果状态 -->
            <EmptyState v-else-if="showEmptyState" :type="emptyStateType" />
        </div>
    `,

  props: {
    results: {
      type: Array,
      default: () => [],
    },
    selectedIndex: {
      type: Number,
      default: 0,
    },
    groupByCategory: {
      type: Boolean,
      default: false,
    },
    showCategoryHeaders: {
      type: Boolean,
      default: true,
    },
    showScore: {
      type: Boolean,
      default: false,
    },
    maxResults: {
      type: Number,
      default: 10,
    },
    showLoadMore: {
      type: Boolean,
      default: false,
    },
    showEmptyState: {
      type: Boolean,
      default: true,
    },
    emptyStateType: {
      type: String,
      default: 'no-results',
    },
  },

  emits: ['result-click', 'result-select', 'result-mouseenter', 'load-more'],

  data() {
    return {
      isLoadingMore: false,
      currentLimit: this.maxResults,
    }
  },

  computed: {
    shouldShowList() {
      return this.results.length > 0
    },

    visibleResults() {
      return this.results.slice(0, this.currentLimit)
    },

    hasMore() {
      return this.results.length > this.currentLimit
    },

    groupedResults() {
      if (!this.groupByCategory) return {}

      const groups = {}
      this.visibleResults.forEach(result => {
        const category = result.category || this.getCategoryByType(result.type) || '其他'
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(result)
      })

      // 按类别排序
      const sortedGroups = {}
      const categoryOrder = ['系统功能', '应用程序', '插件', '入口', '文件', '其他']
      categoryOrder.forEach(category => {
        if (groups[category]) {
          sortedGroups[category] = groups[category]
        }
      })

      // 添加未在排序列表中的类别
      Object.keys(groups).forEach(category => {
        if (!sortedGroups[category]) {
          sortedGroups[category] = groups[category]
        }
      })

      return sortedGroups
    },
  },

  mounted() {
    // 支持键盘导航
    document.addEventListener('keydown', this.handleKeyNavigation)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyNavigation)
  },
  methods: {
    handleResultClick(result, index) {
      this.$emit('result-click', result, index)
    },

    handleResultSelect(result, index) {
      this.$emit('result-select', result, index)
    },

    handleResultMouseEnter(result, index) {
      this.$emit('result-mouseenter', result, index)
    },

    async loadMore() {
      this.isLoadingMore = true
      this.currentLimit += this.maxResults
      this.$emit('load-more')

      // 模拟加载延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      this.isLoadingMore = false
    },

    getResultKey(result, index) {
      return result.id || result.title || result.name || index
    },

    getGlobalIndex(result) {
      return this.results.findIndex(r => r === result)
    },

    getCategoryByType(type) {
      const categoryMap = {
        'system': '系统功能',
        'application': '应用程序',
        'plugin': '插件',
        'plugin_entry': '入口',
        'file': '文件',
        'page': '页面',
        'function': '系统功能',
      }
      return categoryMap[type]
    },

    scrollToSelected() {
      this.$nextTick(() => {
        const selectedElement = this.$el.querySelector('.result-item.ring-2')
        if (selectedElement) {
          selectedElement.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          })
        }
      })
    },

    resetScroll() {
      this.currentLimit = this.maxResults
    },

    handleKeyNavigation(event) {
      const count = this.visibleResults.length
      if (!count) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        this.$emit('result-mouseenter', this.visibleResults[Math.min(this.selectedIndex + 1, count - 1)], Math.min(this.selectedIndex + 1, count - 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        this.$emit('result-mouseenter', this.visibleResults[Math.max(this.selectedIndex - 1, 0)], Math.max(this.selectedIndex - 1, 0))
      } else if (event.key === 'Tab') {
        event.preventDefault()
        this.$emit('result-mouseenter', this.visibleResults[(this.selectedIndex + 1) % count], (this.selectedIndex + 1) % count)
      }
    },
  },

  watch: {
    selectedIndex() {
      this.scrollToSelected()
    },

    results() {
      this.resetScroll()
    },
  },
}

// 导出组件
if (typeof window !== 'undefined') {
  window.ResultList = ResultList
}
