<template>
  <Card
    :class="cardClass"
    v-bind="$attrs"
  >
    <template
      v-if="title || $slots['header']"
      #title
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <span v-if="title">{{ title }}</span>
          <slot name="header" />
        </div>
        <div class="flex items-center space-x-2">
          <slot name="header-extra" />
          <Button
            v-if="closable"
            text
            severity="secondary"
            size="small"
            icon="pi pi-times"
            @click="handleClose"
          />
        </div>
      </div>
    </template>
    
    <slot />
    
    <template
      v-if="$slots['footer']"
      #footer
    >
      <slot name="footer" />
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'

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
  class: '',
})

const emit = defineEmits<Emits>()

interface Emits {
  (e: 'close'): void
}

// 样式类
const cardClass = computed(() => {
  return [
    'transition-all duration-200',
    props.hoverable && 'hover:shadow-lg cursor-pointer',
    props.class,
  ].filter(Boolean).join(' ')
})

// 事件处理
const handleClose = () => {
  emit('close')
}
</script>
