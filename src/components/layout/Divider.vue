<template>
  <div :class="dividerClass">
    <div
      v-if="text"
      class="divider-text"
    >
      {{ text }}
    </div>
    <div
      v-else-if="$slots['default']"
      class="divider-text"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  text?: string
  orientation?: 'horizontal' | 'vertical'
  size?: 'thin' | 'normal' | 'thick'
  variant?: 'solid' | 'dashed' | 'dotted'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  orientation: 'horizontal',
  size: 'normal',
  variant: 'solid',
})

// 样式类计算
const dividerClass = computed(() => {
  const classes = ['divider-base']
  
  // 方向
  if (props.orientation === 'horizontal') {
    classes.push('divider-horizontal')
  } else {
    classes.push('divider-vertical')
  }
  
  // 尺寸
  const sizeMap = {
    thin: 'divider-thin',
    normal: 'divider-normal',
    thick: 'divider-thick',
  }
  classes.push(sizeMap[props.size])
  
  // 样式
  const variantMap = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  }
  classes.push(variantMap[props.variant])
  
  if (props.class) {
    classes.push(props.class)
  }
  
  return classes.filter(Boolean).join(' ')
})
</script>

<style scoped>
.divider-base {
  border-color: rgb(229 231 235);
}

.dark .divider-base {
  border-color: rgb(75 85 99);
}

.divider-horizontal {
  width: 100%;
  border-top-width: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.divider-vertical {
  height: 100%;
  border-left-width: 1px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.divider-thin {
  border-top-width: 1px;
}

.divider-normal {
  border-top-width: 2px;
}

.divider-thick {
  border-top-width: 3px;
}

.divider-text {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  background-color: rgb(249 250 251);
  font-size: 0.875rem;
  color: rgb(107 114 128);
}

.dark .divider-text {
  background-color: rgb(17 24 39);
  color: rgb(156 163 175);
}

.divider-vertical .divider-text {
  padding-left: 0;
  padding-right: 0;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
</style>
