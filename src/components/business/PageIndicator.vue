<template>
  <div
    class="page-indicator flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
  >
    <!-- 页面标签 -->
    <div class="page-tabs flex-1 flex items-center gap-1 overflow-x-auto">
      <button
        v-for="(page, index) in pages"
        :key="page.id"
        :class="pageButtonClass(index)"
        @click="$emit('page-select', index)"
        @contextmenu.prevent="$emit('page-context-menu', { page, index, event: $event })"
      >
        <span
          v-if="page.icon"
          class="page-icon mr-1"
        >{{ page.icon }}</span>
        <span class="page-name">{{ page.name || `页面 ${index + 1}` }}</span>
        <button
          v-if="pages.length > 1"
          class="page-close ml-1 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
          @click.stop="$emit('page-remove', page.id)"
        >
          ×
        </button>
      </button>
    </div>

    <!-- 页面操作按钮 -->
    <div class="page-actions flex items-center gap-1">
      <!-- 添加页面 -->
      <button
        v-if="pages.length < maxPages"
        class="page-action-btn"
        :title="`添加页面 (${pages.length}/${maxPages})`"
        @click="$emit('page-add')"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      <!-- 页面导航 -->
      <button
        class="page-action-btn"
        :disabled="!canNavigatePrevious"
        title="上一页 (←)"
        @click="$emit('page-previous')"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        class="page-action-btn"
        :disabled="!canNavigateNext"
        title="下一页 (→)"
        @click="$emit('page-next')"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      <!-- 页面菜单 -->
      <button
        class="page-action-btn"
        title="页面菜单"
        @click="$emit('page-menu', $event)"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Page } from '@/types/components'

// Props
const props = defineProps<{
    pages: Page[]
    currentPage: number
    maxPages: number
    canNavigateNext: boolean
    canNavigatePrevious: boolean
}>()

// Emits
defineEmits<{
    'page-select': [index: number]
    'page-add': []
    'page-remove': [pageId: string]
    'page-previous': []
    'page-next': []
    'page-menu': [event: MouseEvent]
    'page-context-menu': [data: { page: Page; index: number; event: MouseEvent }]
}>()

// 计算页面按钮样式
const pageButtonClass = (index: number) => {
  const isActive = index === props.currentPage
  const baseClass = 'page-tab group relative flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 min-w-0 max-w-32'

  if (isActive) {
    return `${baseClass} bg-blue-500 text-white shadow-sm`
  } else {
    return `${baseClass} text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`
  }
}
</script>

<style scoped>
.page-indicator {
    min-height: 48px;
}

.page-tabs {
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.page-tabs::-webkit-scrollbar {
    display: none;
}

.page-tab {
    white-space: nowrap;
    flex-shrink: 0;
}

.page-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.page-close {
    transition: all 0.15s ease-in-out;
    line-height: 1;
    font-size: 12px;
    font-weight: bold;
}

.page-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    color: rgb(75 85 99);
    border-radius: 0.375rem;
    transition: colors 0.2s ease-in-out;
}

.page-action-btn:hover {
    background-color: rgb(243 244 246);
    color: rgb(17 24 39);
}

.page-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-action-btn:disabled:hover {
    background-color: transparent;
}

/* 深色模式 */
.dark .page-action-btn {
    color: rgb(209 213 219);
}

.dark .page-action-btn:hover {
    background-color: rgb(55 65 81);
    color: white;
}

.page-icon {
    font-size: 14px;
    line-height: 1;
}

/* 深色模式优化 */
@media (prefers-color-scheme: dark) {
    .page-indicator {
        border-color: rgb(55 65 81);
    }
}
</style>
