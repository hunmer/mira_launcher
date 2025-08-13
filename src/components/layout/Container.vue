<template>
  <div :class="containerClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  fluid?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  fluid: false,
  maxWidth: 'full',
  padding: 'md',
})

// 样式类计算
const containerClass = computed(() => {
  const classes = ['container-base']
  
  // 最大宽度
  if (!props.fluid) {
    const maxWidthMap = {
      sm: 'max-w-sm',
      md: 'max-w-md', 
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-full',
    }
    classes.push(maxWidthMap[props.maxWidth])
    classes.push('mx-auto')
  } else {
    classes.push('w-full')
  }
  
  // 内边距
  const paddingMap = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  }
  if (paddingMap[props.padding]) {
    classes.push(paddingMap[props.padding])
  }
  
  if (props.class) {
    classes.push(props.class)
  }
  
  return classes.filter(Boolean).join(' ')
})
</script>

<style scoped>
.container-base {
  position: relative;
  width: 100%;
}
</style>
