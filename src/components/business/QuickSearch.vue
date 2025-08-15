<template>
  <!-- 搜索覆盖层 -->
  <Teleport to="body">
    <div v-if="visible"
      class="quick-search-overlay fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black bg-opacity-50 backdrop-blur-sm"
      @click="hide" @keydown="handleKeyDown">
      <!-- 搜索面板 -->
      <div
        class="quick-search-panel bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden transform transition-all duration-200 ease-out"
        @click.stop>
        <!-- 搜索输入框 -->
        <div
          class="search-input-container relative flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <SearchIcon class="search-icon text-gray-400 w-5 h-5 mr-3" />
          <input id="quick-search-input" ref="searchInputRef" v-model="searchQuery" type="text"
            placeholder="搜索应用程序、页面..."
            class="search-input flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none text-lg"
            autocomplete="off" spellcheck="false">

          <!-- 搜索范围选择器 -->
          <div class="search-scope-selector ml-3">
            <select v-model="searchScope"
              class="bg-transparent text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 outline-none focus:border-blue-500">
              <option value="all">
                全部
              </option>
              <option value="apps">
                应用
              </option>
              <option value="pages">
                页面
              </option>
              <option value="plugins">
                插件
              </option>
              <option value="current-page">
                当前页
              </option>
            </select>
          </div>

          <!-- 加载指示器 -->
          <div v-if="isSearching" class="loading-indicator ml-3">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
          </div>
        </div>

        <!-- 搜索结果区域 -->
        <div class="search-results-container max-h-96 overflow-y-auto">
          <!-- 有搜索结果时 -->
          <div v-if="hasQuery && hasResults" class="search-results">
            <div v-for="(result, index) in searchResults" :key="result.id" :class="resultItemClass(index)"
              @click="selectResult(result)" @mouseenter="selectedIndex = index">
              <div class="result-icon flex-shrink-0 w-8 h-8 mr-3">
                <img v-if="result.icon && result.type === 'app'" :src="result.icon" :alt="result.name"
                  class="w-full h-full object-cover rounded" @error="handleIconError">
                <div v-else class="w-full h-full bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                  <!-- App icon -->
                  <svg v-if="result.type === 'app'" class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <!-- Page icon -->
                  <svg v-else-if="result.type === 'page'" class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <!-- Plugin icon -->
                  <svg v-else-if="result.type === 'plugin'" class="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2zM9 9h4l-2 2 2 2H9V9z" />
                  </svg>
                  <!-- Default file icon -->
                  <svg v-else class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>

              <div class="result-content flex-1 min-w-0">
                <div class="result-title text-sm font-medium text-gray-900 dark:text-white truncate">
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-html="getHighlightedText(result.name)" />
                </div>
                <div class="result-description text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  <template v-if="result.type === 'plugin'">
                    {{ result.description || result.category }}
                    <span v-if="result['version']" class="mx-1">•</span>
                    <span v-if="result['version']" class="text-blue-500">v{{ result['version'] }}</span>
                    <span v-if="result['state']" class="mx-1">•</span>
                    <span v-if="result['state']" :class="getPluginStateClass(result['state'] as string)">
                      {{ getPluginStateLabel(result['state'] as string) }}
                    </span>
                  </template>
                  <template v-else>
                    {{ result.description || result.category }}
                  </template>
                </div>
              </div>

              <div class="result-meta flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                <span class="result-type">{{ getTypeLabel(result.type) }}</span>
              </div>
            </div>
          </div>

          <!-- 无搜索结果 -->
          <div v-else-if="hasQuery && !hasResults && !isSearching" class="no-results p-6 text-center">
            <div class="no-results-icon text-gray-400 text-4xl mb-3">
              🔍
            </div>
            <div class="no-results-title text-gray-600 dark:text-gray-300 font-medium mb-1">
              未找到相关结果
            </div>
            <div class="no-results-subtitle text-sm text-gray-500 dark:text-gray-400">
              尝试使用不同的关键词搜索
            </div>
          </div>

          <!-- 搜索历史 -->
          <div v-else-if="!hasQuery && recentSearches.length > 0" class="search-history">
            <div
              class="history-header px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              最近搜索
            </div>
            <div v-for="(query, index) in recentSearches" :key="index" :class="historyItemClass(index)"
              @click="useHistorySearch(query)" @mouseenter="selectedIndex = index">
              <div class="history-icon flex-shrink-0 w-8 h-8 mr-3 flex items-center justify-center">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div class="history-content flex-1 min-w-0">
                <div class="history-query text-sm text-gray-700 dark:text-gray-200 truncate">
                  {{ query }}
                </div>
              </div>

              <button
                class="history-remove flex-shrink-0 w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="removeFromHistory(query)">
                <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-state p-6 text-center">
            <div class="empty-icon text-gray-300 dark:text-gray-600 text-4xl mb-3">
              ⚡
            </div>
            <div class="empty-title text-gray-600 dark:text-gray-300 font-medium mb-1">
              快速搜索
            </div>
            <div class="empty-subtitle text-sm text-gray-500 dark:text-gray-400">
              输入关键词搜索应用程序或页面
            </div>
          </div>
        </div>

        <!-- 搜索提示栏 -->
        <div
          class="search-footer flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-750 text-xs text-gray-500 dark:text-gray-400">
          <div class="search-tips">
            <kbd class="kbd">↑↓</kbd> 导航
            <kbd class="kbd ml-2">Enter</kbd> 选择
            <kbd class="kbd ml-2">Esc</kbd> 关闭
          </div>

          <div class="search-stats">
            <span v-if="hasResults">{{ searchResults.length }} 个结果</span>
            <span v-else-if="hasQuery && !isSearching">0 个结果</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import SearchIcon from '@/components/icons/SearchIcon.vue'
import { useSearch } from '@/composables/useSearch'
import type { SearchResult } from '@/utils/search'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

// Props
interface Props {
  modelValue?: boolean
  searchScope?: 'all' | 'current-page' | 'apps' | 'pages' | 'plugins'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  searchScope: 'all',
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'result-select': [result: SearchResult]
}>()

// 搜索功能
const searchScope = ref(props.searchScope)
const {
  visible,
  searchQuery,
  selectedIndex,
  isSearching,
  searchResults,
  recentSearches,
  hasResults,
  hasQuery,
  show,
  hide,
  selectResult,
  handleKeyDown,
  getHighlightedText,
  removeFromHistory,
  useHistorySearch,
} = useSearch({
  searchScope: searchScope.value,
  debounceMs: 150,
  maxResults: 20,
})

// 引用
const searchInputRef = ref<HTMLInputElement>()

// 计算样式类
const resultItemClass = (index: number) => {
  const baseClass = 'result-item group flex items-center px-4 py-3 cursor-pointer transition-colors'
  const activeClass = 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-50'
  const hoverClass = 'hover:bg-gray-50 dark:hover:bg-gray-700'

  return `${baseClass} ${index === selectedIndex.value ? activeClass : hoverClass}`
}

const historyItemClass = (index: number) => {
  const baseClass = 'history-item group flex items-center px-4 py-2 cursor-pointer transition-colors'
  const activeClass = 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-50'
  const hoverClass = 'hover:bg-gray-50 dark:hover:bg-gray-700'

  return `${baseClass} ${index === selectedIndex.value ? activeClass : hoverClass}`
}

// 获取类型标签
const getTypeLabel = (type?: string) => {
  switch (type) {
    case 'app':
      return '应用'
    case 'page':
      return '页面'
    case 'plugin':
      return '插件'
    default:
      return '项目'
  }
}

// 获取插件状态的样式类
const getPluginStateClass = (state: string) => {
  switch (state) {
    case 'active':
      return 'text-green-500'
    case 'loaded':
      return 'text-blue-500'
    case 'inactive':
      return 'text-gray-500'
    case 'error':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

// 获取插件状态的显示标签
const getPluginStateLabel = (state: string) => {
  switch (state) {
    case 'active':
      return '已激活'
    case 'loaded':
      return '已加载'
    case 'inactive':
      return '未激活'
    case 'error':
      return '错误'
    default:
      return '未知'
  }
}

// 处理图标加载错误
const handleIconError = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img) {
    img.style.display = 'none'
  }
}

// 监听外部控制
watch(() => props.modelValue, (newValue) => {
  if (newValue !== visible.value) {
    if (newValue) {
      show()
    } else {
      hide()
    }
  }
})

watch(visible, (newValue) => {
  emit('update:modelValue', newValue)
})

// 监听搜索范围变化
watch(searchScope, (_newScope) => {
  // 重新搜索
  if (searchQuery.value.trim()) {
    // 这里可以触发重新搜索
  }
})

// 键盘事件处理
const handleDocumentKeyDown = (event: KeyboardEvent) => {
  if (visible.value) {
    handleKeyDown(event)
  }
}

// 聚焦搜索框
const focusSearchInput = () => {
  nextTick(() => {
    if (searchInputRef.value) {
      searchInputRef.value.focus()
    }
  })
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleDocumentKeyDown)

  // 如果初始时就是显示状态，聚焦搜索框
  if (visible.value) {
    focusSearchInput()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleDocumentKeyDown)
})

// 当搜索面板显示时聚焦
watch(visible, (isVisible) => {
  if (isVisible) {
    focusSearchInput()
  }
})
</script>

<style scoped>
/* 键盘提示样式 */
.kbd {
  display: inline-block;
  padding: 0.125rem 0.25rem;
  font-size: 0.75rem;
  line-height: 1;
  color: rgb(75 85 99);
  background-color: rgb(243 244 246);
  border: 1px solid rgb(209 213 219);
  border-radius: 0.25rem;
  box-shadow: inset 0 -1px 0 rgb(209 213 219);
}

.dark .kbd {
  color: rgb(209 213 219);
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
  box-shadow: inset 0 -1px 0 rgb(75 85 99);
}

/* 搜索高亮样式 */
:deep(.search-highlight) {
  background-color: rgb(254 240 138);
  color: rgb(146 64 14);
  font-weight: 500;
  border-radius: 0.125rem;
  padding: 0.125rem 0.25rem;
}

.dark :deep(.search-highlight) {
  background-color: rgb(59 130 246);
  color: white;
}

/* 滚动条样式 */
.search-results-container {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}

.search-results-container::-webkit-scrollbar {
  width: 6px;
}

.search-results-container::-webkit-scrollbar-track {
  background: transparent;
}

.search-results-container::-webkit-scrollbar-thumb {
  background-color: rgb(203 213 225);
  border-radius: 3px;
}

.dark .search-results-container::-webkit-scrollbar-thumb {
  background-color: rgb(75 85 99);
}

/* 动画效果 */
.quick-search-panel {
  animation: search-panel-enter 0.2s ease-out;
}

@keyframes search-panel-enter {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 输入框样式 */
.search-input::placeholder {
  font-weight: 400;
}

.search-input:focus::placeholder {
  opacity: 0.5;
}

/* 选择器样式 */
.search-scope-selector select {
  cursor: pointer;
}

.search-scope-selector select:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* 加载动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 深色模式适配 */
.dark .bg-gray-750 {
  background-color: rgb(31 41 55);
}
</style>
