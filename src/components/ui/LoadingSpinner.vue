<template>
  <NSpin
    :size="spinSize"
    :show="show"
    :class="spinnerClass"
  >
    <template #description v-if="description || $slots['description']">
      <slot name="description">
        {{ description }}
      </slot>
    </template>
    <slot />
  </NSpin>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NSpin } from 'naive-ui'

interface Props {
  size?: 'small' | 'medium' | 'large' | number
  show?: boolean
  description?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  show: true,
  description: ''
})

// 尺寸映射
const spinSize = computed(() => {
  if (typeof props.size === 'number') {
    return props.size
  }
  
  const sizeMap = {
    small: 14,
    medium: 20,
    large: 28
  }
  return sizeMap[props.size]
})

// 样式类
const spinnerClass = computed(() => {
  return [
    'inline-flex items-center justify-center',
    props.class
  ].filter(Boolean).join(' ')
})
</script>
