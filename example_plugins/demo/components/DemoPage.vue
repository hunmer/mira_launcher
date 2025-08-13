<template>
  <div class="demo-page">
    <div class="page-header">
      <h1 class="page-title">
        插件演示页面
      </h1>
      <p class="page-subtitle">
        展示 Mira Launcher 插件系统的各项功能和能力
      </p>
    </div>

    <div class="demo-sections">
      <!-- API 功能演示 -->
      <section class="demo-section">
        <h2 class="section-title">
          API 功能演示
        </h2>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <i class="pi pi-bell" />
            </div>
            <h3>通知系统</h3>
            <p>演示各种类型的通知消息</p>
            <button 
              class="demo-button"
              @click="demonstrateNotifications"
            >
              测试通知
            </button>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <i class="pi pi-database" />
            </div>
            <h3>存储系统</h3>
            <p>展示插件数据存储和监听功能</p>
            <button 
              class="demo-button"
              @click="demonstrateStorage"
            >
              测试存储
            </button>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <i class="pi pi-palette" />
            </div>
            <h3>主题系统</h3>
            <p>切换和自定义主题样式</p>
            <button 
              class="demo-button"
              @click="toggleTheme"
            >
              切换主题
            </button>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <i class="pi pi-keyboard" />
            </div>
            <h3>快捷键</h3>
            <p>注册和管理自定义快捷键</p>
            <div class="shortcut-list">
              <span class="shortcut-item">Ctrl+Shift+D</span>
              <span class="shortcut-item">Ctrl+Alt+W</span>
              <span class="shortcut-item">Ctrl+Alt+N</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 组件演示 -->
      <section class="demo-section">
        <h2 class="section-title">
          组件系统
        </h2>
        <div class="component-demo">
          <div class="demo-widget-preview">
            <h3>演示组件预览</h3>
            <div class="widget-container">
              <DemoWidget 
                :data="{
                  title: '预览组件',
                  content: '这是一个组件预览',
                  color: '#3B82F6',
                  counter: 999
                }"
              />
            </div>
          </div>
          
          <div class="component-actions">
            <button 
              class="demo-button primary"
              @click="addWidget"
            >
              <i class="pi pi-plus" />
              添加到网格
            </button>
            <button 
              class="demo-button secondary"
              @click="showComponentInfo"
            >
              <i class="pi pi-info-circle" />
              组件信息
            </button>
          </div>
        </div>
      </section>

      <!-- 统计信息 -->
      <section class="demo-section">
        <h2 class="section-title">
          插件统计
        </h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="pi pi-box" />
            </div>
            <div class="stat-content">
              <h3>{{ stats.widgetsCreated }}</h3>
              <p>创建的组件</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="pi pi-clock" />
            </div>
            <div class="stat-content">
              <h3>{{ formatUptime(stats.uptime) }}</h3>
              <p>运行时间</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="pi pi-chart-line" />
            </div>
            <div class="stat-content">
              <h3>{{ stats.interactions }}</h3>
              <p>交互次数</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="pi pi-save" />
            </div>
            <div class="stat-content">
              <h3>{{ stats.storageSize }}</h3>
              <p>存储使用</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 插件信息 -->
      <section class="demo-section">
        <h2 class="section-title">
          插件信息
        </h2>
        <div class="plugin-info-card">
          <div class="plugin-meta">
            <div class="plugin-header">
              <div class="plugin-icon">
                <i class="pi pi-star" />
              </div>
              <div class="plugin-details">
                <h3>{{ pluginInfo.name }}</h3>
                <p>{{ pluginInfo.description }}</p>
                <div class="plugin-tags">
                  <span 
                    v-for="tag in pluginInfo.keywords"
                    :key="tag"
                    class="plugin-tag"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="plugin-version">
              <span class="version-badge">
                v{{ pluginInfo.version }}
              </span>
            </div>
          </div>
          
          <div class="plugin-capabilities">
            <h4>功能权限</h4>
            <div class="permissions-list">
              <span 
                v-for="permission in pluginInfo.permissions"
                :key="permission"
                class="permission-item"
              >
                <i class="pi pi-check-circle" />
                {{ permission }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 页面操作 -->
    <div class="page-actions">
      <button 
        class="action-button refresh"
        @click="refreshStats"
      >
        <i class="pi pi-refresh" />
        刷新统计
      </button>
      <button 
        class="action-button export"
        @click="exportData"
      >
        <i class="pi pi-download" />
        导出数据
      </button>
      <button 
        class="action-button reset"
        @click="resetPlugin"
      >
        <i class="pi pi-times" />
        重置插件
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, onMounted, onUnmounted } from 'vue'
import DemoWidget from './DemoWidget.vue'

// 注入插件 API
const pluginApi = inject('pluginApi') as any
const pluginId = inject('pluginId', 'demo-plugin')

// 响应式数据
const stats = ref({
  widgetsCreated: 0,
  uptime: 0,
  interactions: 0,
  storageSize: '0 KB'
})

const pluginInfo = ref({
  name: '插件示例',
  description: '展示 Mira Launcher 插件系统各项能力的综合示例',
  version: '1.0.0',
  keywords: ['demo', 'example', 'showcase'],
  permissions: ['storage', 'notifications', 'menu', 'shortcuts', 'theme']
})

let uptimeInterval: number | null = null
let startTime = Date.now()

// 生命周期
onMounted(() => {
  console.log('Demo page mounted')
  initializeStats()
  startUptimeTimer()
})

onUnmounted(() => {
  if (uptimeInterval) {
    clearInterval(uptimeInterval)
  }
})

// 方法
const initializeStats = async () => {
  if (pluginApi?.storage) {
    try {
      const widgetCount = await pluginApi.storage.get('demo-widget-count') || 0
      const interactions = await pluginApi.storage.get('demo-interactions') || 0
      
      stats.value.widgetsCreated = widgetCount
      stats.value.interactions = interactions
      
      // 计算存储使用量
      calculateStorageSize()
    } catch (error) {
      console.error('Failed to initialize stats:', error)
    }
  }
}

const calculateStorageSize = async () => {
  if (pluginApi?.storage) {
    try {
      // 模拟计算存储大小
      const allKeys = ['demo-widget-count', 'demo-interactions', 'demo-counter', 'demo-data']
      let totalSize = 0
      
      for (const key of allKeys) {
        const value = await pluginApi.storage.get(key)
        if (value !== undefined) {
          totalSize += JSON.stringify(value).length
        }
      }
      
      stats.value.storageSize = formatBytes(totalSize)
    } catch (error) {
      console.error('Failed to calculate storage size:', error)
    }
  }
}

const startUptimeTimer = () => {
  uptimeInterval = setInterval(() => {
    stats.value.uptime = Date.now() - startTime
  }, 1000)
}

const demonstrateNotifications = () => {
  incrementInteractions()
  
  const notifications = [
    { type: 'info', message: '这是信息通知' },
    { type: 'success', message: '这是成功通知' },
    { type: 'warning', message: '这是警告通知' },
    { type: 'error', message: '这是错误通知' }
  ] as const

  let index = 0
  const showNext = () => {
    if (index < notifications.length) {
      const notif = notifications[index]
      pluginApi?.notifications?.show(
        notif.message,
        notif.type,
        {
          duration: 2000,
          actions: index === notifications.length - 1 ? [] : [
            {
              label: '下一个',
              action: () => {
                index++
                setTimeout(showNext, 500)
              }
            }
          ]
        }
      )
      if (index === 0) {
        index++
        setTimeout(showNext, 2500)
      }
    }
  }

  showNext()
}

const demonstrateStorage = async () => {
  incrementInteractions()
  
  if (!pluginApi?.storage) return
  
  try {
    const testKey = 'demo-storage-test'
    const testData = {
      timestamp: new Date().toISOString(),
      randomValue: Math.random(),
      message: 'Storage demonstration data'
    }
    
    await pluginApi.storage.set(testKey, testData)
    
    const retrieved = await pluginApi.storage.get(testKey)
    
    pluginApi.notifications?.show(
      `存储测试完成！数据: ${JSON.stringify(retrieved, null, 2)}`,
      'success',
      { duration: 5000 }
    )
    
    await calculateStorageSize()
  } catch (error) {
    console.error('Storage demonstration failed:', error)
    pluginApi.notifications?.show('存储演示失败', 'error')
  }
}

const toggleTheme = () => {
  incrementInteractions()
  
  if (pluginApi?.theme) {
    if (pluginApi.theme.isActive('demo-theme')) {
      pluginApi.theme.deactivate('demo-theme')
      pluginApi.notifications?.show('演示主题已关闭', 'info')
    } else {
      pluginApi.theme.activate('demo-theme')
      pluginApi.notifications?.show('演示主题已激活', 'success')
    }
  }
}

const addWidget = async () => {
  incrementInteractions()
  
  if (pluginApi?.grid) {
    try {
      const counter = await pluginApi.storage?.get('demo-widget-count') || 0
      const newCount = counter + 1
      
      await pluginApi.grid.addItem({
        type: 'demo-widget',
        data: {
          title: `页面组件 #${newCount}`,
          content: `从演示页面创建的第 ${newCount} 个组件`,
          color: getRandomColor(),
          counter: newCount
        }
      })
      
      await pluginApi.storage?.set('demo-widget-count', newCount)
      stats.value.widgetsCreated = newCount
      
      pluginApi.notifications?.show(
        `已添加页面组件 #${newCount}`,
        'success'
      )
    } catch (error) {
      console.error('Failed to add widget:', error)
      pluginApi.notifications?.show('添加组件失败', 'error')
    }
  }
}

const showComponentInfo = () => {
  incrementInteractions()
  
  const info = {
    组件类型: 'demo-widget',
    支持功能: ['存储', '通知', '颜色变换', '计数器'],
    API权限: ['storage', 'notifications'],
    组件状态: '正常运行'
  }
  
  console.table(info)
  
  pluginApi.notifications?.show(
    '组件信息已输出到控制台',
    'info',
    {
      actions: [
        {
          label: '查看控制台',
          action: () => console.log('Component Info:', info)
        }
      ]
    }
  )
}

const refreshStats = async () => {
  incrementInteractions()
  await initializeStats()
  pluginApi.notifications?.show('统计数据已刷新', 'success')
}

const exportData = async () => {
  incrementInteractions()
  
  if (!pluginApi?.storage) return
  
  try {
    const exportData = {
      pluginInfo: pluginInfo.value,
      stats: stats.value,
      timestamp: new Date().toISOString(),
      widgetCount: await pluginApi.storage.get('demo-widget-count') || 0,
      interactions: await pluginApi.storage.get('demo-interactions') || 0
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    console.log('Exported Plugin Data:', dataStr)
    
    pluginApi.notifications?.show(
      '插件数据已导出到控制台',
      'success',
      {
        actions: [
          {
            label: '查看数据',
            action: () => console.log('Export:', exportData)
          }
        ]
      }
    )
  } catch (error) {
    console.error('Export failed:', error)
    pluginApi.notifications?.show('导出失败', 'error')
  }
}

const resetPlugin = async () => {
  incrementInteractions()
  
  if (!pluginApi?.storage) return
  
  try {
    await pluginApi.storage.clear()
    
    stats.value.widgetsCreated = 0
    stats.value.interactions = 0
    stats.value.storageSize = '0 KB'
    startTime = Date.now()
    
    pluginApi.notifications?.show(
      '插件数据已重置',
      'warning',
      { duration: 3000 }
    )
  } catch (error) {
    console.error('Reset failed:', error)
    pluginApi.notifications?.show('重置失败', 'error')
  }
}

const incrementInteractions = async () => {
  const current = stats.value.interactions
  stats.value.interactions = current + 1
  
  if (pluginApi?.storage) {
    try {
      await pluginApi.storage.set('demo-interactions', stats.value.interactions)
    } catch (error) {
      console.error('Failed to save interactions:', error)
    }
  }
}

// 工具函数
const formatUptime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}小时 ${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟 ${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 KB'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getRandomColor = (): string => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
</script>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  color: white;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.page-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
}

.demo-sections {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.demo-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.feature-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.15);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #60A5FA;
}

.feature-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.feature-card p {
  margin: 0 0 1rem 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

.demo-button {
  background: linear-gradient(45deg, #3B82F6, #1D4ED8);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.demo-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.shortcut-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
}

.component-demo {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  align-items: center;
}

.demo-widget-preview h3 {
  margin: 0 0 1rem 0;
}

.widget-container {
  max-width: 300px;
}

.component-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.demo-button.primary {
  background: linear-gradient(45deg, #10B981, #059669);
}

.demo-button.secondary {
  background: linear-gradient(45deg, #6B7280, #4B5563);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-icon {
  font-size: 2rem;
  color: #34D399;
}

.stat-content h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-content p {
  margin: 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

.plugin-info-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.plugin-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.plugin-header {
  display: flex;
  gap: 1rem;
}

.plugin-icon {
  font-size: 2rem;
  color: #FBBF24;
}

.plugin-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.plugin-details p {
  margin: 0 0 1rem 0;
  opacity: 0.8;
}

.plugin-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.plugin-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.version-badge {
  background: linear-gradient(45deg, #3B82F6, #1D4ED8);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
}

.plugin-capabilities h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.permissions-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(16, 185, 129, 0.2);
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.permission-item i {
  color: #10B981;
}

.page-actions {
  max-width: 1200px;
  margin: 3rem auto 0;
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.action-button.refresh {
  background: linear-gradient(45deg, #06B6D4, #0891B2);
}

.action-button.export {
  background: linear-gradient(45deg, #10B981, #059669);
}

.action-button.reset {
  background: linear-gradient(45deg, #EF4444, #DC2626);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-page {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .demo-sections {
    gap: 2rem;
  }
  
  .demo-section {
    padding: 1.5rem;
  }
  
  .component-demo {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .plugin-meta {
    flex-direction: column;
    gap: 1rem;
  }
  
  .page-actions {
    flex-direction: column;
    align-items: center;
  }
}</style>
