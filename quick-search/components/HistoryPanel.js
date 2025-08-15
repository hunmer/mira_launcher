/* eslint-disable indent */
/**
 * HistoryPanel 历史记录面板组件
 * 功能：搜索历史展示、选择和管理功能
 */

// SearchHistory 类实现 (从原utils/search.ts移植)
class SearchHistory {
    constructor(key = 'quick-search-history', maxSize = 10) {
        this.key = key
        this.maxSize = maxSize
    }

    get() {
        try {
            const stored = localStorage.getItem(this.key)
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    }

    add(query) {
        if (!query.trim()) return

        const history = this.get()
        const index = history.indexOf(query)

        if (index > -1) {
            history.splice(index, 1)
        }

        history.unshift(query)

        if (history.length > this.maxSize) {
            history.splice(this.maxSize)
        }

        try {
            localStorage.setItem(this.key, JSON.stringify(history))
        } catch {
            // 忽略存储错误
        }
    }

    remove(query) {
        const history = this.get()
        const index = history.indexOf(query)

        if (index > -1) {
            history.splice(index, 1)
            try {
                localStorage.setItem(this.key, JSON.stringify(history))
            } catch {
                // 忽略存储错误
            }
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.key)
        } catch {
            // 忽略存储错误
        }
    }
}

const HistoryPanel = {
    template: `
    <div class="history-panel" v-if="showHistory && historyItems.length > 0">
      <!-- 历史记录头部 -->
      <div class="history-header">
        <div class="history-title">
          <i class="pi pi-history"></i>
          <span>最近搜索</span>
        </div>
        <div class="history-actions">
          <button 
            @click="clearAllHistory"
            class="clear-all-btn"
            title="清空所有历史记录"
          >
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>
      
      <!-- 历史记录列表 -->
      <div class="history-list">
        <div
          v-for="(item, index) in historyItems"
          :key="item"
          :class="getHistoryItemClass(index)"
          @click="selectHistory(item, index)"
          @mouseenter="updateSelectedIndex(index)"
          @mouseleave="handleMouseLeave"
          :data-index="index"
        >
          <!-- 历史记录图标 -->
          <div class="history-icon">
            <i class="pi pi-clock"></i>
          </div>
          
          <!-- 历史记录内容 -->
          <div class="history-content">
            <div class="history-query" v-html="highlightQuery(item)">
              {{ item }}
            </div>
            <div class="history-meta">
              <span class="search-count" v-if="getSearchCount(item) > 1">
                搜索了 {{ getSearchCount(item) }} 次
              </span>
            </div>
          </div>
          
          <!-- 历史记录操作 -->
          <div class="history-actions">
            <button
              @click.stop="removeHistory(item)"
              class="remove-btn"
              title="删除此历史记录"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="historyItems.length === 0" class="history-empty">
        <div class="empty-icon">
          <i class="pi pi-clock"></i>
        </div>
        <div class="empty-text">暂无搜索历史</div>
      </div>
    </div>
  `,

    props: {
        showHistory: {
            type: Boolean,
            default: true,
        },
        selectedIndex: {
            type: Number,
            default: -1,
        },
        currentQuery: {
            type: String,
            default: '',
        },
        maxItems: {
            type: Number,
            default: 10,
        },
        storageKey: {
            type: String,
            default: 'quick-search-history',
        },
    },

    emits: ['select', 'selectedIndexChange', 'mouseEnter', 'mouseLeave', 'historyUpdate'],

    setup(props, { emit }) {
        const { ref, computed, watch, onMounted } = window.Vue

        // 响应式数据
        const historyItems = ref([])
        const searchHistory = new SearchHistory(props.storageKey, props.maxItems)

        // 搜索计数器 (用于统计每个查询的使用频率)
        const searchCounts = ref({})

        // 加载历史记录
        const loadHistory = () => {
            historyItems.value = searchHistory.get()
            emit('historyUpdate', historyItems.value)
        }

        // 加载搜索计数
        const loadSearchCounts = () => {
            try {
                const countKey = `${props.storageKey}-counts`
                const stored = localStorage.getItem(countKey)
                searchCounts.value = stored ? JSON.parse(stored) : {}
            } catch {
                searchCounts.value = {}
            }
        }

        // 保存搜索计数
        const saveSearchCounts = () => {
            try {
                const countKey = `${props.storageKey}-counts`
                localStorage.setItem(countKey, JSON.stringify(searchCounts.value))
            } catch {
                // 忽略存储错误
            }
        }

        // 获取历史项样式类
        const getHistoryItemClass = (index) => {
            return [
                'history-item',
                {
                    'history-item-selected': index === props.selectedIndex,
                    'history-item-odd': index % 2 === 1,
                },
            ]
        }

        // 高亮查询文本
        const highlightQuery = (query) => {
            if (!props.currentQuery.trim() || !query.includes(props.currentQuery)) {
                return query
            }

            const regex = new RegExp(`(${escapeRegExp(props.currentQuery)})`, 'gi')
            return query.replace(regex, '<span class="highlight">$1</span>')
        }

        // 转义正则表达式特殊字符
        const escapeRegExp = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        }

        // 获取搜索次数
        const getSearchCount = (query) => {
            return searchCounts.value[query] || 1
        }

        // 选择历史记录
        const selectHistory = (query, index) => {
            // 增加搜索计数
            searchCounts.value[query] = (searchCounts.value[query] || 0) + 1
            saveSearchCounts()

            // 将选中的历史记录移到最前面
            searchHistory.add(query)
            loadHistory()

            emit('select', { query, index })
        }

        // 删除历史记录
        const removeHistory = (query) => {
            searchHistory.remove(query)

            // 删除对应的搜索计数
            if (searchCounts.value[query]) {
                delete searchCounts.value[query]
                saveSearchCounts()
            }

            loadHistory()
        }

        // 清空所有历史记录
        const clearAllHistory = () => {
            searchHistory.clear()
            searchCounts.value = {}
            saveSearchCounts()
            loadHistory()
        }

        // 添加历史记录
        const addHistory = (query) => {
            if (!query.trim()) return

            searchHistory.add(query)

            // 增加搜索计数
            searchCounts.value[query] = (searchCounts.value[query] || 0) + 1
            saveSearchCounts()

            loadHistory()
        }

        // 更新选中索引
        const updateSelectedIndex = (index) => {
            if (props.selectedIndex !== index) {
                emit('selectedIndexChange', index)
                emit('mouseEnter', { index, item: historyItems.value[index] })
            }
        }

        // 鼠标离开处理
        const handleMouseLeave = () => {
            emit('mouseLeave')
        }

        // 获取历史记录数量
        const getHistoryCount = () => {
            return historyItems.value.length
        }

        // 检查是否有历史记录
        const hasHistory = computed(() => {
            return historyItems.value.length > 0
        })

        // 获取热门搜索 (按搜索次数排序)
        const getPopularSearches = (limit = 5) => {
            const searches = historyItems.value.map(query => ({
                query,
                count: searchCounts.value[query] || 1,
            }))

            return searches
                .sort((a, b) => b.count - a.count)
                .slice(0, limit)
                .map(item => item.query)
        }

        // 监听历史记录变化
        watch(historyItems, (newItems) => {
            emit('historyUpdate', newItems)
        }, { deep: true })

        // 组件挂载时初始化
        onMounted(() => {
            loadHistory()
            loadSearchCounts()
        })

        // 暴露给外部的方法
        return {
            historyItems,
            searchCounts,
            hasHistory,
            getHistoryItemClass,
            highlightQuery,
            getSearchCount,
            selectHistory,
            removeHistory,
            clearAllHistory,
            addHistory,
            updateSelectedIndex,
            handleMouseLeave,
            loadHistory,
            getHistoryCount,
            getPopularSearches,
        }
    },
}

// 导出组件
if (typeof window !== 'undefined') {
    window.HistoryPanel = HistoryPanel
}
