<template>
  <NEmpty
    :description="description"
    :size="size"
    :class="emptyClass"
    v-bind="$attrs"
  >
    <template
      v-if="$slots['icon']"
      #icon
    >
      <slot name="icon" />
    </template>
    
    <template
      v-if="$slots['extra']"
      #extra
    >
      <slot name="extra" />
    </template>
    
    <slot />
  </NEmpty>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NEmpty } from 'naive-ui'

interface Props {
  description?: string
  size?: 'small' | 'medium' | 'large' | 'huge'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  size: 'medium',
})

// 样式类
const emptyClass = computed(() => {
  return [
    'flex flex-col items-center justify-center',
    props.class,
  ].filter(Boolean).join(' ')
})
</script>
