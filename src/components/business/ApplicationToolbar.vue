<template>
    <div class="toolbar">
        <div class="toolbar-left">
            <!-- 移除分组切换选择器，改为在页面容器顶部显示 -->
        </div>

        <div class="toolbar-right">
      <!-- 添加新项目下拉菜单 (使用通用 ContextMenu) -->
      <div class="add-item-dropdown">
        <Button
          icon="pi pi-plus-circle"
          class="add-item-btn"
          size="small"
          variant="primary"
          title="添加新项目"
          @click="toggleAddItemMenu"
        />
        <ContextMenu
          :show="showAddItemMenu"
          :x="addItemMenuPosition.x"
          :y="addItemMenuPosition.y"
          :items="addItemContextItems"
          @update:show="showAddItemMenu = $event"
          @select="onAddItemSelect"
        />
      </div>

            <!-- 排序控制 -->
            <div class="sort-controls">
                <FilterSelect
                    :model-value="currentSortType"
                    :options="sortOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="排序方式"
                    @update:model-value="$emit('sort-change', $event)"
                >
                    <template #value="{ value }">
                        <div v-if="value" class="flex items-center gap-2">
                            <i :class="getSortIcon(value)" />
                            <span>{{ getSortLabel(value) }}</span>
                        </div>
                        <span v-else>排序</span>
                    </template>
                    <template #option="{ option }">
                        <div class="flex items-center gap-2">
                            <i :class="option.icon" />
                            <span>{{ option.label }}</span>
                        </div>
                    </template>
                </FilterSelect>
        <!-- 自定义排序模式不显示升/降序按钮 -->
        <Button
          v-if="currentSortType !== 'custom'"
          :icon="sortAscending ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down-alt'"
          :title="sortAscending ? '升序' : '降序'"
          size="small"
          :variant="sortAscending ? 'success' : 'secondary'"
          @click="$emit('sort-order-toggle')"
        />
                <Button
                    icon="pi pi-refresh"
                    title="清空排序"
                    size="small"
                    variant="danger"
                    @click="applicationsStore.clearCurrentPageGridPositions"
                />
            </div>
            

            <!-- 视图切换 -->
            <div class="view-controls">
                <Button
                    icon="pi pi-th-large"
                    :variant="layoutMode === 'grid' ? 'primary' : 'outlined'"
                    title="网格视图"
                    size="small"
                    @click="$emit('layout-change', 'grid')"
                />
                <Button
                    icon="pi pi-list"
                    :variant="layoutMode === 'list' ? 'primary' : 'outlined'"
                    title="列表视图"
                    size="small"
                    @click="$emit('layout-change', 'list')"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import ContextMenu, { type MenuItem } from '@/components/common/ContextMenu.vue'
import FilterSelect from '@/components/common/FilterSelect.vue'
import { useApplicationsStore } from '@/stores/applications'
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface SortOption {
    label: string
    value: string
    icon: string
}

// 扩展菜单项类型定义
interface ExtendedAddMenuItem {
  id: string
  label: string
  icon: string
  type: 'app' | 'test' | 'custom'
  handler?: (() => void | Promise<void>) | undefined
  priority?: number
  pluginId?: string
}

interface Props {
    layoutMode: 'grid' | 'list'
    currentSortType: string
    sortAscending: boolean
    sortOptions: SortOption[]
  addMenuItems?: ExtendedAddMenuItem[]
}

interface Emits {
  (e: 'add-entry', entryId?: string): void
  (e: 'add-test-data'): void
  (e: 'layout-change', mode: 'grid' | 'list'): void
  (e: 'sort-change', sortType: string): void
  (e: 'sort-order-toggle'): void
  (e: 'sort-reset'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const applicationsStore = useApplicationsStore()

// 添加菜单 (ContextMenu)
const showAddItemMenu = ref(false)
const addItemMenuPosition = ref({ x: 0, y: 0 })
const addItemContextItems = computed<MenuItem[]>(() => {
  if (props.addMenuItems && props.addMenuItems.length) {
    // 按类型分组：app类型优先，custom其次，test最后
    const groupedItems = {
      app: props.addMenuItems.filter(m => m.type === 'app'),
      custom: props.addMenuItems.filter(m => m.type === 'custom'),
      test: props.addMenuItems.filter(m => m.type === 'test'),
    }
    
    const items: MenuItem[] = []
    
    // 添加应用类型入口
    if (groupedItems.app.length > 0) {
      groupedItems.app
        .sort((a, b) => {
          // 按优先级排序（如果有），否则按label排序
          const aPriority = a.priority ?? 100
          const bPriority = b.priority ?? 100
          if (aPriority !== bPriority) return aPriority - bPriority
          return a.label.localeCompare(b.label)
        })
        .forEach(m => {
          items.push({
            label: m.pluginId ? `${m.label} (插件)` : m.label,
            icon: m.icon,
            action: () => emit('add-entry', m.id),
          })
        })
    }
    
    // 添加自定义类型入口（如果存在）
    if (groupedItems.custom.length > 0) {
      if (items.length > 0) {
        items.push({ label: '', separator: true })
      }
      groupedItems.custom
        .sort((a, b) => {
          const aPriority = a.priority ?? 200
          const bPriority = b.priority ?? 200
          if (aPriority !== bPriority) return aPriority - bPriority
          return a.label.localeCompare(b.label)
        })
        .forEach(m => {
          items.push({
            label: `${m.label} (自定义)`,
            icon: m.icon,
            action: () => m.handler?.(),
          })
        })
    }
    
    // 添加测试类型入口（如果存在）
    if (groupedItems.test.length > 0) {
      if (items.length > 0) {
        items.push({ label: '', separator: true })
      }
      groupedItems.test.forEach(m => {
        items.push({
          label: `${m.label} (测试)`,
          icon: m.icon,
          action: () => emit('add-test-data'),
        })
      })
    }
    
    return items
  }
  
  // 默认菜单（当没有插件注册时）
  return [
    { label: '添加应用', icon: 'pi pi-plus', action: () => emit('add-entry') },
    { label: '', separator: true },
    { label: '测试数据', icon: 'pi pi-flask', action: () => emit('add-test-data') },
  ]
})

const toggleAddItemMenu = (e: MouseEvent) => {
  if (!showAddItemMenu.value) {
    // 计算更精确的菜单位置
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const menuWidth = 200 // 估算菜单宽度
    
    // 如果右侧空间不足，则向左偏移
    let x = rect.right - menuWidth
    if (x < 10) {
      x = rect.left
    }
    
    addItemMenuPosition.value = { 
      x, 
      y: rect.bottom + 8,
    }
    showAddItemMenu.value = true
  } else {
    showAddItemMenu.value = false
  }
}

const onAddItemSelect = (item: MenuItem) => {
  // 执行菜单项的action，增加错误处理
  try {
    item.action?.()
  } catch (error) {
    console.error('菜单操作执行失败:', error)
  }
  showAddItemMenu.value = false
}

// 获取排序图标
const getSortIcon = (sortValue: string) => {
    const sortOption = props.sortOptions.find((option: SortOption) => option.value === sortValue)
    return sortOption?.icon || 'pi pi-sort'
}

// 获取排序标签
const getSortLabel = (sortValue: string) => {
    const sortOption = props.sortOptions.find((option: SortOption) => option.value === sortValue)
    return sortOption?.label || '排序'
}

// 点击外部关闭
const handleGlobalClick = (e: MouseEvent) => {
  if (showAddItemMenu.value) {
    const target = e.target as HTMLElement
    if (!target.closest('.add-item-dropdown') && !target.closest('.p-tieredmenu')) {
      showAddItemMenu.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgb(229 231 235);
}

.dark .toolbar {
  background-color: rgba(31, 41, 55, 0.8);
  border-bottom: 1px solid rgb(75 85 99);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-controls,
.sort-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 添加项目下拉菜单 */
.add-item-dropdown {
  position: relative;
  display: inline-block;
}
</style>
