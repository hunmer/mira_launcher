<template>
  <div class="flex items-center space-x-3 no-drag">
    <AppIcon :size="18" class="text-primary-600 dark:text-primary-400" />
    <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">
      {{ appName }}
    </span>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

interface Props {
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showIcon: true,
})

// Store
const appStore = useAppStore()
const { appName } = storeToRefs(appStore)
</script>
