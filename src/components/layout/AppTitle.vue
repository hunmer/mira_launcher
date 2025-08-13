<template>
  <div class="app-title-container">
    <AppIcon :size="18" class="text-primary-600 dark:text-primary-400" />
    <span class="app-title-text">
      {{ appName }}
    </span>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue';
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';

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

<style scoped>
.app-title-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
}

.app-title-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .app-title-text {
  color: #e5e7eb;
}
</style>
