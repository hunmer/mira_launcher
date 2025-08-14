<template>
  <div class="relative inline-flex items-center">
    <slot />
    <button
      class="ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
    >
      <i class="pi pi-info-circle text-sm" />
    </button>
    
    <!-- Tooltip -->
    <div
      v-if="showTooltip"
      class="absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700 tooltip"
      :class="tooltipPosition"
    >
      {{ content }}
      <div 
        class="tooltip-arrow" 
        :class="arrowPosition"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
})

const showTooltip = ref(false)

const tooltipPosition = computed(() => {
  switch (props.position) {
  case 'top':
    return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
  case 'bottom':
    return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
  case 'left':
    return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
  case 'right':
    return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  default:
    return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
  }
})

const arrowPosition = computed(() => {
  switch (props.position) {
  case 'top':
    return 'top-full left-1/2 transform -translate-x-1/2'
  case 'bottom':
    return 'bottom-full left-1/2 transform -translate-x-1/2 rotate-180'
  case 'left':
    return 'left-full top-1/2 transform -translate-y-1/2 rotate-90'
  case 'right':
    return 'right-full top-1/2 transform -translate-y-1/2 -rotate-90'
  default:
    return 'top-full left-1/2 transform -translate-x-1/2'
  }
})
</script>

<style scoped>
.tooltip {
  white-space: nowrap;
  max-width: 200px;
  white-space: normal;
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #1f2937;
}

.dark .tooltip-arrow {
  border-top-color: #374151;
}
</style>
