<!-- Divider 组件 - 包装 PrimeVue Divider 以支持自定义样式和暗色模式 -->
<template>
    <Divider
        v-bind="{
            ...$attrs,
            class: dividerClass,
        }"
    >
        <slot />
    </Divider>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import Divider from 'primevue/divider'
import { computed } from 'vue'

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
</style>
