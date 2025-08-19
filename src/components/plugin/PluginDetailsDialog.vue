<template>
  <Dialog
    v-model:visible="visibleProxy"
    :header="plugin?.metadata.name || '插件详情'"
    :style="{ width: '700px' }"
    modal
    :closable="true"
    @update:visible="$emit('update:show', $event)"
  >
    <div v-if="plugin" class="plugin-details-dialog">
      <!-- 插件头部信息 -->
      <div class="plugin-header flex items-start gap-4 mb-6 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
        <Avatar
          :label="plugin.metadata.name.charAt(0).toUpperCase()"
          shape="circle"
          size="xlarge"
          :style="{
            backgroundColor: getPluginColor(plugin.metadata.id),
            color: 'white',
            fontSize: '2rem',
          }"
        />
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {{ plugin.metadata.name }}
            </h2>
            <Tag
              :value="`v${plugin.metadata.version}`"
              severity="info"
              rounded
            />
            <Tag
              :value="plugin.state === 'active' ? '已启用' : '已禁用'"
              :severity="plugin.state === 'active' ? 'success' : 'secondary'"
              rounded
            />
          </div>
          <p class="text-gray-600 dark:text-gray-300 mb-2">
            {{ plugin.metadata.description }}
          </p>
          <div class="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              <i class="pi pi-user mr-1" />
              {{ plugin.metadata.author }}
            </span>
            <span v-if="plugin.metadata.homepage">
              <i class="pi pi-external-link mr-1" />
              <a
                :href="plugin.metadata.homepage"
                target="_blank"
                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                官网
              </a>
            </span>
            <span v-if="plugin.metadata.repository">
              <i class="pi pi-github mr-1" />
              <a
                :href="plugin.metadata.repository"
                target="_blank"
                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                源码
              </a>
            </span>
          </div>
        </div>
      </div>

      <!-- 详细信息标签页 -->
      <TabView>
        <!-- 基本信息 -->
        <TabPanel header="基本信息" value="basic">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="info-item">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                插件ID
              </label>
              <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded border text-sm font-mono">
                {{ plugin.metadata.id }}
              </div>
            </div>
            
            <div class="info-item">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                版本
              </label>
              <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded border text-sm">
                {{ plugin.metadata.version }}
              </div>
            </div>
            
            <div class="info-item">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                作者
              </label>
              <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded border text-sm">
                {{ plugin.metadata.author }}
              </div>
            </div>
            
            <div class="info-item">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                状态
              </label>
              <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded border text-sm">
                <Tag
                  :value="plugin.state === 'active' ? '已启用' : '已禁用'"
                  :severity="plugin.state === 'active' ? 'success' : 'secondary'"
                  rounded
                />
              </div>
            </div>
            
            <div v-if="plugin.metadata.license" class="info-item">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                许可证
              </label>
              <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded border text-sm">
                {{ plugin.metadata.license }}
              </div>
            </div>
            
            <div class="info-item">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                入口文件
              </label>
              <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded border text-sm font-mono">
                {{ plugin.metadata.main }}
              </div>
            </div>
          </div>
          
          <div v-if="plugin.metadata.keywords && plugin.metadata.keywords.length > 0" class="mt-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标签
            </label>
            <div class="flex flex-wrap gap-2">
              <Tag
                v-for="keyword in plugin.metadata.keywords"
                :key="keyword"
                :value="keyword"
                severity="secondary"
                rounded
              />
            </div>
          </div>
        </TabPanel>

        <!-- 依赖信息 -->
        <TabPanel header="依赖信息" value="dependencies">
          <div class="space-y-4">
            <div v-if="plugin.dependencies && plugin.dependencies.length > 0">
              <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-3">
                插件依赖
              </h3>
              <div class="space-y-2">
                <div
                  v-for="dep in plugin.dependencies"
                  :key="dep"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border"
                >
                  <span class="font-mono text-sm">{{ dep }}</span>
                  <Tag value="依赖" severity="info" />
                </div>
              </div>
            </div>
            
            <div v-if="plugin.dependents && plugin.dependents.length > 0">
              <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-3">
                被依赖关系
              </h3>
              <div class="space-y-2">
                <div
                  v-for="dependent in plugin.dependents"
                  :key="dependent"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border"
                >
                  <span class="font-mono text-sm">{{ dependent }}</span>
                  <Tag value="被依赖" severity="warning" />
                </div>
              </div>
            </div>
            
            <div v-if="(!plugin.dependencies || plugin.dependencies.length === 0) && (!plugin.dependents || plugin.dependents.length === 0)">
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-info-circle text-4xl mb-4" />
                <p>
                  此插件没有声明依赖关系
                </p>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- 配置信息 -->
        <TabPanel header="配置信息" value="config">
          <div class="space-y-4">
            <div v-if="configLoading" class="text-center py-8">
              <ProgressSpinner style="width: 50px; height: 50px" stroke-width="8" />
              <p class="text-gray-500 mt-4">
                加载配置信息...
              </p>
            </div>
            
            <div v-else-if="configError" class="text-center py-8 text-red-500">
              <i class="pi pi-exclamation-triangle text-4xl mb-4" />
              <p>{{ configError }}</p>
              <Button
                label="重试"
                severity="secondary"
                class="mt-3"
                @click="loadConfigInfo"
              />
            </div>
            
            <div v-else>
              <div v-if="!configSchema || Object.keys(configSchema).length === 0" class="text-center py-8">
                <i class="pi pi-info-circle text-4xl text-gray-400 mb-4" />
                <p class="text-gray-500">
                  此插件暂无可配置项
                </p>
              </div>
              
              <div v-else class="space-y-4">
                <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  可配置项
                </h3>
                <div
                  v-for="(schema, key) in configSchema"
                  :key="key"
                  class="p-4 bg-gray-50 dark:bg-gray-800 rounded border"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h4 class="font-medium text-gray-900 dark:text-gray-100">
                        {{ schema.label || key }}
                        <span v-if="schema.required" class="text-red-500 ml-1">*</span>
                      </h4>
                      <p v-if="schema.description" class="text-sm text-gray-600 dark:text-gray-400">
                        {{ schema.description }}
                      </p>
                    </div>
                    <Tag :value="schema.type" severity="info" />
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div v-if="schema.placeholder">
                      <span class="font-medium text-gray-700 dark:text-gray-300">占位符:</span>
                      <span class="ml-2 text-gray-600 dark:text-gray-400">{{ schema.placeholder }}</span>
                    </div>
                    <div v-if="schema.min !== undefined">
                      <span class="font-medium text-gray-700 dark:text-gray-300">最小值:</span>
                      <span class="ml-2 text-gray-600 dark:text-gray-400">{{ schema.min }}</span>
                    </div>
                    <div v-if="schema.max !== undefined">
                      <span class="font-medium text-gray-700 dark:text-gray-300">最大值:</span>
                      <span class="ml-2 text-gray-600 dark:text-gray-400">{{ schema.max }}</span>
                    </div>
                  </div>
                  
                  <div v-if="schema.options && schema.options.length > 0" class="mt-3">
                    <span class="font-medium text-gray-700 dark:text-gray-300 mb-2 block">可选项:</span>
                    <div class="flex flex-wrap gap-2">
                      <Tag
                        v-for="(option, index) in schema.options"
                        :key="`${option.value}-${index}`"
                        :value="option.label"
                        severity="secondary"
                        rounded
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- 运行时信息 -->
        <TabPanel header="运行时信息" value="runtime">
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="info-item">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  插件目录
                </label>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded border text-sm font-mono break-all">
                  插件目录信息暂不可用
                </div>
              </div>
              
              <div class="info-item">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  加载状态
                </label>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded border text-sm">
                  <Tag
                    :value="plugin.loadedAt ? '已加载' : '未加载'"
                    :severity="plugin.loadedAt ? 'success' : 'warning'"
                    rounded
                  />
                </div>
              </div>
            </div>
            
            <div v-if="plugin.error" class="mt-4">
              <label class="block text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                错误信息
              </label>
              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded text-sm text-red-800 dark:text-red-400 font-mono">
                {{ plugin.error }}
              </div>
            </div>
            
            <div v-if="plugin.instance && plugin.instance.methods" class="mt-4">
              <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-3">
                暴露的方法
              </h3>
              <div class="space-y-2">
                <div
                  v-for="method in plugin.instance.methods"
                  :key="method"
                  class="p-3 bg-gray-50 dark:bg-gray-800 rounded border"
                >
                  <span class="font-mono text-sm">{{ method }}()</span>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>
    
    <template #footer>
      <div class="flex justify-between">
        <div>
          <Button
            v-if="plugin"
            :label="plugin.state === 'active' ? '禁用插件' : '启用插件'"
            :severity="plugin.state === 'active' ? 'danger' : 'success'"
            outlined
            @click="$emit('toggle-plugin', plugin)"
          />
        </div>
        <div class="flex gap-2">
          <Button
            v-if="plugin"
            label="配置插件"
            severity="secondary"
            outlined
            @click="$emit('configure-plugin', plugin)"
          />
          <Button
            label="关闭"
            @click="$emit('update:show', false)"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import Dialog from '@/components/common/Dialog.vue'
import type { PluginRegistryEntry } from '@/types/plugin'
import Avatar from 'primevue/avatar'
import ProgressSpinner from 'primevue/progressspinner'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import Tag from 'primevue/tag'
import { computed, ref, watch } from 'vue'

interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'select' | 'textarea'
    label?: string
    description?: string
    placeholder?: string
    required?: boolean
    min?: number
    max?: number
    rows?: number
    options?: Array<{ label: string; value: string | number | boolean }>
    optionLabel?: string
    optionValue?: string
  }
}

interface Props {
  show: boolean
  plugin: PluginRegistryEntry | null
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'toggle-plugin', plugin: PluginRegistryEntry): void
  (e: 'configure-plugin', plugin: PluginRegistryEntry): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const configLoading = ref(false)
const configError = ref('')
const configSchema = ref<ConfigSchema>({})

// 计算属性
const visibleProxy = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

// 生成插件颜色的函数
const getPluginColor = (pluginId: string): string => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
  ]
  let hash = 0
  for (let i = 0; i < pluginId.length; i++) {
    hash = pluginId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length] || '#3B82F6'
}

// 加载配置信息
const loadConfigInfo = async () => {
  if (!props.plugin) return
  
  configLoading.value = true
  configError.value = ''
  
  try {
    const response = await fetch(`/plugins/${props.plugin.metadata.id}/config-schema.json`)
    
    if (response.ok) {
      const schema = await response.json()
      configSchema.value = schema
    } else {
      configSchema.value = {}
    }
  } catch (error) {
    console.error('Failed to load config schema:', error)
    configError.value = '加载配置信息失败'
  } finally {
    configLoading.value = false
  }
}

// 监听插件变化，重新加载配置信息
watch(() => props.plugin, (newPlugin) => {
  if (newPlugin && props.show) {
    loadConfigInfo()
  }
}, { immediate: true })

watch(() => props.show, (show) => {
  if (show && props.plugin) {
    loadConfigInfo()
  }
})
</script>

<style scoped>
.plugin-details-dialog {
  max-height: 70vh;
  overflow-y: auto;
}

.info-item {
  margin-bottom: 1rem;
}
</style>
