<template>
  <div class="app-layout min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- 標題欄 - 固定在顶部，包含菜单栏 -->
    <TitleBar
      class="fixed top-0 left-0 right-0 z-40"
      @minimize="handleWindowMinimize"
      @maximize="handleWindowMaximize"
      @close="handleWindowClose"
    />

    <!-- 主要內容區域 - 留出標題欄空間 -->
    <div class="pt-12">
      <MainContent v-bind="{ ...(contentTransition !== undefined && { transition: contentTransition }) }" />
    </div>

    <!-- 全局加載指示器 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isLoading"
          class="loading-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        >
          <div class="loading-content bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div class="flex items-center space-x-3">
              <LoadingSpinner class="text-primary-600" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                載入中...
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 全局通知 -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import MainContent from './MainContent.vue'
import TitleBar from './TitleBar.vue'

interface Props {
  contentTransition?: string
}

interface Emits {
  (e: 'windowMinimize'): void
  (e: 'windowMaximize'): void
  (e: 'windowClose'): void
}

withDefaults(defineProps<Props>(), {
  contentTransition: 'fade',
})

const emit = defineEmits<Emits>()

// Store
const appStore = useAppStore()
const { isLoading } = storeToRefs(appStore)

// 窗口事件处理
const handleWindowMinimize = () => {
  emit('windowMinimize')
}

const handleWindowMaximize = () => {
  emit('windowMaximize')
}

const handleWindowClose = () => {
  emit('windowClose')
}
</script>

<style scoped>
.app-layout {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
}

.loading-overlay {
  backdrop-filter: blur(4px);
}

.loading-content {
  min-width: 200px;
}

/* 加载动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
