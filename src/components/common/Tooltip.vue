<template>
  <NTooltip
    :trigger="trigger"
    :placement="placement"
    :delay="delay"
    :disabled="disabled"
    :class="tooltipClass"
    v-bind="$attrs"
  >
    <template #trigger>
      <slot />
    </template>
    
    <template #default>
      <slot name="content">
        {{ content }}
      </slot>
    </template>
  </NTooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTooltip } from 'naive-ui'

interface Props {
  content?: string
  trigger?: 'hover' | 'focus' | 'click' | 'manual'
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'
  delay?: number
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  trigger: 'hover',
  placement: 'top',
  delay: 100,
  disabled: false
})

// 样式类
const tooltipClass = computed(() => {
  return [
    'inline-block',
    props.class
  ].filter(Boolean).join(' ')
})
</script>
