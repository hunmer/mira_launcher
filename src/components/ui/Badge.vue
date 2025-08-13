<template>
  <NBadge
    :value="value"
    :max="max"
    :show-zero="showZero"
    :dot="dot"
    :type="type"
    :class="badgeClass"
    v-bind="$attrs"
  >
    <slot />
  </NBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NBadge } from 'naive-ui'

interface Props {
  value?: string | number
  max?: number
  showZero?: boolean
  dot?: boolean
  type?: 'default' | 'info' | 'success' | 'warning' | 'error'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  max: 99,
  showZero: false,
  dot: false,
  type: 'default'
})

// 样式类
const badgeClass = computed(() => {
  return [
    'inline-block',
    props.class
  ].filter(Boolean).join(' ')
})
</script>
