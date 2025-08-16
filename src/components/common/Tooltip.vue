<template>
    <div
        v-tooltip.top="tooltipOptions"
        :class="tooltipClass"
        v-bind="$attrs"
    >
        <slot />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    content?: string
    trigger?: 'hover' | 'focus' | 'click' | 'manual'
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'
    delay?: number
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    content: '',
    trigger: 'hover',
    placement: 'top',
    delay: 100,
    disabled: false,
    class: '',
})

// Tooltip 配置
const tooltipOptions = computed(() => {
    if (props.disabled) return null
  
    return {
        value: props.content,
        placement: props.placement,
        delay: props.delay,
    }
})

// 样式类
const tooltipClass = computed(() => {
    return [
        'inline-block',
        props.class,
    ].filter(Boolean).join(' ')
})
</script>
