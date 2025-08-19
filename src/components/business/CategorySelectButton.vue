	<template>
  <div class="category-selectbutton-container">
    <SelectButton
      :model-value="selectedCategory"
      :options="categories"
      option-label="label"
      option-value="value"
      class="category-selectbutton"
      @update:model-value="$emit('category-change', $event)"
    >
      <template #option="{ option }">
        <div class="flex items-center justify-center">
          <i :class="option.icon" />
        </div>
      </template>
    </SelectButton>

    <div :class="['controls-container', { 'search-expanded': isSearchExpanded }]">
      <!-- 添加按钮 -->
      <div v-show="!isSearchExpanded" class="add-controls">
        <Button
          icon="pi pi-plus-circle"
          class="add-btn"
          size="small"
          variant="primary"
          title="添加新项目"
          @click="toggleAddMenu"
        />
        <ContextMenu
          :show="showAddMenu"
          :x="addMenuPosition.x"
          :y="addMenuPosition.y"
          :items="addMenuContextItems"
          @update:show="showAddMenu = $event"
          @select="onAddMenuSelect"
        />
      </div>

      <!-- 排序控制 -->
      <div v-show="!isSearchExpanded" class="sort-controls">
        <FilterSelect
          :model-value="currentSortType"
          :options="sortOptions || []"
          option-label="label"
          option-value="value"
          placeholder="排序方式"
          size="small"
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
          @click="$emit('sort-reset')"
        />
      </div>

      <!-- 搜索控制 -->
      <div class="search-container">
        <div :class="['search-wrapper', { expanded: isSearchExpanded }]">
          <Button
            v-if="!isSearchExpanded"
            icon="pi pi-search"
            class="search-toggle-btn"
            size="small"
            variant="outlined"
            @click="expandSearch"
          />
          <div v-else class="search-input-wrapper">
            <IconField icon-position="left">
              <InputIcon class="pi pi-search" />
              <InputText
                ref="searchInput"
                v-model="searchQuery"
                placeholder="搜索应用..."
                class="search-input"
                @blur="onSearchBlur"
                @keyup.escape="collapseSearch"
              />
            </IconField>
            <Button
              v-if="isSearchExpanded"
              icon="pi pi-times"
              class="search-clear-btn"
              size="small"
              variant="text"
              @click="clearSearch"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import ContextMenu, { type MenuItem } from '@/components/common/ContextMenu.vue'
import FilterSelect from '@/components/common/FilterSelect.vue'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

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

interface AddMenuItem {
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
  searchQuery: string
  addMenuItems?: AddMenuItem[]
  currentSortType?: string
  sortAscending?: boolean
  sortOptions?: SortOption[]
}

interface Emits {
  (e: 'category-change', category: string): void
  (e: 'search-change', query: string): void
  (e: 'search-clear'): void
  (e: 'add-entry', entryId?: string): void
  (e: 'add-test-data'): void
  (e: 'sort-change', sortType: string): void
  (e: 'sort-order-toggle'): void
  (e: 'sort-reset'): void
}

const props = withDefaults(defineProps<Props>(), {
  addMenuItems: () => [],
  currentSortType: '',
  sortAscending: true,
  sortOptions: () => [],
})
const emit = defineEmits<Emits>()

const isSearchExpanded = ref(false)
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref(props.searchQuery)

// 添加菜单
const showAddMenu = ref(false)
const addMenuPosition = ref({ x: 0, y: 0 })

// 监听搜索查询变化
watch(searchQuery, (newQuery) => {
  emit('search-change', newQuery)
})

// 监听外部搜索查询变化
watch(() => props.searchQuery, (newQuery) => {
  searchQuery.value = newQuery
  if (newQuery) {
    isSearchExpanded.value = true
  }
})

// 添加菜单项
const addMenuContextItems = computed<MenuItem[]>(() => {
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

// 获取排序图标
const getSortIcon = (sortValue: string) => {
  const sortOption = props.sortOptions?.find((option: SortOption) => option.value === sortValue)
  return sortOption?.icon || 'pi pi-sort'
}

// 获取排序标签
const getSortLabel = (sortValue: string) => {
  const sortOption = props.sortOptions?.find((option: SortOption) => option.value === sortValue)
  return sortOption?.label || '排序'
}

const toggleAddMenu = (e: MouseEvent) => {
  if (!showAddMenu.value) {
    // 计算更精确的菜单位置
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const menuWidth = 200 // 估算菜单宽度
    
    // 如果右侧空间不足，则向左偏移
    let x = rect.right - menuWidth
    if (x < 10) {
      x = rect.left
    }
    
    addMenuPosition.value = { 
      x, 
      y: rect.bottom + 8,
    }
    showAddMenu.value = true
  } else {
    showAddMenu.value = false
  }
}

const onAddMenuSelect = (item: MenuItem) => {
  // 执行菜单项的action，增加错误处理
  try {
    item.action?.()
  } catch (error) {
    console.error('菜单操作执行失败:', error)
  }
  showAddMenu.value = false
}

const expandSearch = async () => {
  isSearchExpanded.value = true
  await nextTick()
  searchInput.value?.focus()
}

const collapseSearch = () => {
  if (!searchQuery.value) {
    isSearchExpanded.value = false
  }
}

const onSearchBlur = () => {
  // 延迟收起，避免点击清除按钮时立即收起
  setTimeout(() => {
    if (!searchQuery.value) {
      isSearchExpanded.value = false
    }
  }, 150)
}

const clearSearch = () => {
  searchQuery.value = ''
  emit('search-clear')
  isSearchExpanded.value = false
}

// 点击外部关闭
const handleGlobalClick = (e: MouseEvent) => {
  if (showAddMenu.value) {
    const target = e.target as HTMLElement
    if (!target.closest('.add-controls') && !target.closest('.p-tieredmenu')) {
      showAddMenu.value = false
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
.category-selectbutton-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  flex-wrap: wrap;
}

.category-selectbutton {
  flex: 1;
  min-width: 0;
}

.controls-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

/* 搜索展开时的容器样式 */
.controls-container.search-expanded {
  justify-content: flex-end;
  gap: 0.5rem;
}

/* 搜索展开时隐藏其他元素的动画 */
.controls-container.search-expanded .add-controls,
.controls-container.search-expanded .sort-controls {
  opacity: 0;
  visibility: hidden;
  width: 0;
  margin: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.add-controls {
  position: relative;
  display: inline-block;
}

.add-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-container {
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
}

.search-wrapper {
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.search-wrapper.expanded {
  width: 200px;
  z-index: 10;
}

.search-wrapper:not(.expanded) {
  width: auto;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.search-wrapper {
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.search-wrapper.expanded {
  width: 250px;
}

.search-toggle-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  height: 2.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(209 213 219);
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .search-input {
  border-color: rgb(75 85 99);
  background-color: rgb(31 41 55);
  color: rgb(229 231 235);
}

.dark .search-input:focus {
  border-color: rgb(99 102 241);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-clear-btn {
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .category-selectbutton-container {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .controls-container {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .search-wrapper.expanded {
    width: 100%;
  }
  
  :deep(.category-selectbutton .p-selectbutton) {
    justify-content: center;
  }
  
  :deep(.category-selectbutton .p-togglebutton) {
    min-width: 2rem;
    height: 2rem;
    padding: 0.375rem;
  }
}

@media (max-width: 640px) {
  :deep(.category-selectbutton .p-togglebutton) {
    min-width: 1.75rem;
    height: 1.75rem;
    padding: 0.25rem;
    font-size: 0.75rem;
  }
}
</style>
