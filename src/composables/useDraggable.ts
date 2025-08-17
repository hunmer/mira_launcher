import type { GridItem } from '@/types/components'
import { ref, type Ref } from 'vue'

export interface UseDraggableOptions {
  // Basic configuration options
  animation?: number
  ghostClass?: string
  chosenClass?: string
  dragClass?: string
  disabled?: boolean
  delay?: number
  delayOnTouchStart?: number
  touchStartThreshold?: number

  // Custom event callbacks
  onStart?: (event: unknown) => void
  onMove?: (event: unknown) => void
  onEnd?: (event: unknown) => void
  onUpdate?: (event: unknown) => void
}

export interface DraggableState {
  isDragging: boolean
  draggedItem: GridItem | null
  draggedFromIndex: number
  draggedToIndex: number
}

export function useDraggable(
  _containerRef: Ref<HTMLElement | undefined>,
  _items: Ref<GridItem[]>,
  _options: UseDraggableOptions = {},
) {
  // Simple stub implementation for compatibility
  // Note: This is a compatibility stub since we moved to vue3-smooth-dnd

  const draggableState = ref<DraggableState>({
    isDragging: false,
    draggedItem: null,
    draggedFromIndex: -1,
    draggedToIndex: -1,
  })

  const setEnabled = (enabled: boolean) => {
    // Stub implementation
    console.log('Draggable set enabled:', enabled)
  }

  return {
    draggableState,
    setEnabled,
  }
}
