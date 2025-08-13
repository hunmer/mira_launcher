<template>
  <div class="flex items-center space-x-1 no-drag">
    <button class="window-control-btn hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="最小化"
      @click="handleMinimize">
      <MinimizeIcon :size="14" class="text-gray-700 dark:text-gray-300" />
    </button>
    <button class="window-control-btn hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="最大化"
      @click="handleMaximize">
      <MaximizeIcon :size="14" class="text-gray-700 dark:text-gray-300" />
    </button>
    <button class="window-control-btn hover:bg-red-500 hover:text-white transition-colors" title="關閉"
      @click="handleClose">
      <CloseIcon :size="14" class="text-gray-700 dark:text-gray-300" />
    </button>
  </div>
</template>

<script setup lang="ts">
import CloseIcon from '@/components/icons/CloseIcon.vue'
import MaximizeIcon from '@/components/icons/MaximizeIcon.vue'
import MinimizeIcon from '@/components/icons/MinimizeIcon.vue'

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
.window-control-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s ease-in-out;
  border: none;
  background: transparent;
  cursor: pointer;
}

.window-control-btn:hover {
  transform: scale(1.05);
}

.window-control-btn:active {
  transform: scale(0.95);
}
</style>
