<!-- Tag 组件 - 包装 PrimeVue Tag 以支持自定义样式和暗色模式 -->
<template>
  <Tag
    v-bind="{
      ...$attrs,
      severity: mappedSeverity,
      class: tagClass
    }"
  >
    <slot />
  </Tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import { useThemeStore } from '@/stores/theme'

interface Props {
  severity?: 'secondary' | 'success' | 'info' | 'warning' | 'warn' | 'danger' | 'contrast'
  variant?: 'default' | 'outlined'
}

const props = withDefaults(defineProps<Props>(), {
  severity: 'secondary',
  variant: 'default',
})

const themeStore = useThemeStore()

// 映射 severity 到 PrimeVue 的格式
const mappedSeverity = computed(() => {
  return props.severity
})

// 计算标签样式类
const tagClass = computed(() => {
  const classes = ['custom-tag']
  
  if (themeStore.currentTheme === 'dark') {
    classes.push('dark-theme')
  }
  
  if (props.variant === 'outlined') {
    classes.push('outlined')
  }
  
  return classes.join(' ')
})
</script>

<style scoped>
.custom-tag {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.custom-tag.dark-theme {
  /* 暗色模式下的标签样式调整 */
  filter: brightness(0.9);
}

.custom-tag.dark-theme :deep(.p-tag) {
  background-color: rgb(55, 65, 81);
  color: rgb(229, 231, 235);
  border-color: rgb(75, 85, 99);
}

.custom-tag.dark-theme.outlined :deep(.p-tag) {
  background-color: transparent;
  border: 1px solid rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}

/* 不同 severity 的暗色模式样式 */
.custom-tag.dark-theme :deep(.p-tag.p-tag-success) {
  background-color: rgb(34, 197, 94);
  color: rgb(255, 255, 255);
}

.custom-tag.dark-theme :deep(.p-tag.p-tag-info) {
  background-color: rgb(59, 130, 246);
  color: rgb(255, 255, 255);
}

.custom-tag.dark-theme :deep(.p-tag.p-tag-warning),
.custom-tag.dark-theme :deep(.p-tag.p-tag-warn) {
  background-color: rgb(245, 158, 11);
  color: rgb(255, 255, 255);
}

.custom-tag.dark-theme :deep(.p-tag.p-tag-danger) {
  background-color: rgb(239, 68, 68);
  color: rgb(255, 255, 255);
}
</style>
