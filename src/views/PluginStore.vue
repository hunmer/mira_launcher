<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <div class="plugin-store-page flex flex-col h-screen">
    <Container class="max-w-7xl mx-auto flex-1 flex flex-col overflow-hidden">
      <!-- 工具栏 -->
      <Toolbar class="mb-6">
        <template #start>
          <div class="flex gap-2">
            <Button
              icon="pi pi-refresh"
              text
              v-tooltip="'刷新商城'"
              @click="refreshStore"
            />
            <Button
              icon="pi pi-filter"
              severity="info"
              text
              v-tooltip="'筛选'"
              @click="showFilterModal = true"
            />
            <Button
              icon="pi pi-heart"
              severity="danger"
              text
              v-tooltip="'我的收藏'"
              @click="showFavorites = !showFavorites"
            />
            <Button
              icon="pi pi-upload"
              severity="success"
              text
              v-tooltip="'提交插件'"
              @click="showSubmitModal = true"
            />
          </div>
        </template>
        <template #center>
          <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>共 {{ totalPlugins }} 个插件</span>
            <span>已安装: {{ installedCount }} 个</span>
            <Tag 
              :value="storeStatus"
              :severity="storeStatus === '在线' ? 'success' : 'warning'"
              rounded
              size="small"
            />
          </div>
        </template>
        <template #end>
          <div class="flex gap-2">
            <Dropdown
              v-model="sortBy"
              :options="sortOptions"
              option-label="label"
              option-value="value"
              placeholder="排序方式"
              class="w-40"
            />
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
          </div>
        </template>
      </Toolbar>

      <!-- 插件列表 -->
      <div class="flex-1 overflow-hidden">
        <DataTable
          :value="filteredStorePlugins"
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
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
                插件商城
              </h2>
            </div>
          </template>

          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-shopping-cart text-4xl text-gray-400 mb-4" />
              <p class="text-gray-500">
                暂无插件
              </p>
            </div>
          </template>

          <template #loading>
            <div class="text-center py-8">
              <ProgressSpinner 
                style="width: 50px; height: 50px" 
                stroke-width="8" 
              />
              <p class="text-gray-500 mt-4">
                加载插件商城...
              </p>
            </div>
          </template>

          <Column 
            field="name" 
            header="插件信息" 
            sortable 
            class="min-w-0"
          >
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <Avatar 
                  :image="data.icon"
                  :label="data.name.charAt(0).toUpperCase()" 
                  shape="circle" 
                  size="normal"
                  :style="{ backgroundColor: data.icon ? 'transparent' : getPluginColor(data.id), color: 'white' }"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <div class="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {{ data.name }}
                    </div>
                    <i
                      v-if="data.verified"
                      class="pi pi-verified text-blue-500"
                      v-tooltip="'官方认证'"
                    />
                    <Tag
                      v-if="data.featured"
                      value="精选"
                      severity="success"
                      size="small"
                      rounded
                    />
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">
                    {{ data.description }}
                  </div>
                  <div class="flex items-center gap-2 mb-1">
                    <Rating 
                      :model-value="data.rating" 
                      readonly 
                      :stars="5"
                      size="small"
                    />
                    <span class="text-xs text-gray-500">
                      ({{ data.downloads.toLocaleString() }} 下载)
                    </span>
                  </div>
                  <div v-if="data.features" class="flex flex-wrap gap-1 mt-1">
                    <Tag
                      v-for="(feature, index) in data.features.slice(0, 2)"
                      :key="index"
                      :value="feature"
                      severity="info"
                      size="small"
                      rounded
                      class="text-xs"
                    />
                    <Tag
                      v-if="data.features.length > 2"
                      :value="`+${data.features.length - 2}更多`"
                      severity="secondary"
                      size="small"
                      rounded
                      class="text-xs"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column 
            field="version" 
            header="版本" 
            sortable 
            style="width: 120px"
          >
            <template #body="{ data }">
              <Tag 
                :value="data.version" 
                severity="info" 
                rounded 
              />
            </template>
          </Column>

          <Column 
            field="author" 
            header="作者" 
            sortable 
            style="width: 150px"
          >
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Avatar 
                  :image="data.author.avatar"
                  :label="data.author.name.charAt(0)" 
                  size="small" 
                  shape="circle"
                />
                <span class="text-gray-700 dark:text-gray-300 text-sm">
                  {{ data.author.name }}
                </span>
              </div>
            </template>
          </Column>

          <Column 
            field="category" 
            header="分类" 
            sortable 
            style="width: 120px"
          >
            <template #body="{ data }">
              <Tag 
                :value="data.category" 
                :severity="getCategorySeverity(data.category)"
                rounded 
              />
            </template>
          </Column>

          <Column 
            field="size" 
            header="大小" 
            sortable 
            style="width: 100px"
          >
            <template #body="{ data }">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatFileSize(data.size) }}
              </span>
            </template>
          </Column>

          <Column 
            header="操作" 
            style="width: 200px"
          >
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  v-if="!isInstalled(data.id)"
                  icon="pi pi-download"
                  label="安装"
                  size="small"
                  severity="success"
                  @click="installPlugin(data)"
                />
                <Button
                  v-else
                  icon="pi pi-check"
                  label="已安装"
                  size="small"
                  severity="secondary"
                  disabled
                />
                <Button
                  :icon="isFavorite(data.id) ? 'pi pi-heart-fill' : 'pi pi-heart'"
                  size="small"
                  severity="danger"
                  text
                  v-tooltip="isFavorite(data.id) ? '取消收藏' : '收藏'"
                  @click="toggleFavorite(data)"
                />
                <Button
                  icon="pi pi-eye"
                  size="small"
                  severity="info"
                  text
                  v-tooltip="'查看详情'"
                  @click="viewPluginDetails(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- 筛选模态框 -->
      <Dialog
        v-model:visible="showFilterModal"
        header="筛选插件"
        :style="{ width: '500px' }"
        modal
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">分类</label>
            <MultiSelect
              v-model="selectedCategories"
              :options="categories"
              option-label="label"
              option-value="value"
              placeholder="选择分类"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">评分</label>
            <Slider
              v-model="minRating"
              :min="0"
              :max="5"
              :step="0.5"
            />
            <div class="text-sm text-gray-500 mt-1">
              最低评分: {{ minRating }} 星
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button 
              label="重置" 
              severity="secondary" 
              @click="resetFilters" 
            />
            <Button 
              label="应用" 
              @click="applyFilters" 
            />
          </div>
        </template>
      </Dialog>

      <!-- 提交插件模态框 -->
      <Dialog
        v-model:visible="showSubmitModal"
        header="提交插件"
        :style="{ width: '600px' }"
        modal
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">插件名称</label>
            <InputText
              v-model="submitForm.name"
              placeholder="输入插件名称"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">插件描述</label>
            <Textarea
              v-model="submitForm.description"
              placeholder="描述插件功能"
              class="w-full"
              rows="3"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">插件包</label>
            <InputText
              v-model="submitForm.packagePath"
              placeholder="插件包路径或URL"
              class="w-full"
            />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button 
              label="取消" 
              severity="secondary" 
              @click="showSubmitModal = false" 
            />
            <Button 
              label="提交" 
              @click="submitPlugin" 
            />
          </div>
        </template>
      </Dialog>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Container from '@/components/layout/Container.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dialog from 'primevue/dialog'
import Avatar from 'primevue/avatar'
import ProgressSpinner from 'primevue/progressspinner'
import Rating from 'primevue/rating'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Slider from 'primevue/slider'
import Textarea from 'primevue/textarea'
import { usePluginStore } from '@/stores/plugin'
import { useToast } from 'primevue/usetoast'

// Store 和工具
const pluginStore = usePluginStore()
const toast = useToast()

// 响应式数据
const searchQuery = ref('')
const showFilterModal = ref(false)
const showSubmitModal = ref(false)
const showFavorites = ref(false)
const isLoading = ref(false)
const sortBy = ref('popularity')

// 筛选条件
const selectedCategories = ref<string[]>([])
const minRating = ref(0)

// 提交表单
const submitForm = ref({
  name: '',
  description: '',
  packagePath: '',
})

// 排序选项
const sortOptions = ref([
  { label: '热门度', value: 'popularity' },
  { label: '评分', value: 'rating' },
  { label: '下载量', value: 'downloads' },
  { label: '更新时间', value: 'updated' },
  { label: '名称', value: 'name' },
])

// 分类选项
const categories = ref([
  { label: '生产力', value: 'productivity' },
  { label: '开发工具', value: 'development' },
  { label: '娱乐', value: 'entertainment' },
  { label: '系统工具', value: 'system' },
  { label: '网络', value: 'network' },
  { label: '设计', value: 'design' },
])

// 模拟商城插件数据
const storePlugins = ref([
  {
    id: 'demo-plugin',
    name: '插件示例',
    description: '展示 Mira Launcher 插件系统各项能力的综合示例，包含网格组件、页面系统、主题切换、存储管理等完整功能演示',
    version: '1.0.0',
    author: { name: 'Mira Team', avatar: '' },
    category: 'development',
    rating: 5.0,
    downloads: 25680,
    size: 512000,
    verified: true,
    icon: '',
    featured: true,
    tags: ['示例', '教程', '开发', 'API演示'],
    lastUpdate: '2025-08-14',
    compatibility: ['mira >= 1.0.0'],
    features: [
      '🎛️ 交互式网格组件',
      '📱 专属演示页面',
      '🎨 自定义主题系统',
      '💾 数据存储演示',
      '📢 通知系统集成',
      '⌨️ 快捷键支持',
      '📊 实时统计监控',
      '🔧 完整 API 演示'
    ]
  },
  {
    id: 'store-plugin-1',
    name: 'Quick Notes',
    description: '快速记录笔记和想法的轻量级工具',
    version: '1.2.0',
    author: { name: 'NotesDev', avatar: '' },
    category: 'productivity',
    rating: 4.5,
    downloads: 15420,
    size: 2048000,
    verified: true,
    icon: '',
    lastUpdate: '2025-08-10',
    features: [
      '📝 快速笔记创建',
      '🔍 全文搜索',
      '📂 分类管理',
      '☁️ 云端同步'
    ]
  },
  {
    id: 'store-plugin-2',
    name: 'Code Formatter',
    description: '强大的代码格式化和美化工具',
    version: '2.1.0',
    author: { name: 'CodeTools Inc', avatar: '' },
    category: 'development',
    rating: 4.8,
    downloads: 8932,
    size: 1536000,
    verified: false,
    icon: '',
    lastUpdate: '2025-08-08',
    features: [
      '🎨 多语言支持',
      '⚙️ 自定义规则',
      '🔧 实时格式化',
      '📋 批量处理'
    ]
  },
  {
    id: 'weather-widget',
    name: '天气小组件',
    description: '精美的天气显示组件，支持多城市和详细预报',
    version: '1.5.2',
    author: { name: 'WeatherApp', avatar: '' },
    category: 'productivity',
    rating: 4.3,
    downloads: 12560,
    size: 1024000,
    verified: true,
    icon: '',
    lastUpdate: '2025-08-12',
    features: [
      '🌤️ 实时天气',
      '🌍 多城市支持',
      '📈 7天预报',
      '🎨 自定义主题'
    ]
  },
  {
    id: 'system-monitor',
    name: '系统监控',
    description: '实时监控系统性能和资源使用情况',
    version: '2.0.1',
    author: { name: 'SysTools', avatar: '' },
    category: 'system',
    rating: 4.6,
    downloads: 7834,
    size: 896000,
    verified: true,
    icon: '',
    lastUpdate: '2025-08-09',
    features: [
      '📊 性能监控',
      '💾 内存使用',
      '🔥 CPU温度',
      '📱 移动端适配'
    ]
  },
  {
    id: 'music-player',
    name: '音乐播放器',
    description: '简洁优雅的本地音乐播放器组件',
    version: '1.8.0',
    author: { name: 'MusicLab', avatar: '' },
    category: 'entertainment',
    rating: 4.7,
    downloads: 18790,
    size: 3072000,
    verified: false,
    icon: '',
    lastUpdate: '2025-08-11',
    features: [
      '🎵 本地播放',
      '🎼 播放列表',
      '🔊 音效增强',
      '📻 在线电台'
    ]
  },
  {
    id: 'task-manager',
    name: '任务管理器',
    description: '强大的个人任务和项目管理工具',
    version: '3.2.1',
    author: { name: 'ProductivityHub', avatar: '' },
    category: 'productivity',
    rating: 4.9,
    downloads: 22150,
    size: 2560000,
    verified: true,
    icon: '',
    lastUpdate: '2025-08-13',
    features: [
      '✅ 任务管理',
      '📅 日程安排',
      '👥 团队协作',
      '📈 进度追踪'
    ]
  },
  {
    id: 'color-picker',
    name: '取色器工具',
    description: '专业的颜色选择和管理工具',
    version: '1.4.3',
    author: { name: 'DesignTools', avatar: '' },
    category: 'design',
    rating: 4.4,
    downloads: 5432,
    size: 768000,
    verified: false,
    icon: '',
    lastUpdate: '2025-08-07',
    features: [
      '🎨 精确取色',
      '📋 调色板',
      '🔄 格式转换',
      '💾 颜色历史'
    ]
  }
])

// 收藏列表
const favorites = ref(new Set())

// 计算属性
const totalPlugins = computed(() => storePlugins.value.length)
const installedCount = computed(() => 
  storePlugins.value.filter(p => isInstalled(p.id)).length
)
const storeStatus = computed(() => '在线')

const filteredStorePlugins = computed(() => {
  let filtered = storePlugins.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(plugin =>
      plugin.name.toLowerCase().includes(query) ||
      plugin.description.toLowerCase().includes(query) ||
      plugin.author.name.toLowerCase().includes(query),
    )
  }

  // 分类过滤
  if (selectedCategories.value.length > 0) {
    filtered = filtered.filter(plugin =>
      selectedCategories.value.includes(plugin.category),
    )
  }

  // 评分过滤
  filtered = filtered.filter(plugin => plugin.rating >= minRating.value)

  // 收藏过滤
  if (showFavorites.value) {
    filtered = filtered.filter(plugin => favorites.value.has(plugin.id))
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'rating':
        return b.rating - a.rating
      case 'downloads':
        return b.downloads - a.downloads
      case 'name':
        return a.name.localeCompare(b.name)
      case 'popularity':
      default:
        return b.downloads - a.downloads
    }
  })

  return filtered
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

const getCategorySeverity = (category: string): string => {
  const severityMap: Record<string, string> = {
    'productivity': 'success',
    'development': 'info',
    'entertainment': 'warn',
    'system': 'danger',
    'network': 'secondary',
    'design': 'contrast',
  }
  return severityMap[category] || 'secondary'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const isInstalled = (pluginId: string): boolean => {
  return pluginStore.plugins.some(p => p.metadata.id === pluginId)
}

const isFavorite = (pluginId: string): boolean => {
  return favorites.value.has(pluginId)
}

// 功能方法
const refreshStore = async () => {
  isLoading.value = true
  try {
    // 模拟刷新商城数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.add({
      severity: 'success',
      summary: '成功',
      detail: '商城数据已刷新',
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: '刷新失败',
      life: 3000,
    })
  } finally {
    isLoading.value = false
  }
}

const installPlugin = async (plugin: any) => {
  try {
    // 模拟安装过程
    toast.add({
      severity: 'info',
      summary: '开始安装',
      detail: `正在安装 ${plugin.name}...`,
      life: 3000,
    })
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    toast.add({
      severity: 'success',
      summary: '安装成功',
      detail: `${plugin.name} 已安装完成`,
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '安装失败',
      detail: `${plugin.name} 安装失败`,
      life: 3000,
    })
  }
}

const toggleFavorite = (plugin: any) => {
  if (favorites.value.has(plugin.id)) {
    favorites.value.delete(plugin.id)
    toast.add({
      severity: 'info',
      summary: '已取消收藏',
      detail: plugin.name,
      life: 2000,
    })
  } else {
    favorites.value.add(plugin.id)
    toast.add({
      severity: 'success',
      summary: '已收藏',
      detail: plugin.name,
      life: 2000,
    })
  }
}

const viewPluginDetails = (plugin: any) => {
  console.log('查看插件详情:', plugin.name)
  // TODO: 实现插件详情页面
}

const resetFilters = () => {
  selectedCategories.value = []
  minRating.value = 0
}

const applyFilters = () => {
  showFilterModal.value = false
  toast.add({
    severity: 'info',
    summary: '筛选已应用',
    detail: `找到 ${filteredStorePlugins.value.length} 个插件`,
    life: 3000,
  })
}

const submitPlugin = async () => {
  if (!submitForm.value.name || !submitForm.value.description) {
    toast.add({
      severity: 'warn',
      summary: '请填写完整信息',
      detail: '插件名称和描述是必填项',
      life: 3000,
    })
    return
  }

  try {
    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.add({
      severity: 'success',
      summary: '提交成功',
      detail: '插件已提交审核，我们会尽快处理',
      life: 3000,
    })
    
    showSubmitModal.value = false
    submitForm.value = { name: '', description: '', packagePath: '' }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '提交失败',
      detail: '请稍后重试',
      life: 3000,
    })
  }
}

onMounted(() => {
  document.title = 'Mira Launcher - 插件商城'
})
</script>

<style scoped>
.plugin-store-page {
  height: 100vh;
  padding: 1rem;
  background-color: #f8fafc;
  overflow: hidden;
}

.dark .plugin-store-page {
  background-color: #0f172a;
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

/* PrimeVue 组件样式重写 */
:deep(.p-toolbar) {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.dark :deep(.p-toolbar) {
  background: #1e293b;
  border-color: #374151;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
