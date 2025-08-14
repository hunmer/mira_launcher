<template>
  <div class="window-controls">
    <!-- 关闭按钮 (红色) -->
    <button class="control-dot close-dot" title="关闭" @click="handleClose" @mouseenter="showCloseIcon = true"
      @mouseleave="showCloseIcon = false">
      <i v-if="showCloseIcon" class="pi pi-times control-icon" />
    </button>

    <!-- 最小化按钮 (黄色) -->
    <button class="control-dot minimize-dot" title="最小化" @click="handleMinimize" @mouseenter="showMinimizeIcon = true"
      @mouseleave="showMinimizeIcon = false">
      <i v-if="showMinimizeIcon" class="pi pi-minus control-icon" />
    </button>

    <!-- 最大化按钮 (绿色) -->
    <button class="control-dot maximize-dot" title="最大化" @click="handleMaximize" @mouseenter="showMaximizeIcon = true"
      @mouseleave="showMaximizeIcon = false">
      <i v-if="showMaximizeIcon" class="pi pi-window-maximize control-icon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Emits {
  (e: 'minimize'): void
  (e: 'maximize'): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// 图标显示状态
const showCloseIcon = ref(false)
const showMinimizeIcon = ref(false)
const showMaximizeIcon = ref(false)

// 窗口控制函数
const handleMinimize = async () => {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const appWindow = getCurrentWindow()
    await appWindow.minimize()
    emit('minimize')
  } catch (error) {
    console.error('最小化視窗失敗:', error)
  }
}

const handleMaximize = async () => {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const appWindow = getCurrentWindow()
    const isMaximized = await appWindow.isMaximized()
    if (isMaximized) {
      await appWindow.unmaximize()
    } else {
      await appWindow.maximize()
    }
    emit('maximize')
  } catch (error) {
    console.error('最大化視窗失敗:', error)
  }
}

const handleClose = async () => {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const appWindow = getCurrentWindow()
    await appWindow.close()
    emit('close')
  } catch (error) {
    console.error('關閉視窗失敗:', error)
  }
}
</script>

<style scoped>
.window-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
  padding: 0 0.75rem;
}

.control-dot {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.control-dot:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

/* 关闭按钮 - 红色 */
.close-dot {
  background-color: #ef4444;
}

.close-dot:hover {
  background-color: #dc2626;
}

/* 最小化按钮 - 黄色 */
.minimize-dot {
  background-color: #f59e0b;
}

.minimize-dot:hover {
  background-color: #d97706;
}

/* 最大化按钮 - 绿色 */
.maximize-dot {
  background-color: #10b981;
}

.maximize-dot:hover {
  background-color: #059669;
}

/* 图标样式 */
.control-icon {
  font-size: 0.5rem;
  color: white;
  line-height: 1;
}

/* 在非hover状态下，圆点稍微透明 */
.control-dot:not(:hover) {
  opacity: 0.8;
}

/* 深色模式调整 */
.dark .control-dot:not(:hover) {
  opacity: 0.9;
}

/* 在macOS风格的圆点中，图标应该更小 */
.control-dot .control-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
