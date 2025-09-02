# 插件窗口管理系统使用指南

## 概述

插件窗口管理系统为插件提供了创建独立窗口的能力，包括配置页面、设置界面和自定义功能窗口。系统支持 `plugin://` 协议URL处理和 `plugin:launch` 事件响应。

## 功能特性

- 🪟 **独立窗口创建** - 支持在 Tauri 环境中创建独立的插件窗口
- 🔗 **协议URL处理** - 支持 `plugin://pluginId/route?params` 格式的URL解析
- 📡 **事件驱动** - 响应 `plugin:launch` 事件自动打开插件页面
- 🎛️ **窗口管理** - 提供窗口生命周期管理和状态跟踪
- 🌐 **跨环境兼容** - 支持 Tauri 桌面环境和 Web 环境

## API 使用方法

### 1. 创建插件窗口

```typescript
// 在插件中使用窗口API
class MyPlugin extends BasePlugin {
  async openSettingsPage() {
    // 创建设置窗口
    const window = await this.api.window.createWindow({
      title: '插件设置',
      width: 600,
      height: 400,
      route: 'settings',
      params: { mode: 'advanced' }
    })
    
    console.log('设置窗口已创建:', window.id)
  }

  async openConfigPage() {
    // 快捷创建配置页面
    await this.api.window.openConfigPage({
      title: '配置页面',
      width: 800,
      height: 600
    })
  }

  async showModal() {
    // 显示模态窗口
    await this.api.window.showModal({
      title: '确认操作',
      width: 400,
      height: 200,
      route: 'confirm',
      params: { action: 'delete' }
    })
  }
}
```

### 2. 注册协议处理器

```typescript
class MyPlugin extends BasePlugin {
  async initialize() {
    // 注册路由处理器
    this.api.protocol.registerHandler('settings', (params) => {
      console.log('打开设置页面，参数:', params)
      this.openSettingsPage(params)
    })

    this.api.protocol.registerHandler('config', (params) => {
      console.log('打开配置页面，参数:', params)
      this.openConfigPage(params)
    })

    this.api.protocol.registerHandler('help', (params) => {
      console.log('打开帮助页面，参数:', params)
      this.openHelpPage(params)
    })
  }

  async navigate(route: string, params?: any) {
    // 导航到指定路由
    await this.api.protocol.navigate(route, params)
  }
}
```

### 3. 处理插件启动事件

```typescript
// 插件管理器会自动处理 plugin:launch 事件
// 事件格式：
const launchEvent = {
  pluginId: 'my-plugin',
  action: 'configure', // 'open' | 'configure' | 'show-settings' | 'launch'
  params: { 
    route: 'settings',
    windowOptions: { width: 600, height: 400 }
  }
}

// 插件可以监听这些事件
class MyPlugin extends BasePlugin {
  async initialize() {
    // 监听启动事件
    this.api.events.on('plugin:launch', (event) => {
      if (event.pluginId === this.metadata.id) {
        this.handleLaunchEvent(event)
      }
    })
  }

  private async handleLaunchEvent(event: PluginLaunchEvent) {
    switch (event.action) {
      case 'configure':
        await this.openConfigPage(event.params?.windowOptions)
        break
      case 'show-settings':
        await this.openSettingsPage(event.params?.windowOptions)
        break
      default:
        await this.openMainPage(event.params?.windowOptions)
    }
  }
}
```

## 协议URL格式

### 基本格式

```
plugin://pluginId/route?param1=value1&param2=value2
```

### 示例URL

```
plugin://my-plugin/settings?theme=dark&lang=zh
plugin://my-plugin/config?mode=advanced
plugin://my-plugin/help?section=getting-started
```

### URL解析结果

```typescript
const urlData = {
  pluginId: 'my-plugin',
  route: 'settings',
  params: {
    theme: 'dark',
    lang: 'zh'
  }
}
```

## 插件窗口配置选项

```typescript
interface PluginWindowOptions {
  title?: string          // 窗口标题
  width?: number          // 窗口宽度（默认800）
  height?: number         // 窗口高度（默认600）
  center?: boolean        // 是否居中（默认true）
  resizable?: boolean     // 是否可调整大小（默认true）
  alwaysOnTop?: boolean   // 是否置顶（默认false）
  route?: string          // 插件内部路由
  params?: any            // 传递给插件的参数
  component?: any         // 组件配置（Web环境）
}
```

## 事件系统

### 发送启动事件

```typescript
// 发送插件启动事件
eventBus.emit('plugin:launch', {
  pluginId: 'my-plugin',
  action: 'configure',
  params: {
    route: 'settings',
    windowOptions: { width: 600, height: 400 }
  }
})
```

### 监听窗口事件

```typescript
class MyPlugin extends BasePlugin {
  async initialize() {
    // 监听窗口创建
    this.api.events.on('window:created', (event) => {
      console.log('窗口已创建:', event.windowId)
    })

    // 监听窗口关闭
    this.api.events.on('window:closed', (event) => {
      console.log('窗口已关闭:', event.windowId)
    })
  }
}
```

## 最佳实践

### 1. 窗口尺寸设计

```typescript
// 推荐的窗口尺寸
const WINDOW_SIZES = {
  settings: { width: 600, height: 400 },   // 设置页面
  config: { width: 800, height: 600 },     // 配置页面
  modal: { width: 400, height: 200 },      // 模态对话框
  help: { width: 900, height: 700 },       // 帮助文档
}
```

### 2. 错误处理

```typescript
class MyPlugin extends BasePlugin {
  async openSettingsPage() {
    try {
      const window = await this.api.window.createWindow({
        title: '设置',
        width: 600,
        height: 400,
        route: 'settings'
      })
      return window
    } catch (error) {
      console.error('创建设置窗口失败:', error)
      // 显示错误提示
      this.api.ui.showNotification({
        type: 'error',
        message: '无法打开设置页面'
      })
    }
  }
}
```

### 3. 窗口状态管理

```typescript
class MyPlugin extends BasePlugin {
  private windows = new Map<string, PluginWindow>()

  async openWindow(route: string, options?: PluginWindowOptions) {
    // 检查是否已有同类型窗口
    const existingWindow = this.findWindowByRoute(route)
    if (existingWindow) {
      // 聚焦现有窗口而不是创建新窗口
      await existingWindow.focus()
      return existingWindow
    }

    // 创建新窗口
    const window = await this.api.window.createWindow({
      ...options,
      route
    })

    // 跟踪窗口
    this.windows.set(window.id, window)

    // 监听窗口关闭
    window.on('closed', () => {
      this.windows.delete(window.id)
    })

    return window
  }

  private findWindowByRoute(route: string): PluginWindow | undefined {
    for (const window of this.windows.values()) {
      if (window.route === route) {
        return window
      }
    }
    return undefined
  }
}
```

## 开发调试

### 1. 调试插件窗口

```typescript
// 开启调试模式
const window = await this.api.window.createWindow({
  title: '调试窗口',
  width: 800,
  height: 600,
  route: 'debug',
  params: { debug: true }
})

// 监听窗口事件
window.on('created', () => console.log('窗口创建成功'))
window.on('ready', () => console.log('窗口准备就绪'))
window.on('closed', () => console.log('窗口已关闭'))
```

### 2. 协议URL测试

```typescript
// 测试协议URL解析
const testUrls = [
  'plugin://my-plugin/settings?theme=dark',
  'plugin://my-plugin/config',
  'plugin://my-plugin/help?section=api'
]

testUrls.forEach(url => {
  const parsed = pluginWindowManager.parsePluginURL(url)
  console.log('解析结果:', parsed)
})
```

## 注意事项

1. **环境兼容性** - 插件窗口在 Tauri 环境中创建独立窗口，在 Web 环境中可能使用模态框或内嵌页面
2. **资源管理** - 及时关闭不需要的窗口以节省系统资源
3. **用户体验** - 避免同时打开过多插件窗口
4. **错误恢复** - 实现适当的错误处理和用户反馈机制
5. **性能优化** - 对于复杂页面，考虑延迟加载和内容分页

通过这套插件窗口管理系统，插件开发者可以轻松创建功能丰富的用户界面，提供更好的用户体验。
