<template>
  <div class="drag-region h-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between h-full px-4">
      <!-- 應用標題 -->
      <AppTitle />
      
      <!-- 視窗控制按鈕 -->
      <WindowControls 
        @minimize="handleMinimize"
        @maximize="handleMaximize"
        @close="handleClose"
      />
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
