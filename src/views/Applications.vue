<!-- eslint-disable vue/html-closing-bracket-newline -->
<!-- eslint-disable vue/max-attributes-per-line -->
<!-- eslint-disable vue/html-indent -->
<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <div class="applications-page">
    <!-- 工具栏 -->
    <ApplicationToolbar
      :selected-category="applicationsStore.selectedCategory"
      :categories="applicationsStore.categories"
      :layout-mode="layoutMode"
      :current-sort-type="applicationsStore.currentSortType"
      :sort-ascending="applicationsStore.sortAscending"
      :sort-options="applicationsStore.sortOptions"
      @category-change="applicationsStore.setCategory"
      @add-file="openAddDialog('file')"
      @add-folder="openAddDialog('folder')"
      @add-url="openAddDialog('url')"
      @add-test-data="addTestData"
      @layout-change="setLayoutMode"
      @sort-change="applicationsStore.setSortType"
      @sort-order-toggle="applicationsStore.toggleSortOrder"
    />

    <div class="page-container">
      <!-- 页面内容区域 -->
      <div class="pages-wrapper">
        <!-- GridStack 组件 -->
        <ApplicationGridStack
          v-model:applications="currentPageApps"
          :layout-mode="layoutMode"
          :grid-columns="applicationsStore.gridColumns"
          :icon-size="iconSize"
          @launch-app="launchApp"
          @app-context-menu="showContextMenu"
          @blank-context-menu="showBlankAreaContextMenu"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
          @drag-change="onDragChange"
        />
      </div>

      <!-- 页面控制栏 -->
      <PageControls
        :current-page-index="applicationsStore.currentPageIndex"
        :total-pages="applicationsStore.totalPages"
        @page-change="applicationsStore.goToPage"
        @add-page="applicationsStore.addPage"
      />
    </div>

    <!-- 添加应用对话框 -->
    <AddApplicationDialog
      v-model:show="showAddDialog"
      :type="addDialogType"
      :categories="applicationsStore.categories"
      @confirm="onAddApplication"
      @cancel="showAddDialog = false"
    />

    <!-- Context Menu -->
    <ContextMenu
      :show="contextMenuVisible"
      :x="contextMenuPosition.x"
      :y="contextMenuPosition.y"
      :items="contextMenuItems"
      @update:show="contextMenuVisible = $event"
      @select="onContextMenuSelect"
    />

    <!-- Blank Area Context Menu -->
    <ContextMenu
      :show="blankAreaContextMenuVisible"
      :x="blankAreaContextMenuPosition.x"
      :y="blankAreaContextMenuPosition.y"
      :items="blankAreaContextMenuItems"
      @update:show="blankAreaContextMenuVisible = $event"
      @select="onBlankAreaContextMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
import AddApplicationDialog from '@/components/business/AddApplicationDialog.vue'
import ApplicationGridStack from '@/components/business/ApplicationGridStack.vue'
import ApplicationToolbar from '@/components/business/ApplicationToolbar.vue'
import PageControls from '@/components/business/PageControls.vue'
import ContextMenu, { type MenuItem } from '@/components/common/ContextMenu.vue'
import { useApplicationLayout } from '@/composables/useApplicationLayout'
import { useApplicationsStore, type Application } from '@/stores/applications'
import { computed, onMounted, onUnmounted, ref } from 'vue'

// 拖拽事件类型定义
interface DragEventData {
    element?: HTMLElement
    event?: Event
    items?: unknown[]
    oldIndex?: number
    newIndex?: number
    item?: HTMLElement
    moved?: {
        element: Application
        oldIndex: number
        newIndex: number
    }
    added?: {
        element: Application
        newIndex: number
    }
    removed?: {
        element: Application
        oldIndex: number
    }
}

// Store
const applicationsStore = useApplicationsStore()

// 图标尺寸配置和布局
const { setLayoutMode, layoutMode } = useApplicationLayout()

const isDragging = ref(false) // 拖拽状态
const sortSaved = ref(false) // 排序保存状态

// 添加应用对话框
const showAddDialog = ref(false)
const addDialogType = ref<'file' | 'folder' | 'url'>('file')

// 图标大小计算
const iconSize = computed(() => {
    // 根据网格列数动态计算图标大小，使用固定基础值
    const baseWidth = 1200 // 使用固定的基础宽度
    const baseSize = Math.max(
        40,
        Math.min(200, (baseWidth / applicationsStore.gridColumns) * 0.6),
    )
    return Math.floor(baseSize)
})

// 当前页面的应用（双向绑定）
const currentPageApps = computed({
    get: () => {
        return applicationsStore.currentPageApps
    },
    set: value => {
        // 统一在这里处理应用更新和保存
        applicationsStore.updateCurrentPageApps(value)
        // 立即保存应用数据
        applicationsStore.saveApplications()
    },
})

// 右键菜单
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const selectedApp = ref<Application | null>(null)

// 空白区域右键菜单
const blankAreaContextMenuVisible = ref(false)
const blankAreaContextMenuPosition = ref({ x: 0, y: 0 })

// 空白区域右键菜单项目
const blankAreaContextMenuItems = computed((): MenuItem[] => [
    {
        label: '添加新项目',
        icon: 'pi pi-plus',
        action: () => {
            openAddDialog('file')
        },
    },
    {
        label: '',
        separator: true,
    },
    {
        label: '删除当前页面',
        icon: 'pi pi-trash',
        danger: true,
        action: () => {
            if (applicationsStore.totalPages > 1) {
                applicationsStore.removePage()
            }
        },
    },
])

// 右键菜单项目
const contextMenuItems = computed((): MenuItem[] => [
    {
        label: '启动应用',
        icon: 'pi pi-play',
        action: () => {
            if (selectedApp.value) launchApp(selectedApp.value)
        },
    },
    {
        label: selectedApp.value?.pinned ? '取消固定' : '固定到快速访问',
        icon: 'pi pi-thumbtack',
        action: () => {
            if (selectedApp.value) {
                applicationsStore.togglePin(selectedApp.value.id)
            }
        },
    },
    {
        label: '',
        separator: true,
    },
    {
        label: '编辑',
        icon: 'pi pi-pencil',
        action: () => {
            if (selectedApp.value) editApp(selectedApp.value)
        },
    },
    {
        label: '移除',
        icon: 'pi pi-trash',
        danger: true,
        action: () => {
            if (selectedApp.value) removeApp(selectedApp.value)
        },
    },
])

// 方法
const launchApp = async (app: Application) => {
    applicationsStore.updateLastUsed(app.id)
    console.log('启动应用:', app.name)
    // await invoke('launch_application', { path: app.path })
}

// 拖拽事件处理
const onDragStart = (_evt: DragEventData) => {
    console.log('🟢 Applications - 开始拖拽')
    isDragging.value = true
    sortSaved.value = false
}

const onDragEnd = (_evt: DragEventData) => {
    console.log('🔴 Applications - 拖拽结束')
    isDragging.value = false
    // 显示保存成功提示
    sortSaved.value = true
    setTimeout(() => {
        sortSaved.value = false
    }, 2000)
}

const onDragChange = (evt: DragEventData) => {
    console.log('🔧 Applications - 拖拽变化:', evt)
    if (evt.moved) {
        console.log(
            `🔀 应用移动: "${evt.moved.element.name}" 从位置 ${evt.moved.oldIndex} 移动到 ${evt.moved.newIndex}`,
        )
    }
    if (evt.added) {
        console.log('➕ 添加了应用:', evt.added)
    }
    if (evt.removed) {
        console.log('➖ 移除了应用:', evt.removed)
    }
}

// 添加应用相关方法
const openAddDialog = (type: 'file' | 'folder' | 'url') => {
    addDialogType.value = type
    showAddDialog.value = true
}

const onAddApplication = (
    app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>,
) => {
    applicationsStore.addApplication(app)
    showAddDialog.value = false
    console.log('添加应用:', app)
}

const addTestData = () => {
    applicationsStore.generateTestApplications(5)
    console.log('添加测试数据')
}

const showContextMenu = (app: Application, event: MouseEvent) => {
    selectedApp.value = app
    contextMenuPosition.value = { x: event.clientX, y: event.clientY }
    contextMenuVisible.value = true
}

const hideContextMenu = () => {
    selectedApp.value = null
    contextMenuVisible.value = false
}

const onContextMenuSelect = (item: MenuItem) => {
    item.action?.()
    hideContextMenu()
}

const editApp = (app: Application) => {
    console.log(`编辑应用: ${app.name}`)
    hideContextMenu()
}

const removeApp = (app: Application) => {
    if (confirm(`确定要移除 "${app.name}" 吗？`)) {
        applicationsStore.removeApplication(app.id)
    }
    hideContextMenu()
}

// 空白区域右键菜单
const showBlankAreaContextMenu = (event: MouseEvent) => {
    blankAreaContextMenuPosition.value = { x: event.clientX, y: event.clientY }
    blankAreaContextMenuVisible.value = true
}

const hideBlankAreaContextMenu = () => {
    blankAreaContextMenuVisible.value = false
}

const onBlankAreaContextMenuSelect = (item: MenuItem) => {
    item.action?.()
    hideBlankAreaContextMenu()
}

const handleClickOutside = () => {
    hideContextMenu()
    hideBlankAreaContextMenu()
}

onMounted(() => {
    document.title = 'Mira Launcher - 应用程序'

    // 加载数据
    applicationsStore.loadApplications()
    applicationsStore.loadPageSettings()

    document.addEventListener('click', handleClickOutside)

    // 阻止右键菜单的默认行为
    document.addEventListener('contextmenu', e => {
        const target = e.target as HTMLElement
        // 只在不是菜单组件和特定可右键元素时阻止默认行为
        if (!target?.closest?.('.p-tieredmenu, .context-menu, .dropdown-menu')) {
            e.preventDefault()
        }
    })
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('contextmenu', e => {
        const target = e.target as HTMLElement
        // 只在不是菜单组件和特定可右键元素时阻止默认行为
        if (!target?.closest?.('.p-tieredmenu, .context-menu, .dropdown-menu')) {
            e.preventDefault()
        }
    })
})
</script>

<style scoped>
.applications-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: rgb(249 250 251);
  user-select: none;
}

.dark .applications-page {
  background-color: rgb(17 24 39);
}

.page-container {
  flex: 1;
  overflow: hidden;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.pages-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 响应式布局优化 */
@media (max-width: 800px) {
  .page-container {
    padding: 0.5rem;
  }
}

/* PrimeVue ContextMenu 深色主题定制 */
:global(.p-contextmenu) {
  background-color: #1f2937 !important;
  border: 1px solid #4b5563 !important;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
}

:global(.p-contextmenu .p-menuitem) {
  transition: all 0.15s ease-out;
}

:global(.p-contextmenu .p-menuitem-link) {
  color: #e5e7eb !important;
  padding: 0.75rem 1rem !important;
}

:global(.p-contextmenu .p-menuitem-link:hover) {
  background-color: #374151 !important;
}

:global(.p-contextmenu .p-menuitem-link.text-red-500) {
  color: #f87171 !important;
}

:global(.p-contextmenu .p-menuitem-link.text-red-500:hover) {
  background-color: rgba(127, 29, 29, 0.2) !important;
}

:global(.p-contextmenu .p-menuitem-icon) {
  color: #9ca3af !important;
  margin-right: 0.75rem !important;
}

:global(.p-contextmenu .p-separator) {
  background-color: #4b5563 !important;
}
</style>
