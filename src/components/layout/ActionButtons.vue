<template>
  <div class="action-buttons">
    <!-- 搜索按钮 -->
    <Button
      v-tooltip.bottom="'搜索'"
      icon="pi pi-search"
      severity="secondary"
      text
      rounded
      size="small"
      @click="toggleSearch"
    />
    
    <!-- 通知按钮 -->
    <Button
      v-tooltip.bottom="'通知'"
      icon="pi pi-bell"
      severity="secondary"
      text
      rounded
      size="small"
      @click="showNotifications"
    />
    
    <!-- 主题切换按钮 -->
    <Button
      v-tooltip.bottom="isDarkMode ? '切换到浅色模式' : '切换到深色模式'"
      :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
      severity="secondary"
      text
      rounded
      size="small"
      @click="toggleTheme"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const isDarkMode = computed(() => themeStore.currentTheme === 'dark')

// 功能按钮事件处理
const toggleSearch = () => {
  console.log('Toggle search')
  // 触发搜索功能
}

const showNotifications = () => {
  console.log('Show notifications')
  // 显示通知
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}
</script>

<style scoped>
.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* 自定义按钮样式 */
:global(.action-buttons .p-button) {
  width: 2rem !important;
  height: 2rem !important;
  padding: 0 !important;
  color: #6b7280 !important;
  border: none !important;
  background: transparent !important;
}

:global(.action-buttons .p-button:hover) {
  background-color: rgba(99, 102, 241, 0.1) !important;
  color: #4f46e5 !important;
}

:global(.action-buttons .p-button:focus) {
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3) !important;
}

/* 深色模式 */
:global(.dark .action-buttons .p-button) {
  color: #d1d5db !important;
}

:global(.dark .action-buttons .p-button:hover) {
  background-color: rgba(99, 102, 241, 0.2) !important;
  color: #a78bfa !important;
}

:global(.dark .action-buttons .p-button:focus) {
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3) !important;
}
</style>
