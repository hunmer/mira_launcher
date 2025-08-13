<template>
  <div class="applications-page">
    <!-- 拖拽状态提示 -->
    <div
      v-if="isDragging"
      class="drag-hint"
    >
      <span class="text-sm text-blue-400">🔄 正在拖拽中...</span>
    </div>

    <div class="page-container">
      <VueDraggable
        v-model="applications"
        animation="200"
        :delay="100"
        :delay-on-touch-start="true"
        :force-fallback="false"
        :fallback-tolerance="3"
        class="app-grid"
        :style="{ 
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: '12px'
        }"
        item-key="id"
        ghost-class="ghost"
        chosen-class="chosen"
        drag-class="dragging"
        @start="onDragStart"
        @end="onDragEnd"
        @change="onDragChange"
      >
        <template #item="{ element: app }">
          <div 
            class="app-item-wrapper"
          >
            <div 
              class="app-item"
              @click="launchApp(app)"
              @contextmenu.prevent="showContextMenu(app, $event)"
            >
              <div class="app-icon">
                <img
                  v-if="app.icon"
                  :src="app.icon"
                  :alt="app.name"
                  :style="{
                    width: iconSize + 'px',
                    height: iconSize + 'px',
                    maxWidth: '200px',
                    maxHeight: '200px',
                  }"
                  class="object-contain"
                >
                <AppIcon
                  v-else
                  name="monitor"
                  :size="iconSize"
                  class="text-gray-400"
                />
              </div>
              <div class="app-label">
                {{ app.name }}
              </div>
            </div>
          </div>
        </template>
      </VueDraggable>
    </div>

    <!-- PrimeVue ContextMenu组件 -->
    <ContextMenu
      ref="contextMenu"
      :model="contextMenuItems"
      @hide="hideContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'
import { useApplicationLayout } from '@/composables/useApplicationLayout'
import ContextMenu from 'primevue/contextmenu'
import type { MenuItem } from 'primevue/menuitem'
import VueDraggable from 'vuedraggable'
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Application {
  id: string
  name: string
  path: string
  icon?: string
  category: string
  lastUsed?: Date
  pinned?: boolean
}

// 图标尺寸配置
const { getIconSizePixels } = useApplicationLayout()
const iconSize = computed(() => getIconSizePixels())
const gridColumns = ref(4) // 默认网格列数
const isDragging = ref(false) // 拖拽状态
const sortSaved = ref(false) // 排序保存状态

// 应用列表
const applications = ref<Application[]>([
  {
    id: 'chrome',
    name: 'Google Chrome',
    path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    icon: '/icons/chrome.svg',
    category: 'productivity',
    lastUsed: new Date(),
  },
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    path: 'C:\\Users\\Username\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
    icon: '/icons/vscode.svg',
    category: 'development',
    lastUsed: new Date(),
  },
  {
    id: 'notepad',
    name: '记事本',
    path: 'C:\\Windows\\System32\\notepad.exe',
    icon: '/icons/notepad.svg',
    category: 'utility',
  },
  {
    id: 'figma',
    name: 'Figma',
    path: 'path-to-figma',
    icon: '/icons/figma.svg',
    category: 'design',
  },
  {
    id: 'slack',
    name: 'Slack',
    path: 'path-to-slack',
    icon: '/icons/slack.svg',
    category: 'productivity',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    path: 'path-to-spotify',
    icon: '/icons/spotify.svg',
    category: 'entertainment',
  },
  {
    id: 'notion',
    name: 'Notion',
    path: 'path-to-notion',
    icon: '/icons/notion.svg',
    category: 'productivity',
  },
  {
    id: 'postman',
    name: 'Postman',
    path: 'path-to-postman',
    icon: '/icons/postman.svg',
    category: 'development',
  },
])

// 右键菜单
const contextMenu = ref()
const selectedApp = ref<Application | null>(null)

// 右键菜单项目
const contextMenuItems = computed((): MenuItem[] => [
  {
    label: '启动应用',
    icon: 'pi pi-play',
    command: () => {
      if (selectedApp.value) launchApp(selectedApp.value)
    },
  },
  {
    label: selectedApp.value?.pinned ? '取消固定' : '固定到快速访问',
    icon: 'pi pi-thumbtack',
    command: () => {
      if (selectedApp.value) pinToQuickAccess(selectedApp.value)
    },
  },
  { separator: true },
  {
    label: '编辑',
    icon: 'pi pi-pencil',
    command: () => {
      if (selectedApp.value) editApp(selectedApp.value)
    },
  },
  {
    label: '移除',
    icon: 'pi pi-trash',
    class: 'text-red-500',
    command: () => {
      if (selectedApp.value) removeApp(selectedApp.value)
    },
  },
])

// 方法
const launchApp = async (app: Application) => {
  app.lastUsed = new Date()
  // await invoke('launch_application', { path: app.path })
}

// 拖拽事件处理
const onDragStart = (evt: { oldIndex: number; item: HTMLElement }) => {
  console.log('开始拖拽:', evt)
  isDragging.value = true
  sortSaved.value = false
}

const onDragEnd = (evt: { oldIndex: number; newIndex: number; item: HTMLElement }) => {
  console.log('拖拽结束:', evt)
  isDragging.value = false
  
  // 保存排序到本地存储
  saveApplicationOrder()
  
  // 显示保存成功提示
  sortSaved.value = true
  setTimeout(() => {
    sortSaved.value = false
  }, 2000)
}

const onDragChange = (evt: { moved?: { element: Application; oldIndex: number; newIndex: number } }) => {
  console.log('拖拽变化:', evt)
  // 实时更新排序
  if (evt.moved) {
    console.log(`元素 "${evt.moved.element.name}" 从位置 ${evt.moved.oldIndex} 移动到 ${evt.moved.newIndex}`)
    
    // 可以在这里添加一些实时视觉反馈
    // 比如临时高亮移动的元素等
  }
}

// 保存应用排序
const saveApplicationOrder = () => {
  const order = applications.value.map((app, index) => ({
    id: app.id,
    order: index,
  }))
  localStorage.setItem('mira-app-order', JSON.stringify(order))
  console.log('已保存应用排序:', order)
}

// 加载应用排序
const loadApplicationOrder = () => {
  const savedOrder = localStorage.getItem('mira-app-order')
  if (savedOrder) {
    try {
      const order: Array<{ id: string; order: number }> = JSON.parse(savedOrder)
      const orderedApps = [...applications.value]
      
      // 根据保存的顺序重新排列应用
      orderedApps.sort((a, b) => {
        const orderA = order.find(o => o.id === a.id)?.order ?? 999
        const orderB = order.find(o => o.id === b.id)?.order ?? 999
        return orderA - orderB
      })
      
      applications.value = orderedApps
      console.log('已加载应用排序')
    } catch (error) {
      console.error('加载应用排序失败:', error)
    }
  }
}

const showContextMenu = (app: Application, event: MouseEvent) => {
  selectedApp.value = app
  contextMenu.value.show(event)
}

const hideContextMenu = () => {
  selectedApp.value = null
}

const pinToQuickAccess = (app: Application) => {
  app.pinned = !app.pinned
  console.log(`${app.pinned ? '固定' : '取消固定'} ${app.name}`)
  hideContextMenu()
}

const editApp = (app: Application) => {
  console.log(`编辑应用: ${app.name}`)
  hideContextMenu()
}

const removeApp = (app: Application) => {
  if (confirm(`确定要移除 "${app.name}" 吗？`)) {
    const index = applications.value.findIndex((a: Application) => a.id === app.id)
    if (index > -1) {
      applications.value.splice(index, 1)
    }
  }
  hideContextMenu()
}

const handleClickOutside = () => {
  // PrimeVue ContextMenu 自动处理点击外部关闭
  hideContextMenu()
}

onMounted(() => {
  document.title = 'Mira Launcher - 应用程序'
  
  // 加载保存的应用排序
  loadApplicationOrder()
  
  document.addEventListener('click', handleClickOutside)
  // 阻止右键菜单的默认行为
  document.addEventListener('contextmenu', e => {
    const target = e.target as HTMLElement
    if (!target?.closest?.('.context-menu')) {
      e.preventDefault()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', e => {
    const target = e.target as HTMLElement
    if (!target?.closest?.('.context-menu')) {
      e.preventDefault()
    }
  })
})
</script>

<style scoped>
.applications-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 6rem);
  /* Adjust for title bar height + menubar height */
  background-color: #111827;
  user-select: none;
  /* 防止文字选中 */
}

.settings-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 2rem;
  padding: 0.5rem 1rem;
  background-color: rgba(31, 41, 55, 0.8);
  border-bottom: 1px solid rgba(75, 85, 99, 0.3);
}

.save-indicator {
  padding: 0.25rem 0.75rem;
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-10px); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}

.icon-size-control,
.grid-size-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-size-slider,
.grid-size-slider {
  width: 120px;
  accent-color: #3b82f6;
}

.page-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.app-grid {
  display: grid;
  width: 100%;
  min-height: 100%;
  align-content: start;
}

.app-item-wrapper {
  width: 100%;
  height: 100%;
  min-height: 120px;
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  background-color: rgba(55, 65, 81, 0.6);
  border: 2px solid transparent;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  height: 100%;
  min-height: 120px;
}

.app-item:hover {
  background-color: rgba(55, 65, 81, 0.8);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
}

.app-item:active {
  transform: translateY(0);
}

.app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-label {
  font-size: 0.875rem;
  line-height: 1.25;
  color: #e5e7eb;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  font-weight: 500;
}

/* 拖拽状态样式 */
.ghost {
  opacity: 0.4;
  background-color: rgba(59, 130, 246, 0.2) !important;
  border: 2px dashed rgba(59, 130, 246, 0.6) !important;
  border-radius: 12px;
}

.ghost .app-item {
  background-color: transparent !important;
  border: none !important;
}

.chosen {
  background-color: rgba(59, 130, 246, 0.15) !important;
  border-color: rgba(59, 130, 246, 0.7) !important;
  transform: scale(1.02);
}

.chosen .app-item {
  background-color: rgba(59, 130, 246, 0.2) !important;
  border-color: rgba(59, 130, 246, 0.8) !important;
}

.dragging {
  opacity: 0.8;
  transform: rotate(1deg) scale(1.05) !important;
  z-index: 1000;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
  transition: none !important;
}

.dragging .app-item {
  background-color: rgba(55, 65, 81, 0.9) !important;
  border-color: rgba(59, 130, 246, 0.8) !important;
}

/* 应用图标样式优化 */
.app-icon img {
  transition: transform 0.2s ease-in-out;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
  border-radius: 8px;
}

.app-item:hover .app-icon img {
  transform: scale(1.05);
}

/* 确保SVG图标正确渲染 */
.app-icon svg {
  transition: transform 0.2s ease-in-out;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.app-item:hover .app-icon svg {
  transform: scale(1.05);
}

/* 响应式布局优化 */
@media (max-width: 800px) {
  .page-container {
    padding: 0.5rem;
  }

  .settings-bar {
    padding: 0.25rem 0.5rem;
    gap: 1rem;
  }

  .icon-size-control,
  .grid-size-control {
    font-size: 0.75rem;
  }

  .icon-size-slider,
  .grid-size-slider {
    width: 80px;
  }

  .app-item {
    padding: 0.5rem;
    min-height: 100px;
  }

  .app-label {
    font-size: 0.75rem;
  }
}

/* VueDraggable 样式 */
.sortable-ghost {
  opacity: 0.3;
}

.sortable-chosen {
  background-color: rgba(59, 130, 246, 0.1);
}

.sortable-drag {
  opacity: 0.8;
  transform: scale(1.05);
  z-index: 1000;
}

/* PrimeVue ContextMenu 深色主题定制 */
:global(.p-contextmenu) {
  background-color: #1f2937 !important;
  border: 1px solid #4b5563 !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
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
