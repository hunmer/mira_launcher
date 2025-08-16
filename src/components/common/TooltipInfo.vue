<template>
    <h3 class="font-medium text-gray-900 dark:text-white inline-flex items-center gap-2">
        <slot />
        <i
            v-tooltip.top="tooltipConfig"
            class="pi pi-info-circle text-gray-400 hover:text-blue-500 cursor-help transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:rounded-full"
            tabindex="0"
        />
    </h3>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    content: string
    position?: 'top' | 'bottom' | 'left' | 'right'
    showDelay?: number
    hideDelay?: number
    autoHide?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    position: 'top',
    showDelay: 0,
    hideDelay: 0,
    autoHide: true,
})

const tooltipConfig = computed(() => ({
    value: props.content,
    showDelay: props.showDelay,
    hideDelay: props.hideDelay,
    autoHide: props.autoHide,
    pt: {
        root: {
            class: 'max-w-xs',
        },
        text: {
            class: 'text-sm font-medium bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg',
        },
        arrow: {
            style: {
                borderTopColor: 'rgb(17 24 39)', // gray-900
            },
        },
    },
}))
</script>

<style scoped>
/* 深色模式下的样式 */
.dark .pi-info-circle {
  color: rgb(107 114 128);
  /* text-gray-500 */
}

.dark .pi-info-circle:hover {
  color: rgb(96 165 250);
  /* text-blue-400 */
}
</style>
