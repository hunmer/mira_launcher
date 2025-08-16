<!-- ProgressSpinner 组件 - 包装 PrimeVue ProgressSpinner 以支持自定义样式和暗色模式 -->
<template>
    <ProgressSpinner
        v-bind="{
            ...$attrs,
            class: spinnerClass
        }"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 计算加载器样式类
const spinnerClass = computed(() => {
    const classes = ['custom-progress-spinner']
  
    if (themeStore.currentTheme === 'dark') {
        classes.push('dark-theme')
    }
  
    return classes.join(' ')
})
</script>

<style scoped>
.custom-progress-spinner {
  transition: all 0.2s ease;
}

.custom-progress-spinner.dark-theme :deep(.p-progress-spinner-circle) {
  stroke: rgb(156, 163, 175);
}

.custom-progress-spinner.dark-theme :deep(.p-progress-spinner-path) {
  stroke: rgb(59, 130, 246);
}
</style>
