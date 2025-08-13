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
import { ref, computed, onMounted } from 'vue'

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
const installPath = ref('')

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
    }
  }
}

const refreshPlugins = () => {
  console.log('刷新插件列表')
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
}

onMounted(() => {
  document.title = 'Mira Launcher - 插件管理'
})
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
</style>
