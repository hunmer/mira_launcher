<template>
  <div class="window-controls">
    <!-- 最小化按钮 -->
    <button class="control-button" title="最小化" @click="handleMinimize">
      <MinimizeIcon class="control-icon" />
    </button>

    <!-- 最大化按钮 -->
    <button class="control-button" title="最大化" @click="handleMaximize">
      <MaximizeIcon class="control-icon" />
    </button>

    <!-- 关闭按钮 -->
    <button class="control-button close-button" title="关闭" @click="handleClose">
      <CloseIcon class="control-icon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { CloseIcon, MaximizeIcon, MinimizeIcon } from '@/components/icons';

interface Emits {
  (e: 'minimize'): void
  (e: 'maximize'): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// 窗口控制函数
const handleMinimize = async () => {
  try {
    const { appWindow } = await import('@tauri-apps/api/window')
    await appWindow.minimize()
    emit('minimize')
  } catch (error) {
    console.error('最小化視窗失敗:', error)
  }
}

const handleMaximize = async () => {
  try {
    const { appWindow } = await import('@tauri-apps/api/window')
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
    const { appWindow } = await import('@tauri-apps/api/window')
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
  gap: 0.25rem;
  height: 100%;
}

.control-button {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;
}

.control-button:hover {
  background-color: rgba(156, 163, 175, 0.2);
}

.dark .control-button:hover {
  background-color: rgba(75, 85, 99, 0.7);
}

.close-button:hover {
  background-color: #ef4444;
  color: white;
}

.control-icon {
  width: 1rem;
  height: 1rem;
  color: #4b5563;
  flex-shrink: 0;
}

.dark .control-icon {
  color: #d1d5db;
}

.close-button:hover .control-icon {
  color: white;
}
</style>

<style scoped>
/* No specific styles needed here anymore as TailwindCSS is used directly */
</style>
