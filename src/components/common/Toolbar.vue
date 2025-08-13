<!-- Toolbar 组件 - 包装 PrimeVue Toolbar 以支持自定义样式和暗色模式 -->
<template>
  <Toolbar
    v-bind="{
      ...$attrs,
      class: toolbarClass
    }"
  >
    <template #start>
      <slot name="start" />
    </template>
    <template #center>
      <slot name="center" />
    </template>
    <template #end>
      <slot name="end" />
    </template>
    <slot />
  </Toolbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Toolbar from 'primevue/toolbar'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 计算工具栏样式类
const toolbarClass = computed(() => {
  const classes = ['custom-toolbar']
  
  if (themeStore.currentTheme === 'dark') {
    classes.push('dark-theme')
  }
  
  return classes.join(' ')
})
</script>

<style scoped>
.custom-toolbar {
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.custom-toolbar.dark-theme {
  /* 暗色模式下的工具栏样式 */
  background-color: rgb(31, 41, 55);
  border-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}

.custom-toolbar.dark-theme :deep(.p-toolbar) {
  background-color: rgb(31, 41, 55);
  border-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}

.custom-toolbar.dark-theme :deep(.p-toolbar-group-start),
.custom-toolbar.dark-theme :deep(.p-toolbar-group-center),
.custom-toolbar.dark-theme :deep(.p-toolbar-group-end) {
  color: rgb(229, 231, 235);
}
</style>
