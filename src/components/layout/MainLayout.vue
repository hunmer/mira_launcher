<template>
  <div class="app-layout min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- 標題欄 -->
    <TitleBar 
      @minimize="handleWindowMinimize"
      @maximize="handleWindowMaximize"
      @close="handleWindowClose"
    />
    
    <!-- 主要內容區域 -->
    <MainContent :transition="contentTransition" />
    
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
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import TitleBar from './TitleBar.vue'
import MainContent from './MainContent.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'

interface Props {
  contentTransition?: string
}

const props = withDefaults(defineProps<Props>(), {
  contentTransition: 'fade',
})

const emit = defineEmits<Emits>()

interface Emits {
  (e: 'window-minimize'): void
  (e: 'window-maximize'): void
  (e: 'window-close'): void
}

// Store
const appStore = useAppStore()
const { isLoading } = storeToRefs(appStore)

// 窗口事件处理
const handleWindowMinimize = () => {
  emit('window-minimize')
}

const handleWindowMaximize = () => {
  emit('window-maximize')
}

const handleWindowClose = () => {
  emit('window-close')
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
