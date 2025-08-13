<template>
  <NModal
    v-model:show="modalVisible"
    :title="title"
    :closable="closable"
    :mask-closable="maskClosable"
    :close-on-esc="closeOnEsc"
    :auto-focus="autoFocus"
    :class="modalClass"
    v-bind="$attrs"
    @after-enter="handleAfterEnter"
    @after-leave="handleAfterLeave"
  >
    <NCard
      :title="title"
      :closable="closable"
      :style="cardStyle"
      @close="handleClose"
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
        <slot name="footer" />
      </template>
      
      <template
        v-if="$slots['action']"
        #action
      >
        <div class="flex justify-end space-x-2">
          <slot name="action" />
        </div>
      </template>
    </NCard>
  </NModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NModal, NCard } from 'naive-ui'
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
  (e: 'after-enter'): void
  (e: 'after-leave'): void
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
})

// 卡片样式
const cardStyle = computed(() => {
  return {
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    maxWidth: '90vw',
    maxHeight: '90vh',
  }
})

// 模态框样式类
const modalClass = computed(() => {
  return [
    'flex items-center justify-center',
    props.class,
  ].filter(Boolean).join(' ')
})

// 事件处理
const handleClose = () => {
  modalVisible.value = false
  emit('close')
}

const handleAfterEnter = () => {
  emit('after-enter')
}

const handleAfterLeave = () => {
  emit('after-leave')
}
</script>
