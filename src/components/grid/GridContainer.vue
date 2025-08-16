<template>
    <div
        ref="containerRef"
        :class="gridContainerClass"
    >
        <slot />
    </div>
</template>

<script setup lang="ts">
import { useDraggable, type UseDraggableOptions } from '@/composables/useDraggable'
import type { GridItem } from '@/types/components'
import { computed, ref, toRef } from 'vue'

export interface GridContainerProps {
    columns?: number | 'auto'
    gap?: number | 'sm' | 'md' | 'lg' | 'xl'
    responsive?: boolean
    autoRows?: boolean
    class?: string
    items?: GridItem[]
    draggable?: boolean
    dragOptions?: UseDraggableOptions
    iconSize?: number
    minColumns?: number
    maxIconSize?: number
}

interface Emits {
    (e: 'dragStart', event: unknown): void
    (e: 'dragMove', event: unknown): void
    (e: 'dragEnd', event: unknown): void
    (e: 'dragUpdate', event: unknown): void
}

const props = withDefaults(defineProps<GridContainerProps>(), {
    columns: 'auto',
    gap: 'md',
    responsive: true,
    autoRows: true,
    class: '',
    dragOptions: () => ({}),
    items: () => [],
    draggable: false,
    iconSize: 48,
    minColumns: 4,
    maxIconSize: 200,
})

const emit = defineEmits<Emits>()

// 容器引用
const containerRef = ref<HTMLElement>()

// 拖拽功能集成
const itemsRef = toRef(props, 'items')
const draggableOptions: UseDraggableOptions = {
    ...props.dragOptions,
    onStart: (event) => {
        emit('dragStart', event)
        props.dragOptions?.onStart?.(event)
    },
    onMove: (event) => {
        emit('dragMove', event)
        props.dragOptions?.onMove?.(event)
    },
    onEnd: (event) => {
        emit('dragEnd', event)
        props.dragOptions?.onEnd?.(event)
    },
    onUpdate: (event) => {
        emit('dragUpdate', event)
        props.dragOptions?.onUpdate?.(event)
    },
}

const { draggableState, setEnabled } = useDraggable(
    containerRef,
    itemsRef,
    props.draggable ? draggableOptions : { disabled: true },
)

// 暴露拖拽控制方法
defineExpose({
    setDraggable: setEnabled,
    draggableState,
})

// 样式类计算
const gridContainerClass = computed(() => {
    const classes = ['grid-container-base', 'grid']

    // 列数配置
    if (props.responsive && props.columns === 'auto') {
        // 响应式配置：确保最少4列，根据窗口大小调整
        classes.push(
            `grid-cols-${props.minColumns}`, // 最小4列
            'md:grid-cols-6',
            'lg:grid-cols-8',
            'xl:grid-cols-10',
        )
    } else if (typeof props.columns === 'number') {
        // 固定列数
        const columnMap: Record<number, string> = {
            1: 'grid-cols-1',
            2: 'grid-cols-2',
            3: 'grid-cols-3',
            4: 'grid-cols-4',
            5: 'grid-cols-5',
            6: 'grid-cols-6',
            7: 'grid-cols-7',
            8: 'grid-cols-8',
            9: 'grid-cols-9',
            10: 'grid-cols-10',
            11: 'grid-cols-11',
            12: 'grid-cols-12',
        }
        const columnClass = columnMap[props.columns]
        if (columnClass) {
            classes.push(columnClass)
        }
    }

    // 间距配置
    if (typeof props.gap === 'number') {
        classes.push(`gap-${props.gap}`)
    } else {
        const gapMap = {
            sm: 'gap-2',
            md: 'gap-4',
            lg: 'gap-6',
            xl: 'gap-8',
        }
        classes.push(gapMap[props.gap])
    }

    // 自适应行高
    if (props.autoRows) {
        classes.push('auto-rows-auto')
    }

    // 自定义类名
    if (props.class) {
        classes.push(props.class)
    }

    return classes.filter(Boolean).join(' ')
})
</script>

<style scoped>
.grid-container-base {
  width: 100%;
  position: relative;
}

/* 确保网格项目正确对齐 */
.grid-container-base>* {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
