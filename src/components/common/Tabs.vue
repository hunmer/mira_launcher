<!-- Tabs 组件 - 包装 PrimeVue Tabs 以支持自定义样式和暗色模式 -->
<template>
    <Tabs
        :value="value || '0'"
        v-bind="$attrs"
        :class="tabsClass"
    >
        <slot />
    </Tabs>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Tabs from 'primevue/tabs'
import { useThemeStore } from '@/stores/theme'

interface Props {
    value?: string | number
}

withDefaults(defineProps<Props>(), {
    value: '0',
})

const themeStore = useThemeStore()

// 计算标签页样式类
const tabsClass = computed(() => {
    const classes = ['custom-tabs']

    if (themeStore.currentTheme === 'dark') {
        classes.push('dark-theme')
    }

    return classes.join(' ')
})
</script>

<style scoped>
.custom-tabs {
  transition: all 0.2s ease;
}

.custom-tabs.dark-theme :deep(.p-tabs-nav) {
  background-color: rgb(31, 41, 55);
  border-bottom-color: rgb(75, 85, 99);
}

.custom-tabs.dark-theme :deep(.p-tabs-tab) {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
  color: rgb(156, 163, 175);
}

.custom-tabs.dark-theme :deep(.p-tabs-tab:hover) {
  background-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}

.custom-tabs.dark-theme :deep(.p-tabs-tab.p-tabs-tab-active) {
  background-color: rgb(31, 41, 55);
  color: rgb(59, 130, 246);
  border-bottom-color: rgb(59, 130, 246);
}

.custom-tabs.dark-theme :deep(.p-tabs-panels) {
  background-color: rgb(31, 41, 55);
  color: rgb(229, 231, 235);
}
</style>
