<template>
  <NButton
    v-bind="$attrs"
    :type="naiveType as any"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :block="block"
    :class="buttonClass"
    @click="handleClick"
  >
    <slot />
  </NButton>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NButton } from 'naive-ui'
import type { ButtonProps } from '@/types/components'

interface Props extends ButtonProps {}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'medium',
  loading: false,
  disabled: false,
  block: false,
})

const emit = defineEmits<Emits>()

interface Emits {
  (e: 'click', event: MouseEvent): void
}

// 转换类型到 Naive UI 的类型
const naiveType = computed(() => {
  const typeMap = {
    default: 'default',
    primary: 'primary',
    secondary: 'tertiary',
    success: 'success',
    warning: 'warning',
    error: 'error',
  }
  return typeMap[props.type] || 'default'
})

// 样式类
const buttonClass = computed(() => {
  return [
    'transition-all duration-200',
    props.class,
  ].filter(Boolean).join(' ')
})

// 点击处理
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
