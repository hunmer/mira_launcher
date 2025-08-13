<template>
  <div class="flex items-center space-x-2 no-drag">
    <AppIcon :size="16" class="text-primary-600 dark:text-primary-400" />
    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
      {{ appName }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/icons/AppIcon.vue'

interface Props {
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showIcon: true
})

// Store
const appStore = useAppStore()
const { appName } = storeToRefs(appStore)
</script>
