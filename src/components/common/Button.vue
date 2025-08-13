<template>
  <Button
    v-bind="{
      ...$attrs,
      ...(primeVueSeverity !== undefined && { severity: primeVueSeverity }),
      ...(primeVueSize !== undefined && { size: primeVueSize }),
      ...(loading !== undefined && { loading }),
      ...(disabled !== undefined && { disabled }),
      class: buttonClass
    }"
    @click="handleClick"
  >
    <slot />
  </Button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
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

// 转换类型到 PrimeVue 的 severity
const primeVueSeverity = computed(() => {
  const typeMap = {
    default: undefined,
    primary: 'primary',
    secondary: 'secondary',
    success: 'success',
    warning: 'warn',
    error: 'danger',
  }
  return typeMap[props.type]
})

// 转换尺寸到 PrimeVue 的格式
const primeVueSize = computed(() => {
  const sizeMap = {
    small: 'small',
    medium: undefined,
    large: 'large',
  }
  return sizeMap[props.size]
})

// 样式类
const buttonClass = computed(() => {
  return [
    'transition-all duration-200',
    props.block ? 'w-full' : '',
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
