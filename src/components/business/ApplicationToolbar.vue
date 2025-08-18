<template>
    <div class="toolbar">
        <div class="toolbar-left">
            <!-- 分组切换选择器 -->
            <FilterSelect
                :model-value="selectedCategory"
                :options="categories"
                option-label="label"
                option-value="value"
                placeholder="选择分组"
                :filter="true"
                :show-clear="true"
                class="category-selector"
                @update:model-value="$emit('category-change', $event)"
            >
                <template #value="{ value, placeholder }">
                    <div v-if="value" class="flex items-center gap-3">
                        <i :class="getCategoryIcon(value)" />
                        <span>{{ getCategoryLabel(value) }}</span>
                    </div>
                    <span v-else>{{ placeholder }}</span>
                </template>
                <template #option="{ option }">
                    <div class="flex items-center gap-3">
                        <i :class="option.icon" />
                        <span>{{ option.label }}</span>
                    </div>
                </template>
            </FilterSelect>
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
                    class="sort-selector"
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
        <button
          v-if="currentSortType !== 'custom'"
          :class="['sort-order-btn', { ascending: sortAscending }]"
          :title="sortAscending ? '升序' : '降序'"
          @click="$emit('sort-order-toggle')"
        >
          <i :class="sortAscending ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down-alt'" />
        </button>
                <button
                    class="sort-reset-btn"
                    title="清空排序"
                    @click="applicationsStore.clearCurrentPageGridPositions"
                >
                    <i class="pi pi-refresh" />
                </button>
            </div>
            

            <!-- 视图切换 -->
            <div class="view-controls">
                <button
                    :class="['view-btn', { active: layoutMode === 'grid' }]"
                    title="网格视图"
                    @click="$emit('layout-change', 'grid')"
                >
                    <i class="pi pi-th-large" />
                </button>
                <button
                    :class="['view-btn', { active: layoutMode === 'list' }]"
                    title="列表视图"
                    @click="$emit('layout-change', 'list')"
                >
                    <i class="pi pi-list" />
                </button>
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
const props = defineProps<Props>()


const emit = defineEmits<Emits>()


const applicationsStore = useApplicationsStore()


interface Category {
    label: string
    value: string
    icon: string
}

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
    selectedCategory: string
    categories: Category[]
    layoutMode: 'grid' | 'list'
    currentSortType: string
    sortAscending: boolean
    sortOptions: SortOption[]
  addMenuItems?: ExtendedAddMenuItem[]
}

interface Emits {
  (e: 'category-change', category: string): void
  (e: 'add-entry', entryId?: string): void
  (e: 'add-test-data'): void
  (e: 'layout-change', mode: 'grid' | 'list'): void
  (e: 'sort-change', sortType: string): void
  (e: 'sort-order-toggle'): void
  (e: 'sort-reset'): void
}

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

// 获取分组图标
const getCategoryIcon = (categoryValue: string) => {
    const category = props.categories.find(cat => cat.value === categoryValue)
    return category?.icon || 'pi pi-th-large'
}

// 获取分组标签
const getCategoryLabel = (categoryValue: string) => {
    const category = props.categories.find(cat => cat.value === categoryValue)
    return category?.label || '全部应用'
}

// 获取排序图标
const getSortIcon = (sortValue: string) => {
    const sortOption = props.sortOptions.find(option => option.value === sortValue)
    return sortOption?.icon || 'pi pi-sort'
}

// 获取排序标签
const getSortLabel = (sortValue: string) => {
    const sortOption = props.sortOptions.find(option => option.value === sortValue)
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

.category-selector {
  min-width: 200px;
  max-width: 250px;
  transition: all 0.2s ease;
}

.category-selector:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .category-selector:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-controls,
.sort-controls {
    display: flex;
    background-color: rgb(243 244 246);
    border-radius: 0.5rem;
    padding: 0.25rem;
    gap: 0.125rem;
}

.dark .view-controls,
.dark .sort-controls {
    background-color: rgb(55 65 81);
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: rgb(107 114 128);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.view-btn:hover {
  background-color: rgba(59, 130, 246, 0.1);
  color: rgb(59 130 246);
}

.view-btn.active {
  background-color: rgb(59 130 246);
  color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.dark .view-btn {
  color: rgb(156 163 175);
}

.dark .view-btn:hover {
  background-color: rgba(99, 102, 241, 0.2);
  color: rgb(129 140 248);
}

.dark .view-btn.active {
  background-color: rgb(99 102 241);
  color: white;
}

/* 排序控件样式 */
.sort-controls {
  align-items: center;
}

.sort-selector {
  min-width: 120px;
}

.sort-order-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: rgb(107 114 128);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  margin-left: 0.25rem;
}

.sort-order-btn:hover {
  background-color: rgba(59, 130, 246, 0.1);
  color: rgb(59 130 246);
}

.sort-order-btn.ascending {
  background-color: rgba(34, 197, 94, 0.1);
  color: rgb(34 197 94);
}

.sort-reset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: rgb(107 114 128);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  margin-left: 0.25rem;
}

.sort-reset-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: rgb(239 68 68);
}

.dark .sort-order-btn {
  color: rgb(156 163 175);
}

.dark .sort-order-btn:hover {
  background-color: rgba(99, 102, 241, 0.2);
  color: rgb(129 140 248);
}

.dark .sort-order-btn.ascending {
  background-color: rgba(34, 197, 94, 0.2);
  color: rgb(74 222 128);
}

.dark .sort-reset-btn {
  color: rgb(156 163 175);
}

.dark .sort-reset-btn:hover {
  background-color: rgba(239, 68, 68, 0.2);
  color: rgb(248 113 113);
}

.add-item-btn {
  transition: all 0.2s ease;
}

.add-item-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 添加项目下拉菜单 */
.add-item-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu-tiered {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 9999;
  margin-top: 0.5rem;
  /* 确保不超出右边界 */
  transform: translateX(0);
}

/* 在小屏幕上调整位置 */
@media (max-width: 640px) {
  .dropdown-menu-tiered {
    right: auto;
    left: 0;
    transform: translateX(-50%);
  }
}

/* TieredMenu 样式定制 */
:deep(.dropdown-menu-tiered .p-tieredmenu) {
  min-width: 160px;
  max-width: 250px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

:deep(.dark .dropdown-menu-tiered .p-tieredmenu) {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.3),
    0 4px 6px -2px rgba(0, 0, 0, 0.1);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 9999;
  min-width: 160px;
  margin-top: 0.5rem;
  background-color: white;
  border: 1px solid rgb(229 231 235);
  border-radius: 8px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.dark .dropdown-menu {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.3),
    0 4px 6px -2px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: rgb(55 65 81);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.875rem;
}

.dropdown-item:hover {
  background-color: rgb(243 244 246);
  color: rgb(17 24 39);
}

.dropdown-item.test-item {
  background-color: rgba(59, 130, 246, 0.05);
  border-top: 1px solid rgba(59, 130, 246, 0.1);
}

.dropdown-item.test-item:hover {
  background-color: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
}

.dark .dropdown-item {
  color: rgb(229 231 235);
}

.dark .dropdown-item:hover {
  background-color: rgb(55 65 81);
  color: rgb(243 244 246);
}

.dark .dropdown-item.test-item {
  background-color: rgba(99, 102, 241, 0.05);
  border-top: 1px solid rgba(99, 102, 241, 0.1);
}

.dark .dropdown-item.test-item:hover {
  background-color: rgba(99, 102, 241, 0.1);
  color: rgb(129, 140, 248);
}

.dropdown-item i {
  font-size: 1rem;
  color: rgb(107 114 128);
}

.dropdown-item.test-item i {
  color: rgb(59, 130, 246);
}

.dark .dropdown-item i {
  color: rgb(156 163 175);
}

.dark .dropdown-item.test-item i {
  color: rgb(129, 140, 248);
}

.dropdown-divider {
  height: 1px;
  background-color: rgb(229 231 235);
  margin: 0.25rem 0;
}

.dark .dropdown-divider {
  background-color: rgb(75 85 99);
}
</style>
