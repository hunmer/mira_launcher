# Mira Launcher 插件开发指南

## 概述

Mira Launcher 提供了一个强大且灵活的插件系统，允许开发者扩展应用功能。本指南将帮助您了解如何开发、测试和发布插件。

## 插件架构

### 核心概念

插件系统基于以下核心概念构建：

- **BasePlugin**: 所有插件的基础抽象类
- **PluginManager**: 插件生命周期管理器
- **EventBus**: 插件间通信系统
- **API Provider**: 插件 API 提供者
- **Sandbox**: 插件安全沙箱环境

### 系统集成

插件可以与以下系统深度集成：

- **Grid 系统**: 注册自定义网格项目类型
- **Page 系统**: 创建专属页面和路由
- **Theme 系统**: 注册自定义主题和样式
- **性能监控**: 自动监控插件性能指标
- **热重载**: 开发时无缝更新插件

## 快速开始

### 1. 创建插件项目

```bash
# 使用插件脚手架创建新插件
npm run create-plugin my-awesome-plugin

# 或手动创建插件目录
mkdir src/plugins/my-awesome-plugin
cd src/plugins/my-awesome-plugin
```

### 2. 基础插件结构

```
my-awesome-plugin/
├── index.ts          # 插件入口文件
├── metadata.json     # 插件元数据
├── components/       # Vue 组件
├── styles/          # 样式文件
├── assets/          # 静态资源
└── README.md        # 插件说明
```

### 3. 插件元数据配置

创建 `metadata.json` 文件：

```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "一个令人惊叹的插件示例",
  "author": "Your Name",
  "homepage": "https://github.com/your-username/my-awesome-plugin",
  "main": "./index.ts",
  "keywords": ["mira-launcher", "plugin", "awesome"],
  "dependencies": [],
  "permissions": [
    "storage",
    "notifications",
    "menu"
  ],
  "compatibility": {
    "mira": ">=1.0.0",
    "node": ">=16.0.0"
  },
  "engines": {
    "vue": "^3.0.0"
  }
}
```

### 4. 创建插件类

创建 `index.ts` 文件：

```typescript
import { BasePlugin, PluginAPI, PluginMetadata } from '@/plugins/core'
import MyComponent from './components/MyComponent.vue'

export default class MyAwesomePlugin extends BasePlugin {
  private menuItemId?: string

  constructor(metadata: PluginMetadata, api: PluginAPI) {
    super(metadata, api)
  }

  async onActivate(): Promise<void> {
    console.log('My Awesome Plugin activated!')
    
    // 注册菜单项
    this.menuItemId = this.api.menu.addMenuItem({
      id: 'my-awesome-action',
      label: '我的功能',
      icon: 'awesome-icon',
      action: () => this.showMyDialog(),
    })

    // 注册网格项目类型
    this.api.grid.registerItemType(
      'my-widget',
      MyComponent,
      (data) => typeof data.content === 'string',
      { content: 'Hello World!' }
    )

    // 注册快捷键
    this.api.shortcuts.register('ctrl+shift+a', () => {
      this.api.notifications.show('快捷键触发!', 'success')
    })

    // 创建专属页面
    this.api.page.registerPage('my-page', MyComponent, {
      title: '我的页面',
      description: '插件专属页面',
      icon: 'page-icon',
    })
  }

  async onDeactivate(): Promise<void> {
    console.log('My Awesome Plugin deactivated!')
    
    // 清理菜单项
    if (this.menuItemId) {
      this.api.menu.removeMenuItem(this.menuItemId)
    }

    // 清理其他资源
    this.api.shortcuts.unregisterAll()
    this.api.grid.unregisterItemType('my-widget')
    this.api.page.unregisterPage('my-page')
  }

  private showMyDialog() {
    this.api.notifications.show('Hello from My Awesome Plugin!', 'info')
  }
}
```

### 5. 创建 Vue 组件

创建 `components/MyComponent.vue`：

```vue
<template>
  <div class="my-plugin-component" :data-plugin="pluginId">
    <h3>{{ title }}</h3>
    <p>{{ content }}</p>
    <button @click="handleClick" class="plugin-button">
      点击我
    </button>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'

interface Props {
  title?: string
  content?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '插件组件',
  content: '这是一个插件组件示例',
})

// 注入插件 API
const pluginApi = inject('pluginApi')
const pluginId = inject('pluginId', 'unknown')

const handleClick = () => {
  pluginApi?.notifications?.show('按钮被点击了!', 'success')
}
</script>

<style scoped>
.my-plugin-component {
  padding: 16px;
  border: 1px solid var(--plugin-my-awesome-plugin-border, #ddd);
  border-radius: 8px;
  background: var(--plugin-my-awesome-plugin-bg, #fff);
}

.plugin-button {
  padding: 8px 16px;
  background: var(--plugin-my-awesome-plugin-primary, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.plugin-button:hover {
  opacity: 0.8;
}
</style>
```

## 插件 API

### Grid API

```typescript
// 注册网格项目类型
api.grid.registerItemType(
  typeName: string,
  renderer: Component,
  validator: (data: any) => boolean,
  defaultData: Record<string, any>
)

// 添加网格项目
api.grid.addItem(itemData: Partial<GridItem>)

// 移除网格项目
api.grid.removeItems()

// 更新配置
api.grid.updateConfig(config: Partial<PluginGridConfig>)
```

### Page API

```typescript
// 注册页面
api.page.registerPage(
  pageId: string,
  component: Component,
  metadata: Record<string, any>,
  lifecycle?: PageLifecycle
)

// 移除页面
api.page.unregisterPage(pageId?: string)

// 获取页面组件
api.page.getComponent(pageId: string)

// 激活/停用页面
api.page.activate(pageId: string)
api.page.deactivate(pageId: string)
```

### Theme API

```typescript
// 注册主题
api.theme.register(themeData: {
  name: string
  styles: Record<string, string>
  cssVariables: Record<string, string>
  mode: 'light' | 'dark' | 'auto'
})

// 激活/停用主题
api.theme.activate(themeName: string)
api.theme.deactivate(themeName: string)

// 更新主题配置
api.theme.updateConfig(config: Partial<PluginThemeConfig>)
```

### Menu API

```typescript
// 添加菜单项
api.menu.addMenuItem(item: {
  id: string
  label: string
  icon?: string
  action: () => void
  submenu?: MenuItem[]
})

// 移除菜单项
api.menu.removeMenuItem(id: string)

// 添加上下文菜单
api.menu.addContextMenu(selector: string, items: MenuItem[])
```

### Shortcuts API

```typescript
// 注册快捷键
api.shortcuts.register(combination: string, action: () => void)

// 移除快捷键
api.shortcuts.unregister(combination: string)

// 移除所有快捷键
api.shortcuts.unregisterAll()
```

### Storage API

```typescript
// 获取数据
api.storage.get(key: string): Promise<any>

// 设置数据
api.storage.set(key: string, value: any): Promise<void>

// 删除数据
api.storage.remove(key: string): Promise<void>

// 清空数据
api.storage.clear(): Promise<void>

// 监听变化
api.storage.watch(key: string, callback: (value: any) => void)
```

### Notifications API

```typescript
// 显示通知
api.notifications.show(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  options?: {
    duration?: number
    actions?: Array<{
      label: string
      action: () => void
    }>
  }
)

// 移除通知
api.notifications.remove(id: string)

// 清空所有通知
api.notifications.clear()
```

## 开发工具

### 热重载

开发模式下，插件支持热重载功能：

```typescript
// 手动触发重载
window.__hotReloadManager.manualReload('my-awesome-plugin')

// 监听重载事件
window.addEventListener('plugin-hot-reload', (event) => {
  console.log('Plugin reloaded:', event.detail)
})
```

### 性能监控

开发模式下自动监控插件性能：

```typescript
// 查看性能报告
window.__performanceMonitor.getPerformanceReport()

// 监听性能事件
window.addEventListener('performance-event', (event) => {
  if (event.detail.type === 'plugin-performance-warning') {
    console.warn('Plugin performance issue:', event.detail.data)
  }
})
```

### 调试工具

```typescript
// 插件调试信息
console.log('Plugin info:', this.getInfo())

// 查看插件状态
console.log('Plugin state:', this.getState())

// 测试 API 连接
console.log('API available:', !!this.api)
```

## 最佳实践

### 1. 性能优化

- 使用懒加载组件
- 避免在激活时执行重操作
- 及时清理事件监听器和定时器
- 使用 `async/await` 处理异步操作

```typescript
// 懒加载组件
const LazyComponent = defineAsyncComponent(() => import('./LazyComponent.vue'))

// 正确的清理方式
async onDeactivate() {
  // 清理定时器
  if (this.timer) {
    clearInterval(this.timer)
  }
  
  // 清理事件监听器
  this.api.events.off('app:theme-changed', this.handleThemeChange)
  
  // 清理存储监听
  this.api.storage.unwatch('my-plugin-setting')
}
```

### 2. 错误处理

```typescript
async onActivate() {
  try {
    await this.initializePlugin()
  } catch (error) {
    console.error('Plugin activation failed:', error)
    this.api.notifications.show('插件激活失败', 'error')
    throw error // 让插件管理器知道激活失败
  }
}

private async initializePlugin() {
  // 带超时的初始化
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Initialization timeout')), 5000)
  )
  
  await Promise.race([
    this.loadResources(),
    timeout
  ])
}
```

### 3. 主题适配

```typescript
// 注册自适应主题
this.api.theme.register({
  name: 'my-plugin-theme',
  mode: 'auto', // 自动适配
  cssVariables: {
    'primary': 'light-dark(#007bff, #4dabf7)',
    'background': 'light-dark(#ffffff, #1a1a1a)',
    'text': 'light-dark(#333333, #ffffff)',
  },
  styles: {
    '.my-component': `
      background: var(--plugin-my-awesome-plugin-background);
      color: var(--plugin-my-awesome-plugin-text);
    `
  }
})
```

### 4. 国际化支持

```typescript
// 在组件中使用
const t = this.api.i18n.t

// 在模板中
<template>
  <h1>{{ t('my-plugin.title') }}</h1>
</template>

// 注册翻译
this.api.i18n.addTranslations('my-plugin', {
  'zh-CN': {
    title: '我的插件',
    description: '这是一个示例插件'
  },
  'en-US': {
    title: 'My Plugin',
    description: 'This is a sample plugin'
  }
})
```

## 测试

### 单元测试

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import MyAwesomePlugin from './index'
import { createMockAPI } from '@/plugins/testing'

describe('MyAwesomePlugin', () => {
  let plugin: MyAwesomePlugin
  let mockApi: any

  beforeEach(() => {
    mockApi = createMockAPI()
    plugin = new MyAwesomePlugin(
      { id: 'test-plugin', name: 'Test Plugin' },
      mockApi
    )
  })

  it('should activate successfully', async () => {
    await plugin.onActivate()
    expect(plugin.isActive()).toBe(true)
    expect(mockApi.menu.addMenuItem).toHaveBeenCalled()
  })

  it('should deactivate cleanly', async () => {
    await plugin.onActivate()
    await plugin.onDeactivate()
    expect(plugin.isActive()).toBe(false)
    expect(mockApi.menu.removeMenuItem).toHaveBeenCalled()
  })
})
```

### 集成测试

```typescript
import { mount } from '@vue/test-utils'
import { createApp } from 'vue'
import MyComponent from './components/MyComponent.vue'

describe('MyComponent Integration', () => {
  it('should integrate with plugin system', () => {
    const wrapper = mount(MyComponent, {
      global: {
        provide: {
          pluginApi: mockApi,
          pluginId: 'test-plugin'
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
    // 测试组件交互
  })
})
```

## 发布

### 1. 构建插件

```bash
# 构建生产版本
npm run build:plugin my-awesome-plugin

# 验证插件
npm run validate:plugin my-awesome-plugin
```

### 2. 打包分发

```bash
# 创建插件包
npm run pack:plugin my-awesome-plugin

# 生成安装包
npm run dist:plugin my-awesome-plugin
```

### 3. 版本管理

遵循语义化版本规范：

- `1.0.0` - 主版本号：不兼容的 API 修改
- `0.1.0` - 次版本号：向下兼容的功能性新增
- `0.0.1` - 修订号：向下兼容的问题修正

## 故障排除

### 常见问题

1. **插件无法加载**
   - 检查 `metadata.json` 格式
   - 确认依赖项已安装
   - 查看控制台错误信息

2. **热重载不工作**
   - 确认在开发模式下
   - 检查文件路径配置
   - 查看热重载管理器状态

3. **样式不生效**
   - 确认主题变量命名正确
   - 检查样式隔离配置
   - 验证 CSS 选择器

4. **API 调用失败**
   - 检查权限配置
   - 确认 API 方法存在
   - 查看沙箱限制

### 调试技巧

```typescript
// 启用详细日志
window.__debugMode = true

// 查看插件状态
console.log('All plugins:', window.__pluginManager.getAllPlugins())

// 性能分析
console.log('Performance:', window.__performanceMonitor.getPerformanceReport())

// 热重载状态
console.log('Hot reload:', window.__hotReloadManager.getReloadStatus())
```

## 示例插件

查看 `src/plugins/examples/` 目录下的示例插件：

- `simple-widget` - 基础网格组件插件
- `custom-theme` - 自定义主题插件
- `page-extension` - 页面扩展插件
- `productivity-tools` - 生产力工具集插件

## 社区

- [GitHub Issues](https://github.com/hunmer/mira_launcher/issues) - 报告问题
- [Discussions](https://github.com/hunmer/mira_launcher/discussions) - 讨论交流
- [Plugin Registry](https://plugins.mira-launcher.com) - 插件市场

## 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md)

---

*Happy coding! 🚀*
