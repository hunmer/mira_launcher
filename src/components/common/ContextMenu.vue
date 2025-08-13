<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      :class="contextMenuClass"
      :style="menuStyle"
      @click.stop
      @contextmenu.prevent
    >
      <template
        v-for="(item, index) in items"
        :key="index"
      >
        <!-- 分隔线 -->
        <div
          v-if="item.separator"
          class="context-menu-separator"
        />

        <!-- 菜单项 -->
        <div
          v-else
          :class="getItemClass(item)"
          @click="handleItemClick(item)"
          @mouseenter="handleItemHover(item, index)"
        >
          <!-- 图标 -->
          <div
            v-if="item.icon"
            class="context-menu-icon"
          >
            <component
              :is="item.icon"
              :size="16"
            />
          </div>

          <!-- 标签 -->
          <span class="context-menu-label">{{ item.label }}</span>

          <!-- 快捷键 -->
          <span
            v-if="item.shortcut"
            class="context-menu-shortcut"
          >
            {{ item.shortcut }}
          </span>

          <!-- 子菜单箭头 -->
          <div
            v-if="item.children && item.children.length > 0"
            class="context-menu-arrow"
          >
            ▶
          </div>
        </div>

        <!-- 子菜单 -->
        <ContextMenu
          v-if="item.children && item.children.length > 0 && hoveredItemIndex === index"
          :visible="true"
          :items="item.children"
          :position="getSubmenuPosition(index)"
          @select="handleSubmenuSelect"
          @close="handleSubmenuClose"
        />
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import type { Component } from 'vue'
import { computed, nextTick, onMounted, onUnmounted, ref, unref, watch } from 'vue'

export interface MenuItem {
    label: string
    icon?: Component | string
    disabled?: boolean
    danger?: boolean
    separator?: boolean
    shortcut?: string
    children?: MenuItem[]
    action?: () => void | Promise<void>
}

export interface ContextMenuProps {
    visible?: boolean
    items?: MenuItem[]
    position?: { x: number; y: number }
    class?: string
}

interface Emits {
    (e: 'select', item: MenuItem): void
    (e: 'close'): void
    (e: 'update:visible', visible: boolean): void
}

const props = withDefaults(defineProps<ContextMenuProps>(), {
  visible: false,
  items: () => [],
  position: () => ({ x: 0, y: 0 }),
})

const emit = defineEmits<Emits>()

// 响应式引用
const menuRef = ref<HTMLElement>()
const hoveredItemIndex = ref(-1)
const focusedItemIndex = ref(0)

// 虚拟元素用于定位
const virtualElement = computed(() => ({
  getBoundingClientRect: () => ({
    width: 0,
    height: 0,
    x: props.position.x,
    y: props.position.y,
    top: props.position.y,
    left: props.position.x,
    right: props.position.x,
    bottom: props.position.y,
  } as DOMRect),
}))

// 使用 floating-ui 进行定位
const { floatingStyles, update } = useFloating(virtualElement, menuRef, {
  middleware: [
    offset(4),
    flip(),
    shift({ padding: 8 }),
  ],
})

// 样式类计算
const contextMenuClass = computed(() => {
  const classes = ['context-menu-base']

  if (props.class) {
    classes.push(props.class)
  }

  return classes.filter(Boolean).join(' ')
})

// 菜单样式
const menuStyle = computed(() => {
  return {
    ...floatingStyles.value,
    zIndex: 1000,
  }
})

// 过滤的菜单项（排除分隔线用于键盘导航）
const navigableItems = computed(() =>
  props.items.filter(item => !item.separator && !item.disabled),
)

// 获取菜单项样式类
const getItemClass = (item: MenuItem) => {
  const classes = ['context-menu-item']

  if (item.disabled) {
    classes.push('context-menu-item-disabled')
  }

  if (item.danger) {
    classes.push('context-menu-item-danger')
  }

  return classes.join(' ')
}

// 获取子菜单位置
const getSubmenuPosition = (index: number) => {
  if (!menuRef.value) return { x: 0, y: 0 }

  const menuRect = menuRef.value.getBoundingClientRect()
  const itemElements = menuRef.value.querySelectorAll('.context-menu-item')
  const itemRect = itemElements[index]?.getBoundingClientRect()

  if (!itemRect) return { x: 0, y: 0 }

  return {
    x: menuRect.right,
    y: itemRect.top,
  }
}

// 事件处理
const handleItemClick = async (item: MenuItem) => {
  if (item.disabled) return

  if (item.action) {
    await item.action()
  }

  emit('select', item)

  if (!item.children || item.children.length === 0) {
    handleClose()
  }
}

const handleItemHover = (item: MenuItem, index: number) => {
  if (!item.disabled) {
    hoveredItemIndex.value = index
    focusedItemIndex.value = index
  }
}

const handleSubmenuSelect = (item: MenuItem) => {
  emit('select', item)
  handleClose()
}

const handleSubmenuClose = () => {
  hoveredItemIndex.value = -1
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

// 键盘导航
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible) return

  switch (event.key) {
  case 'Escape':
    event.preventDefault()
    handleClose()
    break

  case 'ArrowDown':
    event.preventDefault()
    focusedItemIndex.value = Math.min(
      focusedItemIndex.value + 1,
      navigableItems.value.length - 1,
    )
    break

  case 'ArrowUp':
    event.preventDefault()
    focusedItemIndex.value = Math.max(focusedItemIndex.value - 1, 0)
    break

  case 'Enter':
    event.preventDefault()
    const focusedItem = navigableItems.value[focusedItemIndex.value]
    if (focusedItem) {
      handleItemClick(focusedItem)
    }
    break

  case 'ArrowRight':
    event.preventDefault()
    const currentItem = navigableItems.value[focusedItemIndex.value]
    if (currentItem?.children && currentItem.children.length > 0) {
      hoveredItemIndex.value = focusedItemIndex.value
    }
    break

  case 'ArrowLeft':
    event.preventDefault()
    hoveredItemIndex.value = -1
    break
  }
}

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  if (props.visible && menuRef.value && !menuRef.value.contains(event.target as Node)) {
    handleClose()
  }
}

// 监听可见性变化
watch(() => props.visible, async (visible) => {
  if (visible) {
    await nextTick()
    update()
    focusedItemIndex.value = 0
    hoveredItemIndex.value = -1
  }
})

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)

  if (props.visible && menuRef.value) {
    const cleanup = autoUpdate(unref(virtualElement), menuRef.value, update)
    onUnmounted(cleanup)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.context-menu-base {
    position: fixed;
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 4px 0;
    min-width: 150px;
    max-width: 300px;
}

.dark .context-menu-base {
    background-color: #374151;
    border-color: #4b5563;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.context-menu-item {
    padding: 8px 16px;
    cursor: pointer;
    font-size: 0.875rem;
    color: #374151;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
}

.dark .context-menu-item {
    color: #d1d5db;
}

.context-menu-item:hover {
    background-color: #f3f4f6;
}

.dark .context-menu-item:hover {
    background-color: #4b5563;
}

.context-menu-item-disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.context-menu-item-disabled:hover {
    background-color: transparent;
}

.context-menu-item-danger {
    color: #dc2626;
}

.dark .context-menu-item-danger {
    color: #ef4444;
}

.context-menu-separator {
    height: 1px;
    background-color: #e5e7eb;
    margin: 4px 0;
}

.dark .context-menu-separator {
    background-color: #4b5563;
}

.context-menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
}

.context-menu-label {
    flex: 1;
}

.context-menu-shortcut {
    font-size: 0.75rem;
    color: #6b7280;
    margin-left: auto;
}

.dark .context-menu-shortcut {
    color: #9ca3af;
}

.context-menu-arrow {
    font-size: 0.75rem;
    color: #6b7280;
    margin-left: auto;
}

.dark .context-menu-arrow {
    color: #9ca3af;
}
</style>
