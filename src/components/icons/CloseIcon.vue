<template>
  <BaseIcon 
    :icon-component="X" 
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
import { X } from 'lucide-vue-next'
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
    'text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors',
    props.class,
  ].filter(Boolean).join(' ')
})
</script>
