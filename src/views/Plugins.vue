<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <div class="plugins-page flex flex-col h-screen">
    <Container class="max-w-7xl mx-auto flex-1 flex flex-col overflow-hidden">


      <!-- 工具栏 -->
      <Toolbar class="mb-6">
        <template #start>
          <div class="flex gap-2">
            <Button
              icon="pi pi-refresh"
              text
              v-tooltip="'刷新插件列表'"
              @click="refreshPlugins"
            />
            <Button
              icon="pi pi-plus"
              severity="success"
              text
              v-tooltip="'安装插件'"
              @click="showInstallModal = true"
            />
            <Button 
              icon="pi pi-info-circle" 
              severity="info"
              text
              v-tooltip="'系统信息'"
              @click="showSystemInfo = true" 
            />
            <Button
              icon="pi pi-chart-line"
              severity="warning"
              text
              v-tooltip="`性能监控: ${performanceStats.plugins} 个插件, ${performanceStats.memory}MB 内存, 状态 ${performanceStats.status === 'good' ? '良好' : '需优化'}`"
              @click="togglePerformanceDetails"
            />
            <Button
              v-if="isDev"
              :icon="hotReloadStatus.isReloading ? 'pi pi-spin pi-spinner' : 'pi pi-replay'"
              severity="secondary"
              text
              :disabled="hotReloadStatus.isReloading"
              v-tooltip="`热重载: ${hotReloadStatus.isReloading ? '重载中' : '就绪'} (成功: ${hotReloadStatus.stats.successfulReloads}, 失败: ${hotReloadStatus.stats.failedReloads})`"
              @click="manualReload"
            />
            <Button
              icon="pi pi-cog"
              severity="secondary"
              text
              v-tooltip="'设置'"
              @click="navigateToSettings"
            />
          </div>
        </template>
        <template #end>
          <IconField icon-position="left">
            <InputIcon>
              <i class="pi pi-search" />
            </InputIcon>
            <InputText
              v-model="searchQuery"
              placeholder="搜索插件..."
              class="w-64"
            />
          </IconField>
        </template>
      </Toolbar>

      <!-- 插件列表 -->
      <div class="flex-1 overflow-hidden">
        <DataTable
          :value="filteredPlugins"
          paginator
          :rows="20"
          :rows-per-page-options="[10, 20, 50, 100]"
          current-page-report-template="显示 {first} 到 {last} 条，共 {totalRecords} 条记录"
          paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          :loading="isLoading"
          data-key="id"
          class="plugin-table h-full"
          striped-rows
          scrollable
          scroll-height="flex"
          :pt="{
            table: { style: 'min-width: 50rem' },
            paginator: {
              root: { class: 'border-t-1 border-gray-300 px-6 py-3' }
            }
          }"
        >
        <template #empty>
          <div class="text-center py-8">
            <i class="pi pi-box text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">暂无插件</p>
            <Button 
              label="安装第一个插件" 
              severity="secondary" 
              @click="showInstallModal = true"
              class="mt-3"
            />
          </div>
        </template>

        <template #loading>
          <div class="text-center py-8">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" />
            <p class="text-gray-500 mt-4">加载插件列表...</p>
          </div>
        </template>

        <Column field="name" header="插件名称" sortable class="min-w-0">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <Avatar 
                :label="data.name.charAt(0).toUpperCase()" 
                shape="circle" 
                size="normal"
                :style="{ backgroundColor: getPluginColor(data.id), color: 'white' }"
              />
              <div class="min-w-0 flex-1">
                <div class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ data.name }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ data.description }}</div>
              </div>
            </div>
          </template>
        </Column>

        <Column field="version" header="版本" sortable style="width: 120px">
          <template #body="{ data }">
            <Tag :value="data.version" severity="info" rounded />
          </template>
        </Column>

        <Column field="author" header="作者" sortable style="width: 150px">
          <template #body="{ data }">
            <span class="text-gray-700 dark:text-gray-300">{{ data.author }}</span>
          </template>
        </Column>

        <Column field="state" header="状态" sortable style="width: 120px">
          <template #body="{ data }">
            <Tag 
              :value="getStatusText(data.state)" 
              :severity="getStatusSeverity(data.state)"
              rounded
            />
          </template>
        </Column>

        <Column field="enabled" header="启用" style="width: 80px">
          <template #body="{ data }">
            <ToggleSwitch 
              :modelValue="data.state === 'active'"
              @update:modelValue="togglePlugin(data)"
              :disabled="isLoading"
            />
          </template>
        </Column>

        <Column header="操作" style="width: 150px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                icon="pi pi-cog"
                size="small"
                severity="secondary"
                text
                v-tooltip="'配置'"
                @click="configurePlugin(data)"
              />
              <Button
                icon="pi pi-eye"
                size="small"
                severity="info"
                text
                v-tooltip="'详情'"
                @click="viewPluginDetails(data)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                v-tooltip="'移除'"
                @click="removePlugin(data)"
              />
            </div>
          </template>
        </Column>
        </DataTable>
      </div>

      <!-- 安装插件模态框 -->
      <Dialog
        v-model:visible="showInstallModal"
        header="安装插件"
        :style="{ width: '600px' }"
        modal
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">插件包路径或URL</label>
            <InputText
              v-model="installPath"
              placeholder="输入插件包路径或下载链接"
              class="w-full"
            />
          </div>
          <div class="text-sm text-gray-500">
            支持 .zip 文件或 GitHub 仓库链接
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button 
              label="取消" 
              severity="secondary" 
              @click="showInstallModal = false" 
            />
            <Button 
              label="安装" 
              @click="installPlugin" 
              :disabled="!installPath.trim()"
            />
          </div>
        </template>
      </Dialog>

      <!-- 系统信息模态框 -->
      <Dialog
        v-model:visible="showSystemInfo"
        header="系统信息"
        :style="{ width: '800px' }"
        modal
      >
        <div class="space-y-4">
          <Card title="插件统计">
            <template #content>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-sm text-gray-500">总计插件:</span>
                  <span class="ml-2 font-semibold">{{ pluginCount }}</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500">已启用:</span>
                  <span class="ml-2 font-semibold">{{ activePluginCount }}</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500">系统版本:</span>
                  <span class="ml-2 font-semibold">{{ appVersion }}</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500">插件 API 版本:</span>
                  <span class="ml-2 font-semibold">{{ pluginApiVersion }}</span>
                </div>
              </div>
            </template>
          </Card>
        </div>
        <template #footer>
          <Button 
            label="关闭" 
            @click="showSystemInfo = false" 
          />
        </template>
      </Dialog>
    </Container>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Card from '@/components/common/Card.vue'
import Container from '@/components/layout/Container.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dialog from 'primevue/dialog'
import Avatar from 'primevue/avatar'
import ProgressSpinner from 'primevue/progressspinner'
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGridStore } from '@/stores/grid'
import { usePageStore } from '@/stores/page'
import { useThemeStore } from '@/stores/theme'
import { usePluginStore } from '@/stores/plugin'
import type { PluginRegistryEntry, PluginState } from '@/types/plugin'

// 响应式数据
const searchQuery = ref('')
const showInstallModal = ref(false)
const showSystemInfo = ref(false)
const installPath = ref('')

// 路由
const router = useRouter()

// 开发环境检测
const isDev = ref(import.meta.env.DEV)

// Store 实例
const gridStore = useGridStore()
const pageStore = usePageStore()
const themeStore = useThemeStore()
const pluginStore = usePluginStore()

// 插件相关数据
const plugins = computed(() => pluginStore.plugins)
const isLoading = computed(() => pluginStore.isLoading)
const pluginCount = computed(() => pluginStore.pluginCount)
const activePluginCount = computed(() => pluginStore.activePluginCount)

// 应用信息
const appVersion = ref('1.0.0')
const pluginApiVersion = ref('1.0.0')

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

// 过滤后的插件列表
const filteredPlugins = computed(() => {
  if (!searchQuery.value) return plugins.value
  const query = searchQuery.value.toLowerCase()
  return plugins.value.filter(plugin =>
    plugin.metadata.name.toLowerCase().includes(query) ||
    (plugin.metadata.description?.toLowerCase().includes(query)) ||
    (plugin.metadata.author?.toLowerCase().includes(query)),
  )
})

// 工具函数
const getPluginColor = (pluginId: string): string => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
  ]
  let hash = 0
  for (let i = 0; i < pluginId.length; i++) {
    hash = pluginId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length] || '#3B82F6'
}

const getStatusText = (state: PluginState): string => {
  const statusMap: Partial<Record<PluginState, string>> = {
    'registered': '已注册',
    'loaded': '已加载',
    'loading': '加载中',
    'active': '已启用',
    'activating': '启用中',
    'inactive': '已禁用',
    'deactivating': '禁用中',
    'error': '错误',
    'unloaded': '已卸载',
    'unloading': '卸载中',
  }
  return statusMap[state] || '未知'
}

const getStatusSeverity = (state: PluginState): string => {
  const severityMap: Partial<Record<PluginState, string>> = {
    'registered': 'info',
    'loaded': 'warn',
    'loading': 'info',
    'active': 'success',
    'activating': 'info',
    'inactive': 'secondary',
    'deactivating': 'warn',
    'error': 'danger',
    'unloaded': 'secondary',
    'unloading': 'warn',
  }
  return severityMap[state] || 'secondary'
}

// 更新系统整合状态
const updateIntegrationStatus = () => {
  // 更新 Grid 集成状态
  const pluginGridItems = gridStore.getPluginItems?.() || []
  gridIntegration.value = {
    count: pluginGridItems.length,
    types: gridStore.pluginItemTypes?.size || 0,
    status: pluginGridItems.length > 50 ? 'warning' : 'healthy',
  }

  // 更新 Page 集成状态  
  const pluginPages = pageStore.getPluginPages?.() || []
  pageIntegration.value = {
    count: pluginPages.length,
    routes: pluginPages.length,
    status: pluginPages.length > (pageStore.pluginPageConfig?.maxPluginPages || 20) * 0.8 ? 'warning' : 'healthy',
  }

  // 更新 Theme 集成状态
  const pluginThemes = themeStore.getPluginThemes?.() || []
  const activeThemes = themeStore.getActivePluginThemes?.() || []
  themeIntegration.value = {
    count: pluginThemes.length,
    active: activeThemes.length,
    status: pluginThemes.length > 20 ? 'warning' : 'healthy',
  }

  // 更新性能状态
  performanceStats.value = {
    plugins: pluginCount.value,
    memory: Math.round(Math.random() * 100), // 模拟内存使用
    status: pluginCount.value > 20 ? 'warning' : pluginCount.value > 50 ? 'error' : 'good',
  }

  // 更新热重载状态
  if (isDev.value && (window as unknown as Record<string, unknown>)['__hotReloadManager']) {
    const hotReloadManager = (window as unknown as Record<string, unknown>)['__hotReloadManager'] as {
      getReloadStatus: () => typeof hotReloadStatus.value
    }
    const status = hotReloadManager.getReloadStatus()
    hotReloadStatus.value = status
  }
}

// 手动重载
const manualReload = async () => {
  if (isDev.value && (window as unknown as Record<string, unknown>)['__hotReloadManager']) {
    try {
      const manager = (window as unknown as Record<string, unknown>)['__hotReloadManager'] as {
        manualReload: (pluginId: string) => Promise<void>
      }
      const pluginIds = plugins.value.filter(p => p.state === 'active').map(p => p.metadata.id)

      for (const pluginId of pluginIds) {
        await manager.manualReload(pluginId)
      }

      updateIntegrationStatus()
    } catch (error) {
      console.error('Manual reload failed:', error)
    }
  }
}

// 切换性能详情显示
const showPerformanceDetails = ref(false)
const togglePerformanceDetails = () => {
  showPerformanceDetails.value = !showPerformanceDetails.value
}

// 导航到设置页面
const navigateToSettings = () => {
  router.push('/settings')
}

// 切换插件状态
const togglePlugin = async (plugin: PluginRegistryEntry) => {
  try {
    if (plugin.state === 'active') {
      await pluginStore.deactivatePlugin(plugin.metadata.id)
    } else {
      await pluginStore.activatePlugin(plugin.metadata.id)
    }
    updateIntegrationStatus()
  } catch (error) {
    console.error('Failed to toggle plugin:', error)
  }
}

// 配置插件
const configurePlugin = (plugin: PluginRegistryEntry) => {
  console.log(`配置插件: ${plugin.metadata.name}`)
  // TODO: 实现插件配置界面
}

// 查看插件详情
const viewPluginDetails = (plugin: PluginRegistryEntry) => {
  console.log(`查看插件详情: ${plugin.metadata.name}`)
  // TODO: 实现插件详情界面
}

// 移除插件
const removePlugin = async (plugin: PluginRegistryEntry) => {
  if (confirm(`确定要移除插件 "${plugin.metadata.name}" 吗？`)) {
    try {
      await pluginStore.unloadPlugin(plugin.metadata.id)
      updateIntegrationStatus()
    } catch (error) {
      console.error('Failed to remove plugin:', error)
    }
  }
}

// 刷新插件列表
const refreshPlugins = () => {
  console.log('刷新插件列表')
  updateIntegrationStatus()
}

// 安装插件
const installPlugin = async () => {
  if (!installPath.value.trim()) {
    alert('请输入插件路径或URL')
    return
  }

  console.log(`安装插件: ${installPath.value}`)
  // TODO: 实现插件安装逻辑

  showInstallModal.value = false
  installPath.value = ''
  updateIntegrationStatus()
}

// 状态更新定时器
let statusInterval: number | null = null

onMounted(async () => {
  document.title = 'Mira Launcher - 插件管理'

  // 初始化插件系统
  if (!pluginStore.isInitialized) {
    await pluginStore.initialize()
  }

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

onUnmounted(cleanup)

// 页面卸载时清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup)
}
</script>

<style scoped>
.plugins-page {
  height: 100vh;
  padding: 1rem;
  background-color: #f8fafc;
  overflow: hidden;
}

.dark .plugins-page {
  background-color: #0f172a;
}

.integration-status {
  border-left: 3px solid #10b981;
  transition: all 0.2s ease;
}

.integration-status:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .integration-status:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.plugin-table {
  height: 100%;
}

.plugin-table :deep(.p-datatable) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.plugin-table :deep(.p-datatable .p-datatable-wrapper) {
  flex: 1;
  overflow: auto;
}

.plugin-table :deep(.p-datatable-header) {
  background: transparent;
  border: none;
  padding: 1rem 0;
  flex-shrink: 0;
}

.plugin-table :deep(.p-paginator) {
  flex-shrink: 0;
}

.plugin-table :deep(.p-datatable-thead > tr > th) {
  background: #f1f5f9;
  color: #374151;
  font-weight: 600;
  border: 1px solid #e2e8f0;
}

.dark .plugin-table :deep(.p-datatable-thead > tr > th) {
  background: #1e293b;
  color: #d1d5db;
  border-color: #374151;
}

.plugin-table :deep(.p-datatable-tbody > tr > td) {
  border: 1px solid #e2e8f0;
  padding: 1rem;
}

.dark .plugin-table :deep(.p-datatable-tbody > tr > td) {
  border-color: #374151;
}

.plugin-table :deep(.p-datatable-tbody > tr:nth-child(even)) {
  background: #f8fafc;
}

.dark .plugin-table :deep(.p-datatable-tbody > tr:nth-child(even)) {
  background: #1a202c;
}

.plugin-table :deep(.p-datatable-tbody > tr:hover) {
  background: #e2e8f0 !important;
}

.dark .plugin-table :deep(.p-datatable-tbody > tr:hover) {
  background: #2d3748 !important;
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

/* 响应式调整 */
@media (max-width: 768px) {
  .plugins-page {
    padding: 1rem 0.5rem;
  }
  
  .plugin-table :deep(.p-datatable) {
    font-size: 0.875rem;
  }
  
  .plugin-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
  }
}

/* PrimeVue 组件样式重写 */
:deep(.p-card) {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

:deep(.p-card:hover) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:deep(.p-toolbar) {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.dark :deep(.p-toolbar) {
  background: #1e293b;
  border-color: #374151;
}

:deep(.p-tag) {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

:deep(.p-toggleswitch) {
  width: 2.5rem;
}

:deep(.p-toggleswitch .p-toggleswitch-slider) {
  transition: all 0.2s ease;
}
</style>
