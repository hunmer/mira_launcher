<template>
  <div
    v-if="show"
    :class="spinnerClass"
  >
    <ProgressSpinner
      :style="{ width: spinSize + 'px', height: spinSize + 'px' }"
      stroke-width="4"
      animation-duration="1s"
    />
    <div
      v-if="description || $slots['description']"
      class="ml-2 text-sm text-gray-600"
    >
      <slot name="description">
        {{ description }}
      </slot>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'

interface Props {
  size?: 'small' | 'medium' | 'large' | number
  show?: boolean
  description?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  show: true,
  description: '',
  class: '',
})

// 尺寸映射
const spinSize = computed(() => {
  if (typeof props.size === 'number') {
    return props.size
  }
  
  const sizeMap = {
    small: 14,
    medium: 20,
    large: 28,
  }
  return sizeMap[props.size]
})

// 样式类
const spinnerClass = computed(() => {
  return [
    'inline-flex items-center justify-center',
    props.class,
  ].filter(Boolean).join(' ')
})
</script>
