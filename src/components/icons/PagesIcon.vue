<template>
  <BaseIcon
    :icon-component="Files"
    v-bind="{
      ...(size !== undefined && { size }),
      ...(color !== undefined && { color }),
      ...(customClass !== undefined && { class: customClass }),
      ...$attrs
    }"
  />
</template>

<script setup lang="ts">
import { Files } from 'lucide-vue-next'
import BaseIcon from './BaseIcon.vue'

interface Props {
    size?: string | number
    color?: string
    customClass?: string
}

withDefaults(defineProps<Props>(), {
  size: 16,
  color: 'currentColor',
  customClass: '',
})
</script>
