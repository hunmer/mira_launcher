<template>
  <div
    :class="gridItemClass"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <slot>
      <!-- 默认内容结构 -->
      <div class="grid-item-content">
        <div class="grid-item-icon">
          <slot name="icon">
            <!-- 默认图标插槽 -->
          </slot>
        </div>
        <div class="grid-item-label">
          <slot name="label">
            <!-- 默认标签插槽 -->
          </slot>
        </div>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface GridItemProps {
    size?: '1x1' | '1x2' | '2x1' | '2x2'
    selected?: boolean
    disabled?: boolean
    hoverable?: boolean
    draggable?: boolean
    class?: string
}

interface Emits {
    (e: 'click', event: MouseEvent): void
    (e: 'contextmenu', event: MouseEvent): void
}

const props = withDefaults(defineProps<GridItemProps>(), {
  size: '1x1',
  selected: false,
  disabled: false,
  hoverable: true,
  draggable: false,
})

const emit = defineEmits<Emits>()

// 样式类计算
const gridItemClass = computed(() => {
  const classes = ['grid-item-base']

  // 尺寸配置
  const sizeMap = {
    '1x1': 'col-span-1 row-span-1',
    '1x2': 'col-span-1 row-span-2',
    '2x1': 'col-span-2 row-span-1',
    '2x2': 'col-span-2 row-span-2',
  }
  classes.push(sizeMap[props.size])

  // 状态类
  if (props.selected) {
    classes.push('grid-item-selected')
  }

  if (props.disabled) {
    classes.push('grid-item-disabled')
  } else {
    if (props.hoverable) {
      classes.push('grid-item-hoverable')
    }
    classes.push('cursor-pointer')
  }

  // 拖拽支持
  if (props.draggable) {
    classes.push('cursor-grab')
  }

  // 自定义类名
  if (props.class) {
    classes.push(props.class)
  }

  return classes.filter(Boolean).join(' ')
})

// 事件处理
const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}

const handleContextMenu = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('contextmenu', event)
  }
}
</script>

<style scoped>
.grid-item-base {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    border-radius: 8px;
    transition: all 0.2s ease-in-out;
    background-color: white;
    border: 1px solid #e5e7eb;
    position: relative;
    min-height: 80px;
}

.dark .grid-item-base {
    background-color: #374151;
    border-color: #4b5563;
}

/* 悬浮效果 */
.grid-item-hoverable:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background-color: #f3f4f6;
}

.dark .grid-item-hoverable:hover {
    background-color: #4b5563;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 选中状态 */
.grid-item-selected {
    background-color: #dbeafe;
    border-color: #3b82f6;
}

.dark .grid-item-selected {
    background-color: #1e3a8a;
    border-color: #60a5fa;
}

/* 禁用状态 */
.grid-item-disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.grid-item-disabled:hover {
    transform: none;
    box-shadow: none;
}

/* 内容布局 */
.grid-item-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.grid-item-icon {
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.grid-item-label {
    font-size: 0.875rem;
    text-align: center;
    color: #374151;
    font-weight: 500;
    line-height: 1.2;
    word-break: break-word;
}

.dark .grid-item-label {
    color: #d1d5db;
}

/* 不同尺寸的特殊样式 */
.row-span-2 {
    min-height: 160px;
}

.col-span-2 .grid-item-content {
    flex-direction: row;
    gap: 0.75rem;
}

.col-span-2 .grid-item-icon {
    margin-bottom: 0;
}

.col-span-2 .grid-item-label {
    text-align: left;
    flex: 1;
}
</style>
