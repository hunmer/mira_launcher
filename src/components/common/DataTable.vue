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
import { computed } from 'vue'
import DataTable from 'primevue/datatable'
import { useThemeStore } from '@/stores/theme'

// 启用透传所有属性
defineOptions({
  inheritAttrs: false,
})

const themeStore = useThemeStore()

// 计算表格样式类
const computedClass = computed(() => {
  const classes = ['custom-datatable']
  
  if (themeStore.currentTheme === 'dark') {
    classes.push('dark-theme')
  }
  
  return classes.join(' ')
})
</script>

<style>
/* 使用全局样式而不是 scoped，这样可以影响 PrimeVue 组件的内部元素 */
.custom-datatable {
  width: 100%;
}

.custom-datatable .p-datatable {
  background: transparent;
}

.custom-datatable .p-datatable .p-datatable-header {
  background: transparent;
  border: none;
  padding: 1rem 0;
}

.custom-datatable .p-datatable .p-datatable-thead > tr > th {
  background: #f1f5f9;
  color: #374151;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  padding: 0.75rem;
}

.custom-datatable .p-datatable .p-datatable-tbody > tr > td {
  border: 1px solid #e2e8f0;
  padding: 0.75rem;
  background: white;
}

.custom-datatable .p-datatable .p-datatable-tbody > tr:nth-child(even) {
  background: #f8fafc;
}

.custom-datatable .p-datatable .p-datatable-tbody > tr:hover {
  background: #e2e8f0 !important;
}

/* 暗色模式样式 */
.custom-datatable.dark-theme .p-datatable {
  background-color: rgb(31, 41, 55);
  color: white;
}

.custom-datatable.dark-theme .p-datatable .p-datatable-header {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
}

.custom-datatable.dark-theme .p-datatable .p-datatable-thead > tr > th {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}

.custom-datatable.dark-theme .p-datatable .p-datatable-tbody > tr {
  background-color: rgb(31, 41, 55);
  border-color: rgb(75, 85, 99);
}

.custom-datatable.dark-theme .p-datatable .p-datatable-tbody > tr > td {
  border-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
  background-color: rgb(31, 41, 55);
}

.custom-datatable.dark-theme .p-datatable .p-datatable-tbody > tr:nth-child(even) {
  background-color: rgb(42, 52, 67);
}

.custom-datatable.dark-theme .p-datatable .p-datatable-tbody > tr:nth-child(even) > td {
  background-color: rgb(42, 52, 67);
}

.custom-datatable.dark-theme .p-datatable .p-datatable-tbody > tr:hover {
  background-color: rgb(55, 65, 81) !important;
}

.custom-datatable.dark-theme .p-datatable .p-datatable-tbody > tr:hover > td {
  background-color: rgb(55, 65, 81) !important;
}
</style>
