<template>
    <BaseIcon 
        :icon-component="Sun" 
        v-bind="{
            ...(size !== undefined && { size }),
            ...(color !== undefined && { color }),
            ...(iconClass !== undefined && { class: iconClass }),
            ...$attrs
        }"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sun } from 'lucide-vue-next'
import BaseIcon from './BaseIcon.vue'

interface Props {
    size?: string | number
    color?: string
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    size: 16,
    color: 'currentColor',
    class: '',
})

// 样式类
const iconClass = computed(() => {
    return [
        'text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 transition-colors',
        props.class,
    ].filter(Boolean).join(' ')
})
</script>
