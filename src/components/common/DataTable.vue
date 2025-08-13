<!-- DataTable 组件 - 包装 PrimeVue DataTable 以支持自定义样式和暗色模式 -->
<template>
  <DataTable
    v-bind="$attrs"
    :class="computedClass"
  >
    <slot />
  </DataTable>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import DataTable from 'primevue/datatable'
import { useThemeStore } from '@/stores/theme'

// 启用透传所有属性
defineOptions({
  inheritAttrs: false,
})

const themeStore = useThemeStore()
const attrs = useAttrs()

// 计算表格样式类
const computedClass = computed(() => {
  const classes = ['custom-datatable']
  
  if (themeStore.currentTheme === 'dark') {
    classes.push('dark-theme')
  }
  
  // 如果有传入的 class，也要合并
  if (attrs['class']) {
    if (typeof attrs['class'] === 'string') {
      classes.push(attrs['class'])
    } else if (Array.isArray(attrs['class'])) {
      classes.push(...attrs['class'])
    }
  }
  
  return classes.join(' ')
})
</script>

<style scoped>
.custom-datatable {
  width: 100%;
}

.custom-datatable.dark-theme {
  /* 暗色模式下的表格样式 */
  background-color: rgb(31, 41, 55);
  color: white;
}

.custom-datatable.dark-theme :deep(.p-datatable-header) {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
}

.custom-datatable.dark-theme :deep(.p-datatable-tbody > tr) {
  background-color: rgb(31, 41, 55);
  border-color: rgb(75, 85, 99);
}

.custom-datatable.dark-theme :deep(.p-datatable-tbody > tr:nth-child(even)) {
  background-color: rgb(42, 52, 67);
}

.custom-datatable.dark-theme :deep(.p-datatable-tbody > tr:hover) {
  background-color: rgb(55, 65, 81);
}

.custom-datatable.dark-theme :deep(.p-datatable-thead > tr > th) {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}

.custom-datatable.dark-theme :deep(.p-datatable-tbody > tr > td) {
  border-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}
</style>
