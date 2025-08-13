<template>
  <NTag
    :type="type"
    :size="size"
    :closable="closable"
    :checkable="checkable"
    :checked="checked"
    :class="tagClass"
    v-bind="$attrs"
    @close="handleClose"
    @click="handleClick"
  >
    <slot />
  </NTag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTag } from 'naive-ui'

interface Props {
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  closable?: boolean
  checkable?: boolean
  checked?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'medium',
  closable: false,
  checkable: false,
  checked: false
})

interface Emits {
  (e: 'close'): void
  (e: 'click', event: MouseEvent): void
}

const emit = defineEmits<Emits>()

// 样式类
const tagClass = computed(() => {
  return [
    'inline-flex items-center',
    props.class
  ].filter(Boolean).join(' ')
})

// 事件处理
const handleClose = () => {
  emit('close')
}

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>
