<template>
  <div class="flex items-center space-x-1 no-drag">
    <button 
      class="window-control-btn hover:bg-gray-200 dark:hover:bg-gray-600"
      @click="handleMinimize"
      title="最小化"
    >
      <MinimizeIcon :size="12" class="text-gray-600 dark:text-gray-400" />
    </button>
    <button 
      class="window-control-btn hover:bg-gray-200 dark:hover:bg-gray-600"
      @click="handleMaximize"
      title="最大化"
    >
      <MaximizeIcon :size="12" class="text-gray-600 dark:text-gray-400" />
    </button>
    <button 
      class="window-control-btn hover:bg-red-500 hover:text-white"
      @click="handleClose"
      title="關閉"
    >
      <CloseIcon :size="12" class="text-gray-600 dark:text-gray-400" />
    </button>
  </div>
</template>

<script setup lang="ts">
import MinimizeIcon from '@/components/icons/MinimizeIcon.vue'
import MaximizeIcon from '@/components/icons/MaximizeIcon.vue'
import CloseIcon from '@/components/icons/CloseIcon.vue'

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
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
}
</style>
