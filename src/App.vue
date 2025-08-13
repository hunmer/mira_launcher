<template>
  <NotificationContainer>
    <MainLayout
      @window-minimize="handleWindowEvent"
      @window-maximize="handleWindowEvent"
      @window-close="handleWindowEvent"
    />
  </NotificationContainer>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { onMounted, onUnmounted } from 'vue'

// 布局组件导入
import MainLayout from '@/components/layout/MainLayout.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'

// Store
const themeStore = useThemeStore()

// 窗口事件处理
const handleWindowEvent = () => {
  // 可以在这里添加额外的窗口事件处理逻辑
  console.log('窗口事件触发')
}

// 鍵盤快捷鍵處理
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + W: 關閉視窗
  if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
    event.preventDefault()
    // 窗口关闭事件会由 WindowControls 组件处理
  }

  // Ctrl/Cmd + M: 最小化視窗
  if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
    event.preventDefault()
    // 窗口最小化事件会由 WindowControls 组件处理
  }

  // F11: 全螢幕切換
  if (event.key === 'F11') {
    event.preventDefault()
    // 窗口最大化事件会由 WindowControls 组件处理
  }

  // Ctrl/Cmd + T: 切換主題
  if ((event.ctrlKey || event.metaKey) && event.key === 't') {
    event.preventDefault()
    themeStore.toggleTheme()
  }
}

// 生命週期
onMounted(async () => {
  // 初始化主題
  themeStore.initTheme()

  // 註冊鍵盤事件
  window.addEventListener('keydown', handleKeydown)

  // 監聽主題變化
  themeStore.applyTheme()

  console.log('🎉 Mira Launcher 初始化完成')
})

onUnmounted(() => {
  // 清理鍵盤事件監聽器
  window.removeEventListener('keydown', handleKeydown)
})
</script>
