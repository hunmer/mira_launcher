<template>
    <Badge
        v-if="displayValue !== undefined"
        :value="displayValue"
        :severity="primeVueSeverity"
        :class="badgeClass"
        v-bind="$attrs"
    >
        <slot />
    </Badge>
    <div
        v-else-if="props.dot"
        :class="['inline-block relative', badgeClass]"
    >
        <slot />
        <span
            :class="[
                'absolute -top-1 -right-1 w-2 h-2 rounded-full',
                severityColorClass
            ]"
        />
    </div>
    <div
        v-else
        :class="badgeClass"
    >
        <slot />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Badge from 'primevue/badge'

interface Props {
    value?: string | number
    max?: number
    showZero?: boolean
    dot?: boolean
    type?: 'default' | 'info' | 'success' | 'warning' | 'error'
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    value: '',
    max: 99,
    showZero: false,
    dot: false,
    type: 'default',
    class: '',
})

// 转换类型到 PrimeVue 的 severity
const primeVueSeverity = computed(() => {
    const typeMap = {
        default: undefined,
        info: 'info',
        success: 'success',
        warning: 'warn',
        error: 'danger',
    }
    return typeMap[props.type]
})

// 显示值处理
const displayValue = computed(() => {
    if (props.dot) return undefined
  
    const numValue = Number(props.value)
    if (isNaN(numValue)) return props.value
  
    if (numValue === 0 && !props.showZero) return undefined
    if (numValue > props.max) return `${props.max}+`
  
    return numValue.toString()
})

// 点状徽章颜色类
const severityColorClass = computed(() => {
    const colorMap = {
        default: 'bg-gray-500',
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
    }
    return colorMap[props.type]
})

// 样式类
const badgeClass = computed(() => {
    return [
        'inline-block',
        props.class,
    ].filter(Boolean).join(' ')
})
</script>

<style scoped>
:deep(.p-badge-dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
