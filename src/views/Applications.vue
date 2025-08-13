<template>
  <div class="applications-page">
    <Container class="max-w-6xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          应用程序
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          快速启动和管理您的应用程序
        </p>
      </div>

      <div class="flex justify-between items-center mb-6">
        <div class="flex space-x-2">
          <Button @click="scanApplications">
            扫描应用
          </Button>
          <Button type="primary" @click="addCustomApp">
            添加应用
          </Button>
        </div>
        <div class="flex space-x-2">
          <Input v-model="searchQuery" placeholder="搜索应用..." class="w-64" />
          <select v-model="sortBy"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="name">
              按名称排序
            </option>
            <option value="recent">
              最近使用
            </option>
            <option value="category">
              按分类排序
            </option>
          </select>
        </div>
      </div>

      <GridContainer :items="gridItems" :draggable="true" @drag-update="handleDragUpdate">
        <GridItem v-for="app in filteredApps" :key="app.id" @click="launchApp(app)"
          @contextmenu="showContextMenu(app, $event)">
          <template #icon>
            <img v-if="app.icon" :src="app.icon" :alt="app.name" class="w-12 h-12 object-contain">
            <AppIcon v-else name="monitor" :size="48" class="text-gray-400" />
          </template>
          <template #label>
            {{ app.name }}
          </template>
        </GridItem>
      </GridContainer>

      <!-- ContextMenu组件 -->
      <ContextMenu v-model:show="contextMenu.show" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenuItems"
        @select="handleContextMenuSelect" />

      <!-- 添加应用模态框 -->
      <Modal v-model:show="showAddModal" title="添加应用" @positive-click="saveCustomApp"
        @negative-click="showAddModal = false">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">应用名称</label>
            <Input v-model="newApp.name" placeholder="输入应用名称" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">执行路径</label>
            <Input v-model="newApp.path" placeholder="选择或输入可执行文件路径" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">图标路径（可选）</label>
            <Input v-model="newApp.icon" placeholder="选择图标文件" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">分类</label>
            <select v-model="newApp.category"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="productivity">
                生产力
              </option>
              <option value="entertainment">
                娱乐
              </option>
              <option value="development">
                开发
              </option>
              <option value="utility">
                工具
              </option>
              <option value="other">
                其他
              </option>
            </select>
          </div>
        </div>
      </Modal>
    </Container>
  </div>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import type { MenuItem } from '@/components/common/ContextMenu.vue'
import ContextMenu from '@/components/common/ContextMenu.vue'
import Input from '@/components/common/Input.vue'
import Modal from '@/components/common/Modal.vue'
import { GridContainer, GridItem } from '@/components/grid'
import AppIcon from '@/components/icons/AppIcon.vue'
import Container from '@/components/layout/Container.vue'
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

// 响应式数据
const searchQuery = ref('')
const sortBy = ref('name')
const showAddModal = ref(false)

// Store
const gridStore = useGridStore()

// 应用列表
const applications = ref<Application[]>([
  {
    id: 'chrome',
    name: 'Google Chrome',
    path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    category: 'productivity',
    lastUsed: new Date(),
  },
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    path: 'C:\\Users\\Username\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
    category: 'development',
    lastUsed: new Date(),
  },
  {
    id: 'notepad',
    name: '记事本',
    path: 'C:\\Windows\\System32\\notepad.exe',
    category: 'utility',
  },
])

// 新应用表单
const newApp = reactive({
  name: '',
  path: '',
  icon: '',
  category: 'other',
})

// 右键菜单
const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  app: null as Application | null,
})

// 计算属性
const filteredApps = computed(() => {
  let apps = applications.value

  // 搜索过滤
  if (searchQuery.value) {
    apps = apps.filter(app =>
      app.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  // 排序
  switch (sortBy.value) {
    case 'name':
      apps.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'recent':
      apps.sort((a, b) => {
        const aTime = a.lastUsed?.getTime() || 0
        const bTime = b.lastUsed?.getTime() || 0
        return bTime - aTime
      })
      break
    case 'category':
      apps.sort((a, b) => a.category.localeCompare(b.category))
      break
  }

  return apps
})

// 转换应用数据为网格项目
const gridItems = computed(() =>
  applications.value.map(app => ({
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

  // 这里可以调用 Tauri API 启动应用
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

// 处理右键菜单选择
const handleContextMenuSelect = (item: MenuItem) => {
  if (item.action) {
    item.action()
  }
  hideContextMenu()
}

// 处理拖拽更新
const handleDragUpdate = (event: any) => {
  // 同步拖拽结果到applications数组
  const { newIndex, oldIndex } = event
  if (oldIndex !== newIndex && oldIndex !== undefined && newIndex !== undefined) {
    const movedApp = applications.value.splice(oldIndex, 1)[0]
    if (movedApp) {
      applications.value.splice(newIndex, 0, movedApp)

      // 同步到gridStore
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
  // 编辑应用逻辑
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

const scanApplications = () => {
  console.log('扫描系统应用程序...')
  // 这里可以调用 Tauri API 扫描系统应用
}

const addCustomApp = () => {
  showAddModal.value = true
}

const saveCustomApp = () => {
  if (!newApp.name || !newApp.path) {
    alert('请填写应用名称和路径')
    return
  }

  const app: Application = {
    id: Date.now().toString(),
    name: newApp.name,
    path: newApp.path,
    category: newApp.category,
  }

  if (newApp.icon) {
    app.icon = newApp.icon
  }

  applications.value.push(app)

  // 重置表单
  Object.assign(newApp, {
    name: '',
    path: '',
    icon: '',
    category: 'other',
  })

  showAddModal.value = false
}

// 点击页面其他地方隐藏右键菜单
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
  min-height: 100vh;
  padding: 2rem 1rem;
  background-color: #f9fafb;
}

.dark .applications-page {
  background-color: #111827;
}
</style>
