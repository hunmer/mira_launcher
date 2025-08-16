<!-- Divider 组件 - 包装 PrimeVue Divider 以支持自定义样式和暗色模式 -->
<template>
    <Divider
        v-bind="{
            ...$attrs,
            class: dividerClass
        }"
    >
        <slot />
    </Divider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Divider from 'primevue/divider'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 计算分割线样式类
const dividerClass = computed(() => {
    const classes = ['custom-divider']
  
    if (themeStore.currentTheme === 'dark') {
        classes.push('dark-theme')
    }
  
    return classes.join(' ')
})
</script>

<style scoped>
.custom-divider {
  transition: border-color 0.2s ease;
}

.custom-divider.dark-theme :deep(.p-divider) {
  border-color: rgb(75, 85, 99);
}

.custom-divider.dark-theme :deep(.p-divider.p-divider-horizontal:before) {
  border-top-color: rgb(75, 85, 99);
}

.custom-divider.dark-theme :deep(.p-divider.p-divider-vertical:before) {
  border-left-color: rgb(75, 85, 99);
}

.custom-divider.dark-theme :deep(.p-divider-content) {
  background-color: rgb(31, 41, 55);
  color: rgb(156, 163, 175);
}
</style>
