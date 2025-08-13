<template>
  <NCard
    :title="title"
    :hoverable="hoverable"
    :closable="closable"
    :class="cardClass"
    v-bind="$attrs"
    @close="handleClose"
  >
    <template
      v-if="$slots['header']"
      #header
    >
      <slot name="header" />
    </template>
    
    <template
      v-if="$slots['header-extra']"
      #header-extra
    >
      <slot name="header-extra" />
    </template>
    
    <slot />
    
    <template
      v-if="$slots['footer']"
      #footer
    >
      <slot name="footer" />
    </template>
    
    <template
      v-if="$slots['action']"
      #action
    >
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
  closable: false,
})

const emit = defineEmits<Emits>()

interface Emits {
  (e: 'close'): void
}

// 样式类
const cardClass = computed(() => {
  return [
    'transition-all duration-200',
    props.hoverable && 'hover:shadow-lg',
    props.class,
  ].filter(Boolean).join(' ')
})

// 事件处理
const handleClose = () => {
  emit('close')
}
</script>
