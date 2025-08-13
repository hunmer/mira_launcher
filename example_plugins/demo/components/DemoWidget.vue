<template>
  <div class="demo-widget" :style="{ backgroundColor: data.color }">
    <div class="widget-header">
      <h3 class="widget-title">{{ data.title }}</h3>
      <div class="widget-controls">
        <button
          @click="incrementCounter"
          class="widget-button increment-btn"
          v-tooltip="'增加计数'"
        >
          <i class="pi pi-plus" />
        </button>
        <button
          @click="changeColor"
          class="widget-button color-btn"
          v-tooltip="'随机颜色'"
        >
          <i class="pi pi-palette" />
        </button>
        <button
          @click="showInfo"
          class="widget-button info-btn"
          v-tooltip="'显示信息'"
        >
          <i class="pi pi-info-circle" />
        </button>
      </div>
    </div>
    
    <div class="widget-content">
      <p class="widget-description">{{ data.content }}</p>
      
      <div class="widget-stats">
        <div class="stat-item">
          <span class="stat-label">计数器:</span>
          <span class="stat-value">{{ localCounter }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">创建时间:</span>
          <span class="stat-value">{{ formatTime(createdAt) }}</span>
        </div>
      </div>
      
      <div class="widget-actions">
        <button @click="saveToStorage" class="action-button save-btn">
          <i class="pi pi-save" />
          保存状态
        </button>
        <button @click="loadFromStorage" class="action-button load-btn">
          <i class="pi pi-download" />
          加载状态
        </button>
        <button @click="resetWidget" class="action-button reset-btn">
          <i class="pi pi-refresh" />
          重置
        </button>
      </div>
    </div>
    
    <div class="widget-footer">
      <div class="plugin-info">
        <small>演示插件 v{{ pluginVersion }}</small>
        <small>ID: {{ data.counter }}</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, onMounted, computed } from 'vue'

interface Props {
  data: {
    title: string
    content: string
    color: string
    counter: number
  }
}

const props = defineProps<Props>()

// 注入插件 API
const pluginApi = inject('pluginApi') as any
const pluginId = inject('pluginId', 'demo-plugin')

// 响应式数据
const localCounter = ref(props.data.counter || 0)
const createdAt = ref(new Date())
const pluginVersion = ref('1.0.0')

// 计算属性
const widgetId = computed(() => `${pluginId}-widget-${props.data.counter}`)

// 生命周期
onMounted(() => {
  console.log(`Demo widget ${widgetId.value} mounted`)
  loadInitialState()
})

// 方法
const incrementCounter = async () => {
  localCounter.value++
  
  if (pluginApi?.notifications) {
    pluginApi.notifications.show(
      `计数器更新为: ${localCounter.value}`,
      'success',
      { duration: 2000 }
    )
  }
  
  // 保存到插件存储
  await saveCounterToStorage()
}

const changeColor = () => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ]
  const newColor = colors[Math.floor(Math.random() * colors.length)]
  props.data.color = newColor
  
  if (pluginApi?.notifications) {
    pluginApi.notifications.show('颜色已更改', 'info', { duration: 1500 })
  }
}

const showInfo = () => {
  const info = {
    标题: props.data.title,
    描述: props.data.content,
    计数器: localCounter.value,
    颜色: props.data.color,
    创建时间: formatTime(createdAt.value),
    插件ID: pluginId
  }
  
  console.log('Widget Info:', info)
  
  if (pluginApi?.notifications) {
    pluginApi.notifications.show(
      `组件信息已输出到控制台`,
      'info',
      {
        duration: 3000,
        actions: [
          {
            label: '查看控制台',
            action: () => {
              console.table(info)
            }
          }
        ]
      }
    )
  }
}

const saveToStorage = async () => {
  if (!pluginApi?.storage) return
  
  try {
    const state = {
      counter: localCounter.value,
      color: props.data.color,
      title: props.data.title,
      content: props.data.content,
      savedAt: new Date().toISOString()
    }
    
    await pluginApi.storage.set(widgetId.value, state)
    
    pluginApi.notifications?.show('状态已保存', 'success')
  } catch (error) {
    console.error('Save failed:', error)
    pluginApi.notifications?.show('保存失败', 'error')
  }
}

const loadFromStorage = async () => {
  if (!pluginApi?.storage) return
  
  try {
    const state = await pluginApi.storage.get(widgetId.value)
    
    if (state) {
      localCounter.value = state.counter || 0
      props.data.color = state.color || props.data.color
      props.data.title = state.title || props.data.title
      props.data.content = state.content || props.data.content
      
      pluginApi.notifications?.show(
        `状态已加载 (保存于: ${formatTime(new Date(state.savedAt))})`,
        'success'
      )
    } else {
      pluginApi.notifications?.show('未找到保存的状态', 'warning')
    }
  } catch (error) {
    console.error('Load failed:', error)
    pluginApi.notifications?.show('加载失败', 'error')
  }
}

const resetWidget = () => {
  localCounter.value = 0
  props.data.color = '#3B82F6'
  props.data.title = `演示组件 #${props.data.counter}`
  props.data.content = `这是第 ${props.data.counter} 个演示组件`
  
  pluginApi.notifications?.show('组件已重置', 'info')
}

const saveCounterToStorage = async () => {
  if (pluginApi?.storage) {
    try {
      await pluginApi.storage.set(`${widgetId.value}-counter`, localCounter.value)
    } catch (error) {
      console.error('Failed to save counter:', error)
    }
  }
}

const loadInitialState = async () => {
  if (pluginApi?.storage) {
    try {
      const savedCounter = await pluginApi.storage.get(`${widgetId.value}-counter`)
      if (savedCounter !== undefined) {
        localCounter.value = savedCounter
      }
    } catch (error) {
      console.error('Failed to load initial state:', error)
    }
  }
}

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.demo-widget {
  border-radius: 12px;
  padding: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.demo-widget::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  pointer-events: none;
}

.demo-widget:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.widget-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.widget-controls {
  display: flex;
  gap: 4px;
}

.widget-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
}

.widget-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.widget-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.widget-description {
  margin: 0 0 16px 0;
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.4;
}

.widget-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  background: rgba(0, 0, 0, 0.1);
  padding: 12px;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.stat-label {
  opacity: 0.8;
}

.stat-value {
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
}

.widget-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.action-button {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
  min-width: 0;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.widget-footer {
  margin-top: 12px;
  position: relative;
  z-index: 1;
}

.plugin-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  opacity: 0.7;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .widget-actions {
    flex-direction: column;
  }
  
  .action-button {
    flex: none;
  }
  
  .widget-stats {
    margin-bottom: 12px;
  }
  
  .stat-item {
    font-size: 0.8rem;
  }
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.widget-button:active {
  animation: pulse 0.3s ease;
}

.action-button:active {
  animation: pulse 0.3s ease;
}

/* 颜色主题适配 */
.demo-widget.light-theme {
  color: #1f2937;
  text-shadow: none;
}

.demo-widget.light-theme .widget-button,
.demo-widget.light-theme .action-button {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.2);
  color: inherit;
}

.demo-widget.light-theme .widget-button:hover,
.demo-widget.light-theme .action-button:hover {
  background: rgba(0, 0, 0, 0.15);
}
</style>
