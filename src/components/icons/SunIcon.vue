<template>
  <BaseIcon 
    :icon-component="Sun" 
    :size="size"
    :color="color"
    :class="iconClass"
    v-bind="$attrs"
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
})

// 样式类
const iconClass = computed(() => {
  return [
    'text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 transition-colors',
    props.class,
  ].filter(Boolean).join(' ')
})
</script>
