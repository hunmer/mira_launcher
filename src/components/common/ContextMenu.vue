<template>
  <Teleport to="body">
    <TieredMenu v-if="show" ref="menu" :model="menuItems" :popup="false" :style="menuPosition"
      @hide="emit('update:show', false)" />
  </Teleport>
</template>

<script setup lang="ts">
import TieredMenu from 'primevue/tieredmenu'
import { computed } from 'vue'

export interface MenuItem {
  label: string
  icon?: string
  action?: () => void
  danger?: boolean
  separator?: boolean
}

interface Props {
  show: boolean
  x: number
  y: number
  items: MenuItem[]
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'select', item: MenuItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 菜单尺寸估算
const MENU_MIN_WIDTH = 192 // 12rem = 192px
const MENU_MAX_WIDTH = 320 // 20rem = 320px
const MENU_ITEM_HEIGHT = 44 // 更精确的菜单项高度（包含padding）
const MENU_PADDING = 16 // 菜单内边距
const SCREEN_MARGIN = 10 // 屏幕边距

// 计算菜单位置，确保不超出屏幕边界
const menuPosition = computed(() => {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  // 计算实际的菜单项数量（排除分隔符的高度差异）
  const actualItems = props.items.filter(item => !item.separator).length
  const separators = props.items.filter(item => item.separator).length

  // 估算菜单高度：菜单项 + 分隔符（高度较小）+ 内边距
  const menuHeight = actualItems * MENU_ITEM_HEIGHT + separators * 9 + MENU_PADDING

  // 使用最小宽度作为估算宽度
  const menuWidth = MENU_MIN_WIDTH

  let x = props.x
  let y = props.y

  // 检查右边界
  if (x + menuWidth > screenWidth - SCREEN_MARGIN) {
    x = screenWidth - menuWidth - SCREEN_MARGIN
  }

  // 检查左边界
  if (x < SCREEN_MARGIN) {
    x = SCREEN_MARGIN
  }

  // 检查下边界
  if (y + menuHeight > screenHeight - SCREEN_MARGIN) {
    y = screenHeight - menuHeight - SCREEN_MARGIN
  }

  // 检查上边界
  if (y < SCREEN_MARGIN) {
    y = SCREEN_MARGIN
  }

  return {
    position: 'fixed',
    top: y + 'px',
    left: x + 'px',
    zIndex: 1000
  }
})

// 将自定义MenuItem转换为PrimeVue TieredMenu格式
const menuItems = computed(() => {
  return props.items.map(item => {
    if (item.separator) {
      return { separator: true }
    }
    return {
      label: item.label,
      icon: item.icon,
      command: () => {
        emit('select', item)
        item.action?.()
        emit('update:show', false)
      },
      style: item.danger ? 'color: #dc2626' : undefined
    }
  })
})
</script>

<style scoped>
/* TieredMenu自定义样式 */
:deep(.p-tieredmenu) {
  min-width: 12rem;
  max-width: 20rem;
  backdrop-filter: blur(8px);
  /* 确保不会超出视口 */
  box-sizing: border-box;
}

:deep(.p-tieredmenu .p-menuitem-link) {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  transition: all 0.15s ease-out;
}

:deep(.p-tieredmenu .p-menuitem-text) {
  color: #374151;
}

:deep(.dark .p-tieredmenu .p-menuitem-text) {
  color: #e5e7eb;
}

:deep(.p-tieredmenu .p-menuitem-icon) {
  width: 1rem;
  height: 1rem;
  margin-right: 0.75rem;
  color: #6b7280;
}

:deep(.dark .p-tieredmenu .p-menuitem-icon) {
  color: #9ca3af;
}

/* 危险样式 */
:deep(.p-tieredmenu .p-menuitem-link[style*="color: #dc2626"]) {
  color: #dc2626 !important;
}

:deep(.dark .p-tieredmenu .p-menuitem-link[style*="color: #dc2626"]) {
  color: #f87171 !important;
}

:deep(.p-tieredmenu .p-menuitem-link[style*="color: #dc2626"]:hover) {
  background-color: #fef2f2 !important;
}

:deep(.dark .p-tieredmenu .p-menuitem-link[style*="color: #dc2626"]:hover) {
  background-color: rgba(127, 29, 29, 0.2) !important;
}
</style>
