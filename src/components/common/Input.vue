<template>
  <NInput
    v-model:value="inputValue"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :clearable="clearable"
    :size="size"
    :class="inputClass"
    v-bind="$attrs"
    @input="handleInput"
    @change="handleChange"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <template
      v-if="$slots['prefix']"
      #prefix
    >
      <slot name="prefix" />
    </template>
    <template
      v-if="$slots['suffix']"
      #suffix
    >
      <slot name="suffix" />
    </template>
  </NInput>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NInput } from 'naive-ui'
import type { InputProps } from '@/types/components'

interface Props extends Omit<InputProps, 'type'> {
  value?: string
  size?: 'small' | 'medium' | 'large'
  type?: 'text' | 'password' | 'textarea'
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  clearable: false,
  size: 'medium',
})

const emit = defineEmits<Emits>()

interface Emits {
  (e: 'update:value', value: string): void
  (e: 'input', value: string): void
  (e: 'change', value: string): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}

// 内部值管理
const inputValue = ref(props.value)

// 监听外部值变化
watch(() => props.value, (newValue) => {
  inputValue.value = newValue
})

// 监听内部值变化
watch(inputValue, (newValue) => {
  emit('update:value', newValue)
})

// 样式类
const inputClass = computed(() => {
  return [
    'transition-all duration-200',
    props.class,
  ].filter(Boolean).join(' ')
})

// 事件处理
const handleInput = (value: string) => {
  emit('input', value)
}

const handleChange = (value: string) => {
  emit('change', value)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}
</script>
