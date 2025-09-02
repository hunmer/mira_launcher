# 插件启动事件处理机制

## 新的事件处理方式

现在 PluginWindowManager 不再根据 action 来决定调用哪个函数，而是直接将完整的启动事件传递给对应的插件，让插件内部自己处理所有逻辑。

## 工作流程

1. **事件发送** - 系统发送 `plugin:launch` 事件
2. **事件转发** - PluginWindowManager 将事件直接转发给对应插件
3. **插件处理** - 插件根据事件参数自行决定如何响应

## 插件实现示例

### 在插件中处理启动事件

```typescript
export class MyPlugin extends BasePlugin {
  /**
   * 处理插件启动事件（由 PluginWindowManager 直接调用）
   */
  async handleLaunchEvent(event: {
    pluginId: string
    action: string
    route?: string
    params?: Record<string, unknown>
    windowOptions?: Record<string, unknown>
  }) {
    console.log('处理启动事件:', event)
    
    const { action, route, params, windowOptions } = event
    
    switch (action) {
      case 'settings':
        await this.openSettingsPage({ route, ...params, ...windowOptions })
        break
      
      case 'config':
        await this.openConfigPage({ route, ...params, ...windowOptions })
        break
      
      case 'help':
        await this.openHelpPage({ route, ...params, ...windowOptions })
        break
      
      case 'custom-action':
        await this.handleCustomAction({ route, ...params, ...windowOptions })
        break
      
      default:
        // 处理未知的 action
        if (windowOptions) {
          await this.createCustomWindow(action, { route, ...params, ...windowOptions })
        } else {
          await this.openMainPage({ route, ...params })
        }
        break
    }
  }

  // 各种窗口创建方法...
  async openSettingsPage(options?: Record<string, unknown>) {
    const window = await this._api?.window.createWindow({
      title: '插件设置',
      width: 600,
      height: 400,
      route: 'settings',
      params: options,
    })
    return window
  }
  
  async createCustomWindow(action: string, options?: Record<string, unknown>) {
    const window = await this._api?.window.createWindow({
      title: `${this.name} - ${action}`,
      width: (options?.width as number) || 800,
      height: (options?.height as number) || 600,
      route: (options?.route as string) || action,
      params: { action, ...options },
    })
    return window
  }
}
```

## 事件发送示例

### 发送不同类型的启动事件

```typescript
// 发送设置页面启动事件
eventBus.emit('plugin:launch', {
  pluginId: 'my-plugin',
  action: 'settings',
  route: 'general',
  params: { theme: 'dark' }
})

// 发送自定义窗口启动事件
eventBus.emit('plugin:launch', {
  pluginId: 'my-plugin',
  action: 'data-viewer',
  route: 'charts',
  params: { dataType: 'analytics' },
  windowOptions: {
    title: '数据查看器',
    width: 1200,
    height: 800,
    resizable: true
  }
})

// 发送协议导航事件
eventBus.emit('plugin:launch', {
  pluginId: 'my-plugin',
  action: 'navigate',
  route: 'help/getting-started',
  params: { section: 'basics' }
})
```

## 优势

### 1. **灵活性**
- 插件可以处理任意 action，不受预定义限制
- 插件可以根据自己的业务逻辑决定如何响应

### 2. **解耦**
- PluginWindowManager 不需要了解具体的业务逻辑
- 插件完全控制自己的窗口管理行为

### 3. **扩展性**
- 新的 action 类型可以随时添加，无需修改窗口管理器
- 插件可以实现复杂的启动逻辑

### 4. **统一性**
- 所有插件使用相同的事件处理接口
- 事件结构标准化，易于理解和维护

## 向后兼容

如果插件没有实现 `handleLaunchEvent` 方法，PluginWindowManager 会尝试通过事件系统发送事件：

```typescript
// 插件可以选择监听事件而不是实现方法
this._api?.on('plugin:launch', (event) => {
  this.handleEvent(event)
})
```

## 错误处理

PluginWindowManager 会捕获插件处理事件时的错误：

```typescript
try {
  await plugin.handleLaunchEvent(event)
  console.log(`Plugin ${pluginId} handled launch event successfully`)
} catch (error) {
  console.error(`Plugin ${pluginId} failed to handle launch event:`, error)
}
```

## 最佳实践

1. **实现 handleLaunchEvent 方法** - 这是推荐的方式
2. **处理所有可能的 action** - 包括未知的 action
3. **提供合理的默认行为** - 当无法识别 action 时
4. **记录日志** - 便于调试和监控
5. **错误处理** - 优雅地处理异常情况

这种新的机制让插件拥有完全的控制权，同时保持了系统的简洁性和可扩展性。
