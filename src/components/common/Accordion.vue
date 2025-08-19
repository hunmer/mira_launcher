<!-- Accordion 组件 - 包装 PrimeVue Accordion 以支持自定义样式和暗色模式 -->
<template>
    <Accordion
        v-bind="{
            ...$attrs,
            class: accordionClass,
        }"
    >
        <slot />
    </Accordion>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import Accordion from 'primevue/accordion'
import { computed } from 'vue'

const themeStore = useThemeStore()

// 计算手风琴样式类
const accordionClass = computed(() => {
    const classes = ['custom-accordion']

    if (themeStore.currentTheme === 'dark') {
        classes.push('dark-theme')
    }

    return classes.join(' ')
})
</script>

<style scoped>
.custom-accordion {
  transition: all 0.2s ease;
}
</style>
