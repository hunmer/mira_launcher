<template>
    <div
        class="page-manager h-full flex flex-col"
        tabindex="0"
        @keydown="handleKeyDown"
        @focus="handleFocus"
    >
        <!-- 页面内容区 -->
        <div class="page-container flex-1 relative overflow-hidden">
            <transition
                :name="transitionName"
                mode="out-in"
                @before-enter="onBeforeEnter"
                @enter="onEnter"
                @leave="onLeave"
            >
                <component
                    :is="currentPageComponent"
                    :key="currentPage?.id || 'default'"
                    v-bind="currentPageProps"
                    class="page-content absolute inset-0"
                />
            </transition>

            <!-- 加载状态 -->
            <div
                v-if="pageState.loading"
                class="loading-overlay absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 flex items-center justify-center z-50"
            >
                <div
                    class="loading-spinner animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
                />
            </div>

            <!-- 错误状态 -->
            <div
                v-if="pageState.error"
                class="error-overlay absolute inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-40"
            >
                <div class="error-content text-center p-6">
                    <div class="error-icon text-red-500 text-4xl mb-4">
                        ⚠
                    </div>
                    <h3
                        class="error-title text-lg font-semibold text-gray-900 dark:text-white mb-2"
                    >
                        页面加载失败
                    </h3>
                    <p class="error-message text-gray-600 dark:text-gray-300 mb-4">
                        {{ pageState.error }}
                    </p>
                    <button
                        class="retry-btn px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        @click="retryCurrentPage"
                    >
                        重试
                    </button>
                </div>
            </div>
        </div>

        <!-- 页面指示器 -->
        <PageIndicator
            :pages="pages"
            :current-page="currentPageIndex"
            :max-pages="config.maxPages || 10"
            :can-navigate-next="canNavigateNext"
            :can-navigate-previous="canNavigatePrevious"
            @page-select="switchToPage"
            @page-add="addPage"
            @page-remove="removePage"
            @page-previous="previousPage"
            @page-next="nextPage"
            @page-menu="showPageMenu"
            @page-context-menu="showPageContextMenu"
        />

        <!-- 页面右键菜单 -->
        <ContextMenu
            v-if="contextMenuVisible"
            :show="contextMenuVisible"
            :x="contextMenuPosition.x"
            :y="contextMenuPosition.y"
            :items="contextMenuItems"
            @close="hideContextMenu"
        />
    </div>
</template>

<script setup lang="ts">
import ContextMenu from '@/components/common/ContextMenu.vue'
import { usePageStore } from '@/stores/page'
import type { Page } from '@/types/components'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageIndicator from './PageIndicator.vue'

// 获取路由和页面store
const router = useRouter()
const pageStore = usePageStore()

// 解构pageStore状态
const {
    pages,
    currentPageIndex,
    currentPage,
    pageState,
    config,
    canNavigateNext,
    canNavigatePrevious,
} = storeToRefs(pageStore)

// 组件状态
const transitionName = ref('')
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuPage = ref<Page | null>(null)
const focusedByKeyboard = ref(false)

// 计算当前页面组件
const currentPageComponent = computed(() => {
    if (!currentPage.value) return null

    // 根据页面路由获取对应的组件
    const route = router.resolve(currentPage.value.route)
    return route.matched[0]?.components?.['default'] || null
})

// 计算当前页面props
const currentPageProps = computed(() => {
    return currentPage.value?.config || {}
})

// 上下文菜单项
const contextMenuItems = computed(() => {
    if (!contextMenuPage.value) return []

    const page = contextMenuPage.value

    return [
        {
            label: '重命名',
            icon: '✏️',
            action: () => renamePage(page),
        },
        {
            label: '复制页面',
            icon: '📋',
            action: () => pageStore.duplicatePage(page.id),
        },
        {
            label: '',
            separator: true,
        },
        {
            label: page.pinned ? '取消固定' : '固定页面',
            icon: page.pinned ? '📌' : '📍',
            action: () => pageStore.updatePage(page.id, { pinned: !page.pinned }),
        },
        {
            label: '',
            separator: true,
        },
        {
            label: '删除页面',
            icon: '🗑️',
            action: () => removePage(page.id),
            danger: true,
            disabled: pages.value.length <= 1,
        },
    ]
})

// 键盘导航处理
const handleKeyDown = (event: KeyboardEvent) => {
    // 只有在组件获得焦点时才处理键盘事件
    if (event.target !== event.currentTarget && !focusedByKeyboard.value) {
        return
    }

    switch (event.key) {
    case 'ArrowLeft':
        event.preventDefault()
        if (canNavigatePrevious.value) {
            previousPage()
        }
        break
    case 'ArrowRight':
        event.preventDefault()
        if (canNavigateNext.value) {
            nextPage()
        }
        break
    case 'Home':
        event.preventDefault()
        if (pages.value.length > 0) {
            switchToPage(0)
        }
        break
    case 'End':
        event.preventDefault()
        if (pages.value.length > 0) {
            switchToPage(pages.value.length - 1)
        }
        break
    case 'Escape':
        event.preventDefault()
        hideContextMenu()
        break
    }
}

// 焦点处理
const handleFocus = () => {
    focusedByKeyboard.value = true
}

const handleBlur = () => {
    focusedByKeyboard.value = false
}

// 页面切换动画
const getTransitionName = (fromIndex: number, toIndex: number) => {
    if (!config.value.enableAnimation) return 'fade'

    if (fromIndex < toIndex) {
        return 'slide-left'
    } else if (fromIndex > toIndex) {
        return 'slide-right'
    } else {
        return 'fade'
    }
}

// 动画事件处理
const onBeforeEnter = () => {
    pageState.value.loading = false
}

const onEnter = () => {
    // 动画进入完成
}

const onLeave = () => {
    // 动画离开
}

// 页面操作方法
const switchToPage = (index: number) => {
    if (index === currentPageIndex.value) return

    const oldIndex = currentPageIndex.value
    transitionName.value = getTransitionName(oldIndex, index)

    pageStore.switchToPage(index)
}

const addPage = () => {
    const newPageId = pageStore.addPage({
        name: `页面 ${pages.value.length + 1}`,
        route: '/home',
    })

    // 切换到新页面
    const newIndex = pages.value.findIndex(p => p.id === newPageId)
    if (newIndex !== -1) {
        switchToPage(newIndex)
    }
}

const removePage = (pageId: string) => {
    if (pages.value.length <= 1) return

    const pageIndex = pages.value.findIndex(p => p.id === pageId)
    const page = pages.value[pageIndex]

    if (!page) return

    // 确认删除
    if (!confirm(`确定要删除页面 "${page.name}" 吗？`)) {
        return
    }

    pageStore.removePage(pageId)
}

const previousPage = () => {
    if (canNavigatePrevious.value) {
        switchToPage(currentPageIndex.value - 1)
    }
}

const nextPage = () => {
    if (canNavigateNext.value) {
        switchToPage(currentPageIndex.value + 1)
    }
}

const retryCurrentPage = () => {
    delete pageState.value.error
    pageState.value.loading = true

    // 重新加载当前页面
    nextTick(() => {
        pageState.value.loading = false
    })
}

// 右键菜单处理
const showPageMenu = (event: MouseEvent) => {
    if (!currentPage.value) return

    contextMenuPage.value = currentPage.value
    contextMenuPosition.value = { x: event.clientX, y: event.clientY }
    contextMenuVisible.value = true
}

const showPageContextMenu = (data: {
    page: Page
    index: number
    event: MouseEvent
}) => {
    contextMenuPage.value = data.page
    contextMenuPosition.value = { x: data.event.clientX, y: data.event.clientY }
    contextMenuVisible.value = true
}

const hideContextMenu = () => {
    contextMenuVisible.value = false
    contextMenuPage.value = null
}

const renamePage = (page: Page) => {
    const newName = prompt('请输入新的页面名称:', page.name)
    if (newName && newName.trim() && newName !== page.name) {
        pageStore.updatePage(page.id, { name: newName.trim() })
    }
}

// 监听页面切换，同步路由
watch(
    currentPage,
    newPage => {
        if (newPage && router.currentRoute.value.path !== newPage.route) {
            router.push(newPage.route).catch(() => {
                // 路由跳转失败，保持当前状态
            })
        }
    },
    { immediate: true },
)

// 监听路由变化，同步页面
watch(
    () => router.currentRoute.value.path,
    newPath => {
        const pageIndex = pages.value.findIndex(p => p.route === newPath)
        if (pageIndex !== -1 && pageIndex !== currentPageIndex.value) {
            switchToPage(pageIndex)
        }
    },
)

// 生命周期
onMounted(() => {
    // 确保有至少一个页面
    if (pages.value.length === 0) {
        pageStore.addPage({
            name: '首页',
            route: '/home',
            pinned: true,
        })
    }

    // 添加全局事件监听
    document.addEventListener('blur', handleBlur)
})

onUnmounted(() => {
    document.removeEventListener('blur', handleBlur)
})
</script>

<style scoped>
.page-manager {
  background-color: rgb(249 250 251);
}

.dark .page-manager {
  background-color: rgb(17 24 39);
}

.page-content {
  overflow: auto;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease-in-out;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease-in-out;
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-leave-to {
  transform: translateX(100%);
}

/* 加载和错误状态样式 */
.loading-overlay,
.error-overlay {
  backdrop-filter: blur(2px);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.error-content {
  max-width: 300px;
}

.retry-btn {
  transition: background-color 0.2s ease-in-out;
}

.retry-btn:hover {
  background-color: rgb(37 99 235);
}

/* 焦点样式 */
.page-manager:focus {
  outline: 2px solid rgb(59 130 246);
  outline-offset: -2px;
}

.page-manager:focus:not(:focus-visible) {
  outline: none;
}
</style>
