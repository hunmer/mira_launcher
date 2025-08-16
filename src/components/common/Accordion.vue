<!-- Accordion 组件 - 包装 PrimeVue Accordion 以支持自定义样式和暗色模式 -->
<template>
    <Accordion
        v-bind="{
            ...$attrs,
            class: accordionClass
        }"
    >
        <slot />
    </Accordion>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Accordion from 'primevue/accordion'
import { useThemeStore } from '@/stores/theme'

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

.custom-accordion.dark-theme :deep(.p-accordion) {
  background-color: rgb(31, 41, 55);
}

.custom-accordion.dark-theme :deep(.p-accordion-header) {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
}

.custom-accordion.dark-theme :deep(.p-accordion-header-link) {
  background-color: rgb(55, 65, 81);
  color: rgb(229, 231, 235);
  border-color: rgb(75, 85, 99);
}

.custom-accordion.dark-theme :deep(.p-accordion-header:hover .p-accordion-header-link) {
  background-color: rgb(75, 85, 99);
  color: rgb(255, 255, 255);
}

.custom-accordion.dark-theme :deep(.p-accordion-content) {
  background-color: rgb(31, 41, 55);
  color: rgb(229, 231, 235);
  border-color: rgb(75, 85, 99);
}

.custom-accordion.dark-theme :deep(.p-accordion-panel) {
  border-color: rgb(75, 85, 99);
}
</style>
