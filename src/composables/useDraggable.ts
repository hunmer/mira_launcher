import { useGridStore } from '@/stores/grid'
import type { GridItem } from '@/types/components'
import Sortable, { type SortableEvent } from 'sortablejs'
import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export interface UseDraggableOptions {
    // SortableJS 配置选项
    animation?: number
    ghostClass?: string
    chosenClass?: string
    dragClass?: string
    disabled?: boolean
    delay?: number
    delayOnTouchStart?: number
    touchStartThreshold?: number

    // 自定义事件回调
    onStart?: (event: SortableEvent) => void
    onMove?: (event: SortableEvent) => void
    onEnd?: (event: SortableEvent) => void
    onUpdate?: (event: SortableEvent) => void
}

export interface DraggableState {
    isDragging: boolean
    draggedItem: GridItem | null
    draggedFromIndex: number
    draggedToIndex: number
}

export function useDraggable(
  containerRef: Ref<HTMLElement | undefined>,
  items: Ref<GridItem[]>,
  options: UseDraggableOptions = {},
) {
  const gridStore = useGridStore()
  const sortableInstance = ref<Sortable | null>(null)

  // 拖拽状态
  const draggableState = ref<DraggableState>({
    isDragging: false,
    draggedItem: null,
    draggedFromIndex: -1,
    draggedToIndex: -1,
  })

  // 默认配置
  const defaultOptions: Partial<UseDraggableOptions> = {
    animation: 200,
    ghostClass: 'drag-ghost',
    chosenClass: 'drag-chosen',
    dragClass: 'drag-active',
    disabled: false,
    delay: 0,
    delayOnTouchStart: 150,
    touchStartThreshold: 10,
  }

  // 合并配置
  const mergedOptions = { ...defaultOptions, ...options }

  // 初始化 SortableJS
  const initSortable = () => {
    if (!containerRef.value) return

    sortableInstance.value = new Sortable(containerRef.value, {
      animation: mergedOptions.animation,
      ghostClass: mergedOptions.ghostClass,
      chosenClass: mergedOptions.chosenClass,
      dragClass: mergedOptions.dragClass,
      disabled: mergedOptions.disabled,
      delay: mergedOptions.delay,
      touchStartThreshold: mergedOptions.touchStartThreshold,

      // 拖拽开始
      onStart: (event: SortableEvent) => {
        const item = items.value[event.oldIndex!]
        if (!item) return

        draggableState.value = {
          isDragging: true,
          draggedItem: item,
          draggedFromIndex: event.oldIndex!,
          draggedToIndex: event.oldIndex!,
        }

        // 更新全局拖拽状态
        gridStore.startDrag(item, event.oldIndex!)

        // 触发自定义回调
        mergedOptions.onStart?.(event)
      },

      // 拖拽移动 - 使用 onSort 而不是 onMove
      onSort: (event: SortableEvent) => {
        const toIndex = event.newIndex!

        draggableState.value.draggedToIndex = toIndex

        // 更新全局拖拽位置
        gridStore.updateDragPosition(toIndex)

        // 触发自定义回调
        mergedOptions.onMove?.(event)
      },

      // 拖拽结束
      onEnd: (event: SortableEvent) => {
        const fromIndex = event.oldIndex!
        const toIndex = event.newIndex!

        // 如果位置有变化，更新数据
        if (fromIndex !== toIndex) {
          // 使用 gridStore 的 moveItem 方法
          gridStore.moveItem(fromIndex, toIndex)

          // 触发更新回调
          mergedOptions.onUpdate?.(event)
        }

        // 重置拖拽状态
        draggableState.value = {
          isDragging: false,
          draggedItem: null,
          draggedFromIndex: -1,
          draggedToIndex: -1,
        }

        // 结束全局拖拽状态
        gridStore.endDrag()

        // 触发自定义回调
        mergedOptions.onEnd?.(event)
      },
    })
  }

  // 销毁 SortableJS 实例
  const destroySortable = () => {
    if (sortableInstance.value) {
      sortableInstance.value.destroy()
      sortableInstance.value = null
    }
  }

  // 启用/禁用拖拽
  const setEnabled = (enabled: boolean) => {
    if (sortableInstance.value) {
      sortableInstance.value.option('disabled', !enabled)
    }
  }

  // 生命周期管理
  onMounted(() => {
    initSortable()
  })

  onUnmounted(() => {
    destroySortable()
  })

  return {
    draggableState,
    sortableInstance,
    initSortable,
    destroySortable,
    setEnabled,
  }
}
