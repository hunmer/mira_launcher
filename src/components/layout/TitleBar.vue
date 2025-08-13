<template>
  <div
    class="drag-region h-12 bg-gradient-to-r from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-lg select-none">
    <div class="flex items-center justify-between h-full px-6">
      <!-- 應用標題 -->
      <div class="no-drag">
        <AppTitle />
      </div>

      <!-- 視窗控制按鈕 -->
      <div class="no-drag">
        <WindowControls @minimize="handleMinimize" @maximize="handleMaximize" @close="handleClose" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppTitle from './AppTitle.vue'
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
.drag-region {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}
</style>
