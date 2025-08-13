<template>
  <div class="plugins-page">
    <Container class="max-w-6xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          插件管理
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          管理和配置您的插件扩展
        </p>
      </div>

      <!-- 系统整合状态面板 -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Grid 集成" class="integration-status">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ gridIntegration.count }} 个插件项目</span>
            <span :class="['px-2 py-1 text-xs rounded-full', gridIntegration.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800']">
              {{ gridIntegration.status === 'healthy' ? '正常' : '警告' }}
            </span>
          </div>
          <div class="mt-2 text-xs text-gray-500">
            类型: {{ gridIntegration.types }} 种
          </div>
        </Card>

        <Card title="Page 集成" class="integration-status">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ pageIntegration.count }} 个插件页面</span>
            <span :class="['px-2 py-1 text-xs rounded-full', pageIntegration.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800']">
              {{ pageIntegration.status === 'healthy' ? '正常' : '警告' }}
            </span>
          </div>
          <div class="mt-2 text-xs text-gray-500">
            路由: {{ pageIntegration.routes }} 个
          </div>
        </Card>

        <Card title="Theme 集成" class="integration-status">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ themeIntegration.count }} 个插件主题</span>
            <span :class="['px-2 py-1 text-xs rounded-full', themeIntegration.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800']">
              {{ themeIntegration.status === 'healthy' ? '正常' : '警告' }}
            </span>
          </div>
          <div class="mt-2 text-xs text-gray-500">
            活跃: {{ themeIntegration.active }} 个
          </div>
        </Card>

        <Card title="性能监控" class="integration-status">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ performanceStats.plugins }} 个插件</span>
            <span :class="['px-2 py-1 text-xs rounded-full', performanceStats.status === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
              {{ performanceStats.status === 'good' ? '良好' : '需优化' }}
            </span>
          </div>
          <div class="mt-2 text-xs text-gray-500">
            内存: {{ performanceStats.memory }}MB
          </div>
        </Card>
      </div>

      <!-- 热重载状态 -->
      <div v-if="isDev" class="mb-6">
        <Card title="开发工具" class="bg-blue-50 dark:bg-blue-900/20">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <div :class="['w-2 h-2 rounded-full', hotReloadStatus.isReloading ? 'bg-yellow-400' : 'bg-green-400']"></div>
                <span class="text-sm">热重载: {{ hotReloadStatus.isReloading ? '重载中' : '就绪' }}</span>
              </div>
              <div class="text-xs text-gray-500">
                成功: {{ hotReloadStatus.stats.successfulReloads }} | 失败: {{ hotReloadStatus.stats.failedReloads }}
              </div>
            </div>
            <Button size="small" @click="manualReload">手动重载</Button>
          </div>
        </Card>
      </div>

      <div class="flex justify-between items-center mb-6">
        <div class="flex space-x-2">
          <Button @click="refreshPlugins">
            刷新
          </Button>
          <Button
            type="primary"
            @click="showInstallModal = true"
          >
            安装插件
          </Button>
          <Button @click="showSystemInfo = true">
            系统信息
          </Button>
        </div>
        <Input
          v-model="searchQuery"
          placeholder="搜索插件..."
          class="w-64"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          v-for="plugin in filteredPlugins"
          :key="plugin.id"
          :title="plugin.name"
          :description="plugin.description"
          class="plugin-card"
        >
          <template #extra>
            <div class="flex items-center space-x-2">
              <span
                :class="[
                  'px-2 py-1 text-xs rounded-full',
                  plugin.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ plugin.enabled ? '已启用' : '已禁用' }}
              </span>
              <Button
                size="small"
                :type="plugin.enabled ? 'default' : 'primary'"
                @click="togglePlugin(plugin)"
              >
                {{ plugin.enabled ? '禁用' : '启用' }}
              </Button>
            </div>
          </template>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">版本:</span>
              <span class="font-mono">{{ plugin.version }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">作者:</span>
              <span>{{ plugin.author }}</span>
            </div>
            <div class="flex justify-end space-x-2 mt-4">
              <Button
                size="small"
                variant="outline"
                @click="configurePlugin(plugin)"
              >
                配置
              </Button>
              <Button
                size="small"
                variant="outline"
                @click="removePlugin(plugin)"
              >
                移除
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <!-- 安装插件模态框 -->
      <Modal
        v-model:show="showInstallModal"
        title="安装插件"
        @positive-click="installPlugin"
        @negative-click="showInstallModal = false"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">插件包路径或URL</label>
            <Input
              v-model="installPath"
              placeholder="输入插件包路径或下载链接"
            />
          </div>
          <div class="text-sm text-gray-500">
            支持 .zip 文件或 GitHub 仓库链接
          </div>
        </div>
      </Modal>
    </Container>
  </div>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import Card from '@/components/common/Card.vue'
import Input from '@/components/common/Input.vue'
import Modal from '@/components/common/Modal.vue'
import Container from '@/components/layout/Container.vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useGridStore } from '@/stores/grid'
import { usePageStore } from '@/stores/page'
import { useThemeStore } from '@/stores/theme'

interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  enabled: boolean
}

// 响应式数据
const searchQuery = ref('')
const showInstallModal = ref(false)
const showSystemInfo = ref(false)
const installPath = ref('')

// 开发环境检测
const isDev = ref(import.meta.env.DEV)

// Store 实例
const gridStore = useGridStore()
const pageStore = usePageStore()
const themeStore = useThemeStore()

// 系统整合状态
const gridIntegration = ref({
  count: 0,
  types: 0,
  status: 'healthy' as 'healthy' | 'warning',
})

const pageIntegration = ref({
  count: 0,
  routes: 0,
  status: 'healthy' as 'healthy' | 'warning',
})

const themeIntegration = ref({
  count: 0,
  active: 0,
  status: 'healthy' as 'healthy' | 'warning',
})

const performanceStats = ref({
  plugins: 0,
  memory: 0,
  status: 'good' as 'good' | 'warning' | 'error',
})

const hotReloadStatus = ref({
  isReloading: false,
  stats: {
    totalReloads: 0,
    successfulReloads: 0,
    failedReloads: 0,
    lastReloadTime: null as Date | null,
  },
})

// 更新系统整合状态
const updateIntegrationStatus = () => {
  // 更新 Grid 集成状态
  const pluginGridItems = gridStore.getPluginItems()
  gridIntegration.value = {
    count: pluginGridItems.length,
    types: gridStore.pluginItemTypes.size,
    status: pluginGridItems.length > 50 ? 'warning' : 'healthy',
  }

  // 更新 Page 集成状态  
  const pluginPages = pageStore.getPluginPages()
  pageIntegration.value = {
    count: pluginPages.length,
    routes: pluginPages.length,
    status: pluginPages.length > pageStore.pluginPageConfig.maxPluginPages * 0.8 ? 'warning' : 'healthy',
  }

  // 更新 Theme 集成状态
  const pluginThemes = themeStore.getPluginThemes()
  const activeThemes = themeStore.getActivePluginThemes()
  themeIntegration.value = {
    count: pluginThemes.length,
    active: activeThemes.length,
    status: pluginThemes.length > 20 ? 'warning' : 'healthy',
  }

  // 更新性能状态
  if (isDev.value && (window as any).__performanceMonitor) {
    const report = (window as any).__performanceMonitor.getPerformanceReport()
    performanceStats.value = {
      plugins: report.general.totalPlugins,
      memory: report.memory?.used || 0,
      status: report.memory?.used > 100 ? 'error' : report.memory?.used > 50 ? 'warning' : 'good',
    }
  }

  // 更新热重载状态
  if (isDev.value && (window as any).__hotReloadManager) {
    const status = (window as any).__hotReloadManager.getReloadStatus()
    hotReloadStatus.value = status
  }
}

// 手动重载
const manualReload = async () => {
  if (isDev.value && (window as any).__hotReloadManager) {
    try {
      // 重载所有插件
      const manager = (window as any).__hotReloadManager
      const pluginIds = plugins.value.filter(p => p.enabled).map(p => p.id)
      
      for (const pluginId of pluginIds) {
        await manager.manualReload(pluginId)
      }
      
      updateIntegrationStatus()
    } catch (error) {
      console.error('Manual reload failed:', error)
    }
  }
}

// 模拟插件数据
const plugins = ref<Plugin[]>([
  {
    id: 'weather-widget',
    name: '天气小组件',
    description: '在启动器中显示实时天气信息',
    version: '1.2.0',
    author: 'WeatherApp Inc.',
    enabled: true,
  },
  {
    id: 'system-monitor',
    name: '系统监控',
    description: '监控系统资源使用情况',
    version: '2.1.3',
    author: 'SysTools',
    enabled: false,
  },
  {
    id: 'quick-notes',
    name: '快速笔记',
    description: '快速创建和管理笔记',
    version: '1.0.5',
    author: 'NotesDev',
    enabled: true,
  },
])

// 计算属性
const filteredPlugins = computed(() => {
  if (!searchQuery.value) return plugins.value
  return plugins.value.filter(plugin =>
    plugin.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// 方法
const togglePlugin = (plugin: Plugin) => {
  plugin.enabled = !plugin.enabled
  console.log(`插件 ${plugin.name} ${plugin.enabled ? '已启用' : '已禁用'}`)
  updateIntegrationStatus()
}

const configurePlugin = (plugin: Plugin) => {
  console.log(`配置插件: ${plugin.name}`)
  // 这里可以打开插件配置界面
}

const removePlugin = (plugin: Plugin) => {
  if (confirm(`确定要移除插件 "${plugin.name}" 吗？`)) {
    const index = plugins.value.findIndex(p => p.id === plugin.id)
    if (index > -1) {
      plugins.value.splice(index, 1)
      console.log(`插件 ${plugin.name} 已移除`)
      updateIntegrationStatus()
    }
  }
}

const refreshPlugins = () => {
  console.log('刷新插件列表')
  updateIntegrationStatus()
  // 这里可以重新加载插件列表
}

const installPlugin = () => {
  if (!installPath.value) {
    alert('请输入插件路径或URL')
    return
  }

  console.log(`安装插件: ${installPath.value}`)
  // 这里实现插件安装逻辑

  showInstallModal.value = false
  installPath.value = ''
  updateIntegrationStatus()
}

let statusInterval: number | null = null

onMounted(() => {
  document.title = 'Mira Launcher - 插件管理'
  
  // 初始化状态
  updateIntegrationStatus()
  
  // 定期更新状态 (每5秒)
  statusInterval = window.setInterval(updateIntegrationStatus, 5000)
  
  // 监听性能和重载事件
  if (isDev.value) {
    window.addEventListener('performance-event', updateIntegrationStatus)
    window.addEventListener('plugin-hot-reload', updateIntegrationStatus)
    window.addEventListener('plugin-config-reload', updateIntegrationStatus)
  }
})

// 清理资源
const cleanup = () => {
  if (statusInterval) {
    clearInterval(statusInterval)
    statusInterval = null
  }
  
  if (isDev.value) {
    window.removeEventListener('performance-event', updateIntegrationStatus)
    window.removeEventListener('plugin-hot-reload', updateIntegrationStatus)
    window.removeEventListener('plugin-config-reload', updateIntegrationStatus)
  }
}

// 页面卸载时清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup)
}
</script>

<style scoped>
.plugins-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background-color: #f9fafb;
}

.dark .plugins-page {
  background-color: #111827;
}

.plugin-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.plugin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.integration-status {
  border-left: 3px solid #10b981;
  transition: all 0.2s ease;
}

.integration-status:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.integration-status .card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.dark .integration-status .card-title {
  color: #d1d5db;
}

/* 热重载指示器动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.w-2.h-2.rounded-full.bg-yellow-400 {
  animation: pulse 1.5s infinite;
}

/* 状态徽章样式 */
.bg-green-100 {
  background-color: #dcfce7;
}

.text-green-800 {
  color: #166534;
}

.bg-yellow-100 {
  background-color: #fef3c7;
}

.text-yellow-800 {
  color: #92400e;
}

.bg-red-100 {
  background-color: #fee2e2;
}

.text-red-800 {
  color: #991b1b;
}

/* 深色模式状态徽章 */
.dark .bg-green-100 {
  background-color: #166534;
}

.dark .text-green-800 {
  color: #dcfce7;
}

.dark .bg-yellow-100 {
  background-color: #92400e;
}

.dark .text-yellow-800 {
  color: #fef3c7;
}

.dark .bg-red-100 {
  background-color: #991b1b;
}

.dark .text-red-800 {
  color: #fee2e2;
}
</style>
