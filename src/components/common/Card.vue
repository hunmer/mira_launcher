<template>
  <NCard
    :title="title"
    :hoverable="hoverable"
    :closable="closable"
    :class="cardClass"
    v-bind="$attrs"
    @close="handleClose"
  >
    <template #header v-if="$slots['header']">
      <slot name="header" />
    </template>
    
    <template #header-extra v-if="$slots['header-extra']">
      <slot name="header-extra" />
    </template>
    
    <slot />
    
    <template #footer v-if="$slots['footer']">
      <slot name="footer" />
    </template>
    
    <template #action v-if="$slots['action']">
      <slot name="action" />
    </template>
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'

interface Props {
  title?: string
  hoverable?: boolean
  closable?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  hoverable: false,
  closable: false
})

interface Emits {
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// 样式类
const cardClass = computed(() => {
  return [
    'transition-all duration-200',
    props.hoverable && 'hover:shadow-lg',
    props.class
  ].filter(Boolean).join(' ')
})

// 事件处理
const handleClose = () => {
  emit('close')
}
</script>
