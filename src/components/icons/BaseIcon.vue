<template>
  <NIcon 
    :size="size" 
    :color="color" 
    :class="iconClass"
    v-bind="$attrs"
  >
    <component :is="iconComponent" />
  </NIcon>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NIcon } from 'naive-ui'

interface Props {
  iconComponent: any  // lucide-vue-next 图标组件
  size?: string | number
  color?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  color: 'currentColor'
})

// 样式类
const iconClass = computed(() => {
  return [
    'inline-flex items-center justify-center',
    props.class
  ].filter(Boolean).join(' ')
})
</script>
