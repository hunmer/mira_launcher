<template>
    <span
        :style="iconStyle"
        :class="iconClass"
        v-bind="$attrs"
    >
        <component :is="iconComponent" />
    </span>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

interface Props {
    iconComponent: Component // lucide-vue-next 图标组件
    size?: string | number
    color?: string
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    size: 16,
    color: 'currentColor',
    class: '',
})

// 图标样式
const iconStyle = computed(() => {
    return {
        fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
        color: props.color,
        width: typeof props.size === 'number' ? `${props.size}px` : props.size,
        height: typeof props.size === 'number' ? `${props.size}px` : props.size,
    }
})

// 样式类
const iconClass = computed(() => {
    return ['inline-flex items-center justify-center', props.class]
        .filter(Boolean)
        .join(' ')
})
</script>
