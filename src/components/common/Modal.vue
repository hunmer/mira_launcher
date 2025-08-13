<template>
  <Dialog
    v-model:visible="modalVisible"
    :header="title"
    :closable="closable"
    :modal="true"
    :dismissable-mask="maskClosable"
    :close-on-escape="closeOnEsc"
    :style="{ width: dialogWidth }"
    :class="modalClass"
    v-bind="$attrs"
    @show="handleAfterEnter"
    @hide="handleAfterLeave"
  >
    <template
      v-if="$slots['header']"
      #header
    >
      <slot name="header" />
    </template>
    
    <slot />
    
    <template
      v-if="$slots['footer']"
      #footer
    >
      <div class="flex justify-end space-x-2">
        <slot name="footer" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import type { ModalProps } from '@/types/components'

interface Props extends ModalProps {
  show?: boolean
  closeOnEsc?: boolean
  autoFocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  title: '',
  width: '520px',
  closable: true,
  maskClosable: true,
  closeOnEsc: true,
  autoFocus: true,
})

const emit = defineEmits<Emits>()

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'afterEnter'): void
  (e: 'afterLeave'): void
  (e: 'close'): void
}

// 内部显示状态管理
const modalVisible = ref(props.show)

// 监听外部显示状态变化
watch(() => props.show, (newValue) => {
  modalVisible.value = newValue
})

// 监听内部显示状态变化
watch(modalVisible, (newValue) => {
  emit('update:show', newValue)
  if (!newValue) {
    emit('close')
  }
})

// 对话框宽度
const dialogWidth = computed(() => {
  return typeof props.width === 'number' ? `${props.width}px` : props.width
})

// 模态框样式类
const modalClass = computed(() => {
  return [
    'mira-dialog',
    props.class,
  ].filter(Boolean).join(' ')
})

// 事件处理
const handleAfterEnter = () => {
  emit('afterEnter')
}

const handleAfterLeave = () => {
  emit('afterLeave')
}
</script>

<style scoped>
:deep(.mira-dialog) {
  max-width: 90vw;
  max-height: 90vh;
}
</style>
