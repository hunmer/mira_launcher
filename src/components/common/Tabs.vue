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
import { useThemeStore } from '@/stores/theme';
import Tabs from 'primevue/tabs';
import { computed } from 'vue';

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
</style>
