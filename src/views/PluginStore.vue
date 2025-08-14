<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <div class="plugin-store-page flex flex-col h-screen">
    <Container class="max-w-7xl mx-auto flex-1 flex flex-col overflow-hidden">
      <!-- 工具栏 -->
      <Toolbar class="mb-6">
        <template #start>
          <div class="flex gap-2">
            <Button
              v-tooltip="'刷新商城'"
              icon="pi pi-refresh"
              text
              @click="refreshStore"
            />
            <Button
              v-tooltip="'筛选'"
              icon="pi pi-filter"
              severity="info"
              text
              @click="showFilterModal = true"
            />
            <Button
              v-tooltip="'我的收藏'"
              icon="pi pi-heart"
              severity="danger"
              text
              @click="showFavorites = !showFavorites"
            />
            <Button
              v-tooltip="'提交插件'"
              icon="pi pi-upload"
              severity="success"
              text
              @click="showSubmitModal = true"
            />
          </div>
        </template>
        <template #end>
          <div class="flex gap-2">
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
          class="plugin-table"
          striped-rows
          table-style="min-width: 80rem"
          :scrollable="true"
          scroll-height="flex"
        >
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
            header="插件" 
            sortable 
            style="width: 280px"
            frozen
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
                      v-tooltip="'官方认证'"
                      class="pi pi-verified text-blue-500"
                    />
                    <Tag
                      v-if="data.featured"
                      value="精选"
                      severity="success"
                      size="small"
                      rounded
                    />
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {{ data.description }}
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column 
            field="version" 
            header="版本" 
            sortable 
            style="width: 100px"
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
            style="width: 120px"
          >
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Avatar 
                  :image="data.author.avatar"
                  :label="data.author.name.charAt(0)" 
                  size="small" 
                  shape="circle"
                />
                <span class="text-gray-700 dark:text-gray-300 text-sm truncate">
                  {{ data.author.name }}
                </span>
              </div>
            </template>
          </Column>

          <Column 
            field="category" 
            header="分类" 
            sortable 
            style="width: 100px"
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
            field="rating" 
            header="评分" 
            sortable 
            style="width: 120px"
          >
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Rating 
                  :model-value="data.rating" 
                  readonly 
                  :stars="5"
                  size="small"
                />
                <span class="text-xs text-gray-500">
                  {{ data.rating }}
                </span>
              </div>
            </template>
          </Column>

          <Column 
            field="downloads" 
            header="下载量" 
            sortable 
            style="width: 100px"
          >
            <template #body="{ data }">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ data.downloads.toLocaleString() }}
              </span>
            </template>
          </Column>

          <Column 
            field="size" 
            header="大小" 
            sortable 
            style="width: 80px"
          >
            <template #body="{ data }">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatFileSize(data.size) }}
              </span>
            </template>
          </Column>

          <Column 
            field="lastUpdate" 
            header="更新时间" 
            sortable 
            style="width: 100px"
          >
            <template #body="{ data }">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ data.lastUpdate }}
              </span>
            </template>
          </Column>

          <Column 
            field="features" 
            header="特性" 
            style="width: 200px"
          >
            <template #body="{ data }">
              <div
                v-if="data.features"
                class="flex flex-wrap gap-1"
              >
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
            </template>
          </Column>

          <Column 
            header="操作" 
            style="width: 180px"
            frozen
            align-frozen="right"
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
                  v-tooltip="isFavorite(data.id) ? '取消收藏' : '收藏'"
                  :icon="isFavorite(data.id) ? 'pi pi-heart-fill' : 'pi pi-heart'"
                  size="small"
                  severity="danger"
                  text
                  @click="toggleFavorite(data)"
                />
                <Button
                  v-tooltip="'查看详情'"
                  icon="pi pi-eye"
                  size="small"
                  severity="info"
                  text
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
              :rows="3"
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
import { computed, onMounted, ref, watch } from 'vue'
import {
  Button,
  DataTable,
  Column,
  Toolbar,
  Tag,
  Input as InputText,
  IconField,
  InputIcon,
  Dialog,
  Avatar,
  ProgressSpinner,
  Rating,
  MultiSelect,
  Slider,
  Textarea,
} from '@/components/common'
import Container from '@/components/layout/Container.vue'
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

// 分类选项
const categories = ref([
  { label: '生产力', value: 'productivity' },
  { label: '开发工具', value: 'development' },
  { label: '娱乐', value: 'entertainment' },
  { label: '系统工具', value: 'system' },
  { label: '网络', value: 'network' },
  { label: '设计', value: 'design' },
])

// API 基础URL
const API_BASE = 'http://localhost:3001/api'

// 服务器数据
const storePlugins = ref([])
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 20,
})

// 收藏列表
const favorites = ref(new Set())

// 计算属性
const filteredStorePlugins = computed(() => {
  return storePlugins.value
})

// API 调用函数
const fetchPlugins = async () => {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    
    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }
    
    if (selectedCategories.value.length > 0) {
      selectedCategories.value.forEach(category => {
        params.append('category', category)
      })
    }
    
    if (minRating.value > 0) {
      params.append('minRating', minRating.value.toString())
    }
    
    if (showFavorites.value) {
      // 客户端筛选收藏
    }
    
    params.append('sort', sortBy.value)
    params.append('page', '1')
    params.append('limit', '100')
    
    const response = await fetch(`${API_BASE}/plugins?${params.toString()}`)
    const result = await response.json()
    
    if (result.success) {
      storePlugins.value = result.data
      pagination.value = result.pagination
    } else {
      toast.add({
        severity: 'error',
        summary: '获取失败',
        detail: result.message || '获取插件列表失败',
        life: 3000,
      })
    }
  } catch (error) {
    console.error('获取插件列表失败:', error)
    toast.add({
      severity: 'error',
      summary: '网络错误',
      detail: '无法连接到插件服务器',
      life: 3000,
    })
  } finally {
    isLoading.value = false
  }
}

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

const getCategorySeverity = (category: string): 'secondary' | 'success' | 'info' | 'warning' | 'warn' | 'danger' | 'contrast' => {
  const severityMap: Record<string, 'secondary' | 'success' | 'info' | 'warning' | 'warn' | 'danger' | 'contrast'> = {
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
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const isInstalled = (pluginId: string): boolean => {
  return pluginStore.plugins.some(p => p.metadata.id === pluginId)
}

const isFavorite = (pluginId: string): boolean => {
  return favorites.value.has(pluginId)
}

// 功能方法
const refreshStore = async () => {
  await fetchPlugins()
  toast.add({
    severity: 'success',
    summary: '成功',
    detail: '商城数据已刷新',
    life: 3000,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const installPlugin = async (plugin: any) => {
  try {
    // 模拟安装过程
    toast.add({
      severity: 'info',
      summary: '开始安装',
      detail: `正在安装 ${plugin.name}...`,
      life: 3000,
    })
    
    // 下载插件
    const response = await fetch(`${API_BASE}/plugins/${plugin.id}/download`)
    if (!response.ok) {
      throw new Error('下载失败')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${plugin.id}-${plugin.version}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.add({
      severity: 'success',
      summary: '下载成功',
      detail: `${plugin.name} 已下载完成`,
      life: 3000,
    })
  } catch (error) {
    console.error('安装失败:', error)
    toast.add({
      severity: 'error',
      summary: '安装失败',
      detail: `${plugin.name} 安装失败`,
      life: 3000,
    })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const viewPluginDetails = (plugin: any) => {
  console.log('查看插件详情:', plugin.name)
  // TODO: 实现插件详情页面
}

const resetFilters = () => {
  selectedCategories.value = []
  minRating.value = 0
}

const applyFilters = async () => {
  showFilterModal.value = false
  await fetchPlugins()
  toast.add({
    severity: 'info',
    summary: '筛选已应用',
    detail: `找到 ${storePlugins.value.length} 个插件`,
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

onMounted(async () => {
  document.title = 'Mira Launcher - 插件商城'
  await fetchPlugins()
})

// 搜索防抖
let searchTimeout: number | null = null
watch(searchQuery, (_newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(async () => {
    await fetchPlugins()
  }, 500)
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
  transition: all 0.2s ease;
}

.dark :deep(.p-toolbar) {
  background: #1e293b;
  border-color: #374151;
  color: #f9fafb;
}

.dark :deep(.p-toolbar .p-button) {
  color: #d1d5db;
}

.dark :deep(.p-toolbar .p-button:hover) {
  background: #374151;
  border-color: #4b5563;
}

.dark :deep(.p-toolbar .p-inputtext) {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark :deep(.p-toolbar .p-inputtext:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.dark :deep(.p-toolbar .p-dropdown) {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark :deep(.p-toolbar .p-dropdown:hover) {
  border-color: #6b7280;
}

.dark :deep(.p-toolbar .p-dropdown .p-dropdown-label) {
  color: #f9fafb;
}

.dark :deep(.p-tag) {
  background: #374151;
  color: #d1d5db;
}

.dark :deep(.p-dialog) {
  background: #1e293b;
  color: #f9fafb;
}

.dark :deep(.p-dialog .p-dialog-header) {
  background: #1e293b;
  border-color: #374151;
  color: #f9fafb;
}

.dark :deep(.p-dialog .p-dialog-content) {
  background: #1e293b;
  color: #f9fafb;
}

.dark :deep(.p-dialog .p-inputtext) {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark :deep(.p-dialog .p-multiselect) {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark :deep(.p-dialog .p-slider) {
  background: #4b5563;
}

.dark :deep(.p-dialog .p-slider .p-slider-handle) {
  background: #3b82f6;
  border-color: #3b82f6;
}

.dark :deep(.p-dialog .p-textarea) {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
