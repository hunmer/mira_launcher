<template>
    <div class="toolbar">
        <div class="toolbar-left">
            <!-- 分组切换选择器 -->
            <FilterSelect :model-value="selectedCategory" :options="categories" option-label="label"
                option-value="value" placeholder="选择分组" :filter="true" :show-clear="true" class="category-selector"
                @update:model-value="$emit('category-change', $event)">
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
            <div class="add-item-dropdown" ref="addItemDropdownRef">
                <Button icon="pi pi-plus-circle" class="add-item-btn" size="small" variant="primary"
                    @click="toggleAddItemDropdown" title="添加新项目" />
                <div v-if="showAddItemDropdown" class="dropdown-menu">
                    <div class="dropdown-item" @click="$emit('add-file')">
                        <i class="pi pi-file" />
                        <span>添加文件</span>
                    </div>
                    <div class="dropdown-item" @click="$emit('add-folder')">
                        <i class="pi pi-folder" />
                        <span>添加文件夹</span>
                    </div>
                    <div class="dropdown-item" @click="$emit('add-url')">
                        <i class="pi pi-link" />
                        <span>添加网址</span>
                    </div>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item test-item" @click="$emit('add-test-data')">
                        <i class="pi pi-bolt" />
                        <span>测试添加</span>
                    </div>
                </div>
            </div>

            <!-- 视图切换 -->
            <div class="view-controls">
                <button :class="['view-btn', { active: layoutMode === 'grid' }]" @click="$emit('layout-change', 'grid')"
                    title="网格视图">
                    <i class="pi pi-th-large" />
                </button>
                <button :class="['view-btn', { active: layoutMode === 'list' }]" @click="$emit('layout-change', 'list')"
                    title="列表视图">
                    <i class="pi pi-list" />
                </button>
            </div>

            <!-- 图标大小控制 - 仅在网格模式下显示 -->
            <div v-if="layoutMode === 'grid'" class="size-controls">
                <IconSizeDropdown :model-value="gridColumns" :container-width="containerWidth"
                    @update:model-value="$emit('grid-size-change', $event)" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import FilterSelect from '@/components/common/FilterSelect.vue'
import IconSizeDropdown from '@/components/common/IconSizeDropdown.vue'
import { onMounted, onUnmounted, ref } from 'vue'

interface Category {
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
}

interface Emits {
    (e: 'category-change', category: string): void
    (e: 'add-file'): void
    (e: 'add-folder'): void
    (e: 'add-url'): void
    (e: 'add-test-data'): void
    (e: 'layout-change', mode: 'grid' | 'list'): void
    (e: 'grid-size-change', size: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 下拉菜单状态
const showAddItemDropdown = ref(false)
const addItemDropdownRef = ref<HTMLElement>()

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
    if (addItemDropdownRef.value && !addItemDropdownRef.value.contains(event.target as Node)) {
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
.size-controls {
    display: flex;
    background-color: rgb(243 244 246);
    border-radius: 0.5rem;
    padding: 0.25rem;
    gap: 0.125rem;
}

.dark .view-controls,
.dark .size-controls {
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
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.dark .dropdown-menu {
    background-color: rgb(31 41 55);
    border-color: rgb(75 85 99);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
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
