<template>
  <BaseIcon 
    :icon-component="Zap" 
    :size="size"
    :color="color"
    :class="iconClass"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Zap } from 'lucide-vue-next'
import BaseIcon from './BaseIcon.vue'

interface Props {
  size?: string | number
  color?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  color: 'currentColor'
})

// 样式类
const iconClass = computed(() => {
  return [
    'text-primary-600 dark:text-primary-400',
    props.class
  ].filter(Boolean).join(' ')
})
</script>
