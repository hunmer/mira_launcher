<template>
  <div data-tauri-drag-region class="title-bar">
    <!-- 应用标题 -->
    <div class="title-section">
      <AppTitle />
    </div>

    <!-- 导航菜单 - 靠近标题 -->
    <div class="no-drag menu-section">
      <NavigationMenu />
    </div>

    <!-- 功能按钮 - 靠近窗口控制按钮 -->
    <div class="no-drag actions-section">
      <ActionButtons />
    </div>

    <!-- 窗口控制按钮 -->
    <div class="no-drag controls-section">
      <WindowControls @minimize="handleMinimize" @maximize="handleMaximize" @close="handleClose" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ActionButtons from './ActionButtons.vue'
import AppTitle from './AppTitle.vue'
import NavigationMenu from './NavigationMenu.vue'
import WindowControls from './WindowControls.vue'

interface Emits {
  (e: 'minimize'): void
  (e: 'maximize'): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// 事件转发
const handleMinimize = () => {
  emit('minimize')
}

const handleMaximize = () => {
  emit('maximize')
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.title-bar {
  /* Tauri拖拽区域 - 使用 data-tauri-drag-region 属性 */
  user-select: none;
  height: 3rem;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.95));
  backdrop-filter: blur(16px);
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);

  /* 关键：确保单行布局 */
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  width: 100%;
  overflow: hidden;
}

.dark .title-bar {
  background: linear-gradient(to right, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.95));
  border-bottom-color: #374151;
}

.title-section {
  pointer-events: none;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-width: 0;
}

.menu-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding-left: 1rem;
}

.actions-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 1rem;
}

.controls-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: 100%;
}

.no-drag {
  /* 防止按钮区域被拖拽 */
  pointer-events: auto;
}
</style>
