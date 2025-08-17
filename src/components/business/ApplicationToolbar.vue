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
            <!-- 添加新项目下拉菜单 -->
            <div ref="addItemDropdownRef" class="add-item-dropdown">
                <Button
                    icon="pi pi-plus-circle"
                    class="add-item-btn"
                    size="small"
                    variant="primary"
                    title="添加新项目"
                    @click="toggleAddItemDropdown"
                />
                <TieredMenu
                    v-if="showAddItemDropdown"
                    ref="addItemMenu"
                    :model="addItemMenuItems"
                    :popup="false"
                    class="dropdown-menu-tiered"
                    @hide="showAddItemDropdown = false"
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
                <button
                    :class="['sort-order-btn', { ascending: sortAscending }]"
                    :title="sortAscending ? '升序' : '降序'"
                    @click="$emit('sort-order-toggle')"
                >
                    <i :class="sortAscending ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down-alt'" />
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

            <!-- 图标大小控制 - 仅在网格模式下显示 -->
            <div v-if="layoutMode === 'grid'" class="size-controls">
                <IconSizeDropdown
                    :model-value="gridColumns"
                    :container-width="containerWidth"
                    @update:model-value="$emit('grid-size-change', $event)"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import FilterSelect from '@/components/common/FilterSelect.vue'
import IconSizeDropdown from '@/components/common/IconSizeDropdown.vue'
import TieredMenu from 'primevue/tieredmenu'
import { computed, onMounted, onUnmounted, ref } from 'vue'

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

interface Props {
    selectedCategory: string
    categories: Category[]
    layoutMode: 'grid' | 'list'
    gridColumns: string
    containerWidth: number
    currentSortType: string
    sortAscending: boolean
    sortOptions: SortOption[]
}

interface Emits {
    (e: 'category-change', category: string): void
    (e: 'add-file'): void
    (e: 'add-folder'): void
    (e: 'add-url'): void
    (e: 'add-test-data'): void
    (e: 'layout-change', mode: 'grid' | 'list'): void
    (e: 'grid-size-change', size: string): void
    (e: 'sort-change', sortType: string): void
    (e: 'sort-order-toggle'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 下拉菜单状态
const showAddItemDropdown = ref(false)
const addItemDropdownRef = ref<HTMLElement>()
const addItemMenu = ref()

// TieredMenu菜单项配置
const addItemMenuItems = computed(() => [
    {
        label: '添加文件',
        icon: 'pi pi-file',
        command: () => {
            emit('add-file')
            showAddItemDropdown.value = false
        },
    },
    {
        label: '添加文件夹',
        icon: 'pi pi-folder',
        command: () => {
            emit('add-folder')
            showAddItemDropdown.value = false
        },
    },
    {
        label: '添加网址',
        icon: 'pi pi-link',
        command: () => {
            emit('add-url')
            showAddItemDropdown.value = false
        },
    },
    {
        separator: true,
    },
    {
        label: '测试添加',
        icon: 'pi pi-bolt',
        command: () => {
            emit('add-test-data')
            showAddItemDropdown.value = false
        },
    },
])

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

// 切换下拉菜单
const toggleAddItemDropdown = () => {
    showAddItemDropdown.value = !showAddItemDropdown.value
}

// 关闭下拉菜单
const closeAddItemDropdown = () => {
    showAddItemDropdown.value = false
}

// 处理点击外部事件
const handleClickOutside = (event: Event) => {
    if (
        addItemDropdownRef.value &&
        !addItemDropdownRef.value.contains(event.target as Node)
    ) {
        closeAddItemDropdown()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
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
.size-controls,
.sort-controls {
  display: flex;
  background-color: rgb(243 244 246);
  border-radius: 0.5rem;
  padding: 0.25rem;
  gap: 0.125rem;
}

.dark .view-controls,
.dark .size-controls,
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
