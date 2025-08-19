<!-- Tag 组件 - 包装 PrimeVue Tag 以支持自定义样式和暗色模式 -->
<template>
    <Tag
        v-bind="{
            ...$attrs,
            severity: mappedSeverity,
            class: tagClass,
        }"
    >
        <slot />
    </Tag>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import Tag from 'primevue/tag'
import { computed } from 'vue'

interface Props {
    severity?:
        | 'secondary'
        | 'success'
        | 'info'
        | 'warning'
        | 'warn'
        | 'danger'
        | 'contrast'
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
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}
</style>
