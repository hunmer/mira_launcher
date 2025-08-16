<template>
    <BaseIcon 
        :icon-component="Rocket" 
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
import { Rocket } from 'lucide-vue-next'
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
const iconClass = computed(() => props.class)
</script>
