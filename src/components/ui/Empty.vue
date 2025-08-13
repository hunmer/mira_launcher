<template>
  <div
    :class="emptyClass"
    v-bind="$attrs"
  >
    <div :class="iconContainerClass">
      <slot name="icon">
        <i class="pi pi-inbox text-gray-400" />
      </slot>
    </div>
    
    <div :class="descriptionClass">
      {{ description }}
    </div>
    
    <div
      v-if="$slots['extra']"
      class="mt-4"
    >
      <slot name="extra" />
    </div>
    
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  description?: string
  size?: 'small' | 'medium' | 'large' | 'huge'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  size: 'medium',
  class: '',
})

// 尺寸映射
const sizeClasses = computed(() => {
  const sizeMap = {
    small: {
      icon: 'text-4xl mb-2',
      description: 'text-sm',
    },
    medium: {
      icon: 'text-6xl mb-4',
      description: 'text-base',
    },
    large: {
      icon: 'text-8xl mb-6',
      description: 'text-lg',
    },
    huge: {
      icon: 'text-10xl mb-8',
      description: 'text-xl',
    },
  }
  return sizeMap[props.size]
})

// 图标容器样式类
const iconContainerClass = computed(() => {
  return [
    'flex items-center justify-center',
    sizeClasses.value.icon,
  ].join(' ')
})

// 描述文字样式类
const descriptionClass = computed(() => {
  return [
    'text-gray-500 text-center',
    sizeClasses.value.description,
  ].join(' ')
})

// 样式类
const emptyClass = computed(() => {
  return [
    'flex flex-col items-center justify-center py-8',
    props.class,
  ].filter(Boolean).join(' ')
})
</script>
