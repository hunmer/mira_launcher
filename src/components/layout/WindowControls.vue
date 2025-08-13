<template>
  <div class="flex items-center space-x-2 no-drag">
    <div
      class="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer transition-colors duration-200 shadow-sm border border-red-600/20"
      title="关闭" @click="handleClose" />
    <div
      class="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer transition-colors duration-200 shadow-sm border border-yellow-600/20"
      title="最小化" @click="handleMinimize" />
    <div
      class="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 cursor-pointer transition-colors duration-200 shadow-sm border border-green-600/20"
      title="最大化" @click="handleMaximize" />
  </div>
</template>

<script setup lang="ts">
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
/* No specific styles needed here anymore as TailwindCSS is used directly */
</style>
