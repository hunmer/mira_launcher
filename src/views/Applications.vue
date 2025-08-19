<!-- eslint-disable vue/html-closing-bracket-newline -->
<!-- eslint-disable vue/max-attributes-per-line -->
<!-- eslint-disable vue/html-indent -->
<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <div class="applications-page">
    <div class="page-container">
      <!-- 分类选择和搜索栏 -->
      <div class="category-search-bar">
        <CategorySelectButton
          :selected-category="applicationsStore.selectedCategory"
          :categories="applicationsStore.dynamicCategories"
          :search-query="applicationsStore.searchQuery"
          :add-menu-items="addMenuItems"
          :current-sort-type="applicationsStore.currentSortType"
          :sort-ascending="applicationsStore.sortAscending"
          :sort-options="applicationsStore.sortOptions"
          @category-change="applicationsStore.setCategory"
          @search-change="applicationsStore.setSearchQuery"
          @search-clear="applicationsStore.clearSearch"
          @add-entry="handleAddEntry"
          @add-test-data="addTestData"
          @sort-change="applicationsStore.setSortType"
          @sort-order-toggle="applicationsStore.toggleSortOrder"
          @sort-reset="applicationsStore.clearCurrentPageGridPositions"
        />
      </div>

      <!-- 页面内容区域 -->
      <div class="pages-wrapper">
        <!-- 页面头部 - 面包屑和视图选项 -->
        <div class="page-header">
          <!-- 左侧面包屑 -->
          <div class="breadcrumb-container">
            <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" />
          </div>
          
          <!-- 右侧视图选项 -->
          <div class="view-options">
            <div class="view-controls">
              <i 
                :class="['pi pi-th-large', { active: layoutMode === 'grid' }]"
                title="网格视图"
                @click="setLayoutMode('grid')"
              />
              <i 
                :class="['pi pi-list', { active: layoutMode === 'list' }]"
                title="列表视图"
                @click="setLayoutMode('list')"
              />
            </div>
          </div>
        </div>
        <!-- GridStack 组件 -->
        <ApplicationGridStack
          v-model:applications="currentPageApps"
          :layout-mode="layoutMode"
          :grid-columns="applicationsStore.gridColumns"
          :icon-size="iconSize"
          :sort-type="applicationsStore.currentSortType"
          :add-menu-items="addMenuItems"
          @launch-app="launchApp"
          @app-context-menu="showContextMenu"
          @blank-context-menu="showBlankAreaContextMenu"
          @request-add-menu="showAddMenuAt"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
          @drag-change="onDragChange"
          @update-positions="onUpdatePositions"
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
      :categories="applicationsStore.categories"
        :form-defaults="currentFormDefaults"
        :entry-label="currentEntryLabel"
        :entry-icon="currentEntryIcon"
        :fields="currentEntryFields"
    :app="editingApp"
      @confirm="onAddApplication"
    @update="onUpdateApplication"
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
        <!-- Add Menu (placeholder & external trigger) -->
        <ContextMenu
            :show="addMenuVisible"
            :x="addMenuPosition.x"
            :y="addMenuPosition.y"
            :items="addMenuContextItems"
            @update:show="addMenuVisible = $event"
            @select="(item) => { item.action?.(); addMenuVisible = false }"
        />
            <ConfirmDialog
                v-model:show="showDeleteDialog"
                :title="deleteDialogTitle"
                :message="deleteDialogMessage"
                confirm-label="删除"
                cancel-label="取消"
                :danger="true"
                @confirm="confirmDelete"
            />
  </div>
</template>

<script setup lang="ts">
import AddApplicationDialog from '@/components/business/AddApplicationDialog.vue'
import ApplicationGridStack from '@/components/business/ApplicationGridStack.vue'
import CategorySelectButton from '@/components/business/CategorySelectButton.vue'
import PageControls from '@/components/business/PageControls.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ContextMenu, { type MenuItem } from '@/components/common/ContextMenu.vue'
import { useApplicationLayout } from '@/composables/useApplicationLayout'
import { useAddEntriesStore, type FieldDefinition } from '@/stores/addEntries'
import { useApplicationsStore, type Application } from '@/stores/applications'
import Breadcrumb from 'primevue/breadcrumb'
import { useToast } from 'primevue/usetoast'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

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
const addEntriesStore = useAddEntriesStore()
const toast = useToast()

// 图标尺寸配置和布局
const { setLayoutMode, layoutMode } = useApplicationLayout()

const isDragging = ref(false) // 拖拽状态
const sortSaved = ref(false) // 排序保存状态
const launchingApps = ref(new Set<string>()) // 启动中的应用ID集合

// 面包屑数据
const breadcrumbHome = ref({
    icon: 'pi pi-home',
})
const breadcrumbItems = ref([
    { label: '应用程序' },
    { label: '分类管理' },
    { label: '视图管理' },
])

// 添加应用对话框
const showAddDialog = ref(false)
const currentFormDefaults = ref<Partial<{ name: string; path: string; category: string; description: string; icon: string }>>({})
const editingApp = ref<Application | null>(null)
// 来自插件注册的UI元数据
const currentEntryLabel = ref<string>('')
const currentEntryIcon = ref<string>('')
const currentEntryFields = ref<Record<string, FieldDefinition> | undefined>(undefined)
const currentAppType = ref<string>('')

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

// 动态添加入口（插件可注册）
type AddMenuItem = { label: string; icon: string; type: 'app'|'test'|'custom'; id: string; handler?: (() => void | Promise<void>) | undefined }
const addMenuItems = computed((): AddMenuItem[] => addEntriesStore.entries
    .filter(e => ['app','test','custom'].includes(e.type))
    .map(e => ({ label: e.label, icon: e.icon, type: e.type as AddMenuItem['type'], id: e.id, handler: e.handler ?? undefined })))

// 由父级控制的添加菜单（用于占位符点击）
const addMenuVisible = ref(false)
const addMenuPosition = ref({ x: 0, y: 0 })
const addMenuContextItems = computed<MenuItem[]>(() => {
    return addMenuItems.value.flatMap(item => {
    if (item.type === 'test') {
            const sep: MenuItem = { label: '', separator: true }
            return [sep, { label: item.label, icon: item.icon, action: () => addTestData() }]
        }
        if (item.type === 'custom') {
            return [{ label: item.label, icon: item.icon, action: () => item.handler?.() }]
        }
        if (item.handler) {
            return [{ label: item.label, icon: item.icon, action: () => item.handler?.() }]
        }
            return [{ label: item.label, icon: item.icon, action: () => {
                const found = addEntriesStore.entries.find(e => e.id === item.id)
                currentFormDefaults.value = found?.formDefaults || {}
                currentEntryLabel.value = found?.label || ''
                currentEntryIcon.value = found?.icon || ''
                currentEntryFields.value = found?.fields
                currentAppType.value = found?.appType || found?.id || ''
        openAddDialog()
            } }]
    })
})

const showAddMenuAt = (pos: { x: number; y: number }) => {
    addMenuPosition.value = pos
    addMenuVisible.value = true
}

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
            openAddDialog()
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
    // 检查是否正在启动
    if (launchingApps.value.has(app.id)) {
        toast.add({
            severity: 'warn',
            summary: '启动中',
            detail: `应用 ${app.name} 正在启动中，请稍候...`,
            life: 3000,
        })
        return
    }
    
    // 标记为启动中
    launchingApps.value.add(app.id)
    
    try {
        // 仅在当前排序为按最后使用时间时更新 lastUsed 以触发重新排序
        if (applicationsStore.currentSortType === 'lastUsed') {
            applicationsStore.updateLastUsed(app.id)
        }
        
        // 插件自定义 exec
        if (app.appType) {
            const entry = addEntriesStore.entries.find(e => (e.appType || e.id) === app.appType)
            if (entry?.exec) {
                const ok = await entry.exec({ fields: app.dynamicFields || {}, appId: app.id })
                if (ok) {
                    console.log('[Exec] 插件执行成功', app.appType, app.name)
                    // toast.add({
                    //     severity: 'success',
                    //     summary: '启动成功',
                    //     detail: `应用 ${app.name} 已成功启动`,
                    //     life: 3000,
                    // })
                    return
                } else {
                    // 插件执行返回false，尝试回退
                    throw new Error('插件执行返回false')
                }
            }
        }
    } catch (error) {
        console.error('[Launch] 应用启动失败', error)
        toast.add({
            severity: 'error',
            summary: '启动失败',
            detail: `应用 ${app.name} 启动失败: ${error instanceof Error ? error.message : '未知错误'}`,
            life: 5000,
        })
    } finally {
        // 移除启动中标记
        launchingApps.value.delete(app.id)
    }
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

// 处理GridStack位置更新
const onUpdatePositions = (positions: Array<{
    id: string
    position: { x: number; y: number; w: number; h: number }
}>) => {
    console.log('📍 Applications - 更新应用位置:', positions)
    // 使用静默保存，不触发UI刷新
    applicationsStore.updateGridPositions(positions, true)
}

// 添加应用相关方法
const openAddDialog = (defaults?: Partial<{ name: string; path: string; category: string; description: string; icon: string }>) => {
    editingApp.value = null
    // 只有在没有通过handleAddEntry设置数据时才使用传入的defaults
    if (defaults && Object.keys(currentFormDefaults.value).length === 0) {
        currentFormDefaults.value = defaults
    }
    if (!currentEntryFields.value) currentEntryFields.value = undefined
    if (!currentAppType.value) currentAppType.value = ''
    if (!currentEntryLabel.value) currentEntryLabel.value = '添加项目'
    showAddDialog.value = true
}

const handleAddEntry = (entryId?: string) => {
    // 如果指定了entryId，查找对应的插件入口并设置相关数据
    if (entryId) {
        const found = addEntriesStore.entries.find(e => e.id === entryId)
        if (found) {
            currentFormDefaults.value = found.formDefaults || {}
            currentEntryLabel.value = found.label || ''
            currentEntryIcon.value = found.icon || ''
            currentEntryFields.value = found.fields
            currentAppType.value = found.appType || found.id || ''
            console.log('[Applications] Setting plugin entry data:', {
                entryId,
                formDefaults: currentFormDefaults.value,
                entryLabel: currentEntryLabel.value,
                fields: currentEntryFields.value,
                appType: currentAppType.value,
            })
        } else {
            console.warn('[Applications] Entry not found:', entryId)
        }
    } else {
        // 重置为默认值
        currentFormDefaults.value = {}
        currentEntryLabel.value = '添加项目'
        currentEntryIcon.value = ''
        currentEntryFields.value = undefined
        currentAppType.value = ''
    }
    
    openAddDialog()
}

const onAddApplication = (
    app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>,
) => {
    const withType = { ...app, appType: (currentAppType.value || undefined) }
    applicationsStore.addApplication(withType as Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>)
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
    editingApp.value = app
    showAddDialog.value = true
    hideContextMenu()
}

// 删除确认
const showDeleteDialog = ref(false)
const deleteTarget = ref<Application | null>(null)
const deleteDialogTitle = '删除应用'
const deleteDialogMessage = computed(() => deleteTarget.value ? `确定要删除 "${deleteTarget.value.name}" 吗？该操作不可撤销。` : '')
const removeApp = (app: Application) => {
    deleteTarget.value = app
    showDeleteDialog.value = true
    hideContextMenu()
}
const confirmDelete = () => {
    if (deleteTarget.value) {
        console.log('🗑️ 删除应用:', deleteTarget.value.name)
        applicationsStore.removeApplication(deleteTarget.value.id)
        // 确保删除后触发重新渲染和占位符补充
        nextTick(() => {
            // 强制触发应用列表更新，确保占位符正确生成
            console.log('🔄 应用删除后强制刷新，当前页应用数量:', applicationsStore.currentPageApps.length)
        })
    }
    deleteTarget.value = null
}

const onUpdateApplication = (payload: { id: string; updates: Partial<Application> }) => {
    applicationsStore.updateApplication(payload.id, payload.updates)
    showAddDialog.value = false
    editingApp.value = null
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
    // 监听来自插件的应用添加事件
    window.addEventListener('mira:add-app', onExternalAddApp as EventListener)
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
        window.removeEventListener('mira:add-app', onExternalAddApp as EventListener)
})

// 外部(插件)触发添加应用
interface ExternalAddAppDetail { name: string; path: string; type?: string; category?: string }
const onExternalAddApp = (evt: Event) => {
    const detail = (evt as CustomEvent<ExternalAddAppDetail>).detail
    if (!detail || !detail.name || !detail.path) return
        const mappedType: Application['type'] = (['file','folder','url','app'].includes(detail.type || '') ? detail.type : 'file') as Application['type']
        applicationsStore.addApplication({ name: detail.name, path: detail.path, category: detail.category || 'files', type: mappedType, isSystem: false, pinned: false })
    console.log('[ExternalAdd] 添加应用', detail)
}
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

.category-search-bar {
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 0.75rem;
  border: 1px solid rgb(229 231 235);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.dark .category-search-bar {
  background-color: rgba(31, 41, 55, 0.8);
  border-color: rgb(75 85 99);
}

.pages-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;   
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark .page-header {
  background-color: rgba(31, 41, 55, 0.8);
  border-color: rgb(75 85 99);
}

.breadcrumb-container {
  flex: 1;
}

.p-breadcrumb.p-component {
    background-color: unset;;

}


.view-options {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.view-controls i {
  font-size: 1.25rem;
  color: rgb(107 114 128);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.view-controls i:hover {
  color: rgb(59 130 246);
  background-color: rgba(59, 130, 246, 0.1);
}

.view-controls i.active {
  color: rgb(59 130 246);
  background-color: rgba(59, 130, 246, 0.15);
  font-weight: 600;
}

.dark .view-controls i {
  color: rgb(156 163 175);
}

.dark .view-controls i:hover {
  color: rgb(99 102 241);
  background-color: rgba(99, 102, 241, 0.1);
}

.dark .view-controls i.active {
  color: rgb(99 102 241);
  background-color: rgba(99, 102, 241, 0.15);
}

/* 响应式布局优化 */
@media (max-width: 800px) {
  .page-container {
    padding: 0.5rem;
  }
}
</style>
