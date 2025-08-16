<template>
    <BaseIcon 
        :icon-component="Square" 
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
import { Square } from 'lucide-vue-next'
import BaseIcon from './BaseIcon.vue'

interface Props {
    size?: string | number
    color?: string
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    size: 12,
    color: 'currentColor',
    class: '',
})

// 样式类
const iconClass = computed(() => {
    return [
        'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors',
        props.class,
    ].filter(Boolean).join(' ')
})
</script>

<style scoped>
/* 图标样式 */
:deep(.lucide) {
  transition: all 0.2s ease-in-out;
}

:deep(.lucide:hover) {
  transform: scale(1.1);
}
</style>
