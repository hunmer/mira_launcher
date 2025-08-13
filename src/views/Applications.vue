<template>
  <div class="applications-page">
    <!-- 图标尺寸控制 -->
    <div class="settings-bar">
      <div class="icon-size-control">
        <label for="icon-size" class="text-sm text-gray-300">图标大小:</label>
        <input id="icon-size" v-model="iconSize" type="range" min="48" max="200" step="8" class="icon-size-slider">
        <span class="text-xs text-gray-400">{{ iconSize }}px</span>
      </div>
    </div>

    <div class="page-container">
      <GridContainer :items="page1Apps" :draggable="true" :min-columns="4" :icon-size="iconSize" :max-icon-size="200"
        @drag-update="handleDragUpdate">
        <GridItem v-for="app in filteredApps.slice(0, 6)" :key="app.id" :icon-size="iconSize" :max-icon-size="200"
          @click="launchApp(app)" @contextmenu="showContextMenu(app, $event)">
          <template #icon>
            <img v-if="app.icon" :src="app.icon" :alt="app.name"
              :style="{ width: iconSize + 'px', height: iconSize + 'px', maxWidth: '200px', maxHeight: '200px' }"
              class="object-contain">
            <AppIcon v-else name="monitor" :size="iconSize" class="text-gray-400" />
          </template>
          <template #label>
            {{ app.name }}
          </template>
        </GridItem>
      </GridContainer>
    </div>
    <div class="page-container">
      <GridContainer :items="page2Apps" :draggable="true" :min-columns="4" :icon-size="iconSize" :max-icon-size="200"
        @drag-update="handleDragUpdate">
        <GridItem v-for="app in filteredApps.slice(6)" :key="app.id" :icon-size="iconSize" :max-icon-size="200"
          @click="launchApp(app)" @contextmenu="showContextMenu(app, $event)">
          <template #icon>
            <img v-if="app.icon" :src="app.icon" :alt="app.name"
              :style="{ width: iconSize + 'px', height: iconSize + 'px', maxWidth: '200px', maxHeight: '200px' }"
              class="object-contain">
            <AppIcon v-else name="monitor" :size="iconSize" class="text-gray-400" />
          </template>
          <template #label>
            {{ app.name }}
          </template>
        </GridItem>
      </GridContainer>
    </div>

    <!-- ContextMenu组件 -->
    <ContextMenu v-model:show="contextMenu.show" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenuItems"
      @select="handleContextMenuSelect" />
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '@/components/common/ContextMenu.vue'
import ContextMenu from '@/components/common/ContextMenu.vue'
import { GridContainer, GridItem } from '@/components/grid'
import AppIcon from '@/components/icons/AppIcon.vue'
import { useGridStore } from '@/stores/grid'
import { computed, onMounted, reactive, ref } from 'vue'

interface Application {
  id: string
  name: string
  path: string
  icon?: string
  category: string
  lastUsed?: Date
  pinned?: boolean
}

// Store
const gridStore = useGridStore()

// 图标尺寸配置
const iconSize = ref(72) // 默认图标大小

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
const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  app: null as Application | null,
})

// 计算属性
const filteredApps = computed(() => {
  // In this version, we are not filtering, but you could re-add search/sort later
  return applications.value
})

const page1Apps = computed(() =>
  filteredApps.value.slice(0, 2).map(app => ({
    id: app.id,
    name: app.name,
    icon: app.icon || '',
    category: app.category,
    gridSize: '2x2' as const,
  })),
)

const page2Apps = computed(() =>
  filteredApps.value.slice(6).map(app => ({
    id: app.id,
    name: app.name,
    icon: app.icon || '',
    category: app.category,
    gridSize: '1x1' as const,
  })),
)

// 右键菜单项目
const contextMenuItems = computed((): MenuItem[] => [
  {
    label: '启动应用',
    icon: 'play',
    action: () => {
      if (contextMenu.app) launchApp(contextMenu.app)
    },
  },
  {
    label: contextMenu.app?.pinned ? '取消固定' : '固定到快速访问',
    icon: 'pin',
    action: () => {
      if (contextMenu.app) pinToQuickAccess(contextMenu.app)
    },
  },
  { separator: true, label: '' },
  {
    label: '编辑',
    icon: 'edit',
    action: () => {
      if (contextMenu.app) editApp(contextMenu.app)
    },
  },
  {
    label: '移除',
    icon: 'trash',
    danger: true,
    action: () => {
      if (contextMenu.app) removeApp(contextMenu.app)
    },
  },
])

// 方法
const launchApp = async (app: Application) => {
  console.log(`启动应用: ${app.name}`)
  app.lastUsed = new Date()
  // await invoke('launch_application', { path: app.path })
}

const showContextMenu = (app: Application, event: MouseEvent) => {
  contextMenu.app = app
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
  contextMenu.show = true
}

const hideContextMenu = () => {
  contextMenu.show = false
}

const handleContextMenuSelect = (item: MenuItem) => {
  if (item.action) {
    item.action()
  }
  hideContextMenu()
}

const handleDragUpdate = (event: any) => {
  const { newIndex, oldIndex } = event
  if (oldIndex !== newIndex && oldIndex !== undefined && newIndex !== undefined) {
    const movedApp = applications.value.splice(oldIndex, 1)[0]
    if (movedApp) {
      applications.value.splice(newIndex, 0, movedApp)
      gridStore.moveItem(oldIndex, newIndex)
    }
  }
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
    const index = applications.value.findIndex(a => a.id === app.id)
    if (index > -1) {
      applications.value.splice(index, 1)
    }
  }
  hideContextMenu()
}

const handleClickOutside = () => {
  if (contextMenu.show) {
    hideContextMenu()
  }
}

onMounted(() => {
  document.title = 'Mira Launcher - 应用程序'
  document.addEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.applications-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 3rem);
  /* Adjust for title bar height */
  background-color: #111827;
  user-select: none;
  /* 防止文字选中 */
}

.settings-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: rgba(31, 41, 55, 0.8);
  border-bottom: 1px solid rgba(75, 85, 99, 0.3);
}

.icon-size-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-size-slider {
  width: 120px;
  accent-color: #3b82f6;
}

.page-container {
  height: calc(50% - 2rem);
  overflow-y: auto;
  padding: 1rem;
}

/* 应用图标样式优化 */
.applications-page img {
  transition: transform 0.2s ease-in-out;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
  /* 防止图标被拖拽 */
}

.applications-page img:hover {
  transform: scale(1.05);
}

/* 确保SVG图标正确渲染 */
.applications-page svg {
  transition: transform 0.2s ease-in-out;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.applications-page svg:hover {
  transform: scale(1.05);
}

/* 网格项目的响应式布局优化 */
@media (max-width: 800px) {
  .page-container {
    padding: 0.5rem;
  }

  .settings-bar {
    padding: 0.25rem 0.5rem;
  }

  .icon-size-control {
    font-size: 0.75rem;
  }

  .icon-size-slider {
    width: 80px;
  }
}

/* 应用标签文字优化 */
.grid-item-label {
  font-size: 0.875rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>
