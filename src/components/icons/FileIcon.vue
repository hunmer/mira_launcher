<template>
    <BaseIcon :icon-component="FileText" :size="size" :color="color" :class="class" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import BaseIcon from './BaseIcon.vue'

interface Props {
    size?: string | number
    color?: string
    class?: string
}

withDefaults(defineProps<Props>(), {
    size: 16,
    color: 'currentColor',
    class: '',
})
</script>
