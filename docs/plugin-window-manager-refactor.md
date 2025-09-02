# PluginWindowManager 架构更新

## 变更概述

PluginWindowManager 现在直接从 PluginManager 获取插件实例，而不是维护自己的插件实例映射。这样可以确保数据的一致性和减少重复。

## 主要变更

### 1. 移除内部插件实例管理

**之前：**
```typescript
export class PluginWindowManager {
  private pluginInstances: Map<string, unknown> = new Map()
  
  registerPluginInstance(pluginId: string, instance: unknown) {
    this.pluginInstances.set(pluginId, instance)
  }
}
```

**现在：**
```typescript
export class PluginWindowManager {
  private pluginManager?: { getPluginInstance: (id: string) => unknown }
  
  private getPluginInstance(pluginId: string): unknown {
    // 直接从 PluginManager 获取
    return this.pluginManager?.getPluginInstance(pluginId)
  }
}
```

### 2. 动态 PluginManager 连接

PluginWindowManager 现在在构造时自动连接到 PluginManager：

```typescript
constructor() {
  // 初始化时建立与 PluginManager 的连接
  this.initializePluginManager()
}

private initializePluginManager() {
  const globalWindow = window as unknown as { 
    pluginManager?: { getPluginInstance: (id: string) => unknown }
  }
  
  if (globalWindow.pluginManager) {
    this.pluginManager = globalWindow.pluginManager
    console.log('[PluginWindowManager] Successfully connected to PluginManager')
  } else {
    // 延迟重试，等待 PluginManager 初始化
    setTimeout(() => this.initializePluginManager(), 1000)
  }
}
```

### 3. 弃用方法

以下方法已被标记为弃用，但保留以维持向后兼容性：

```typescript
/**
 * @deprecated 使用 PluginManager.getPluginInstance() 替代
 */
registerPluginInstance(_pluginId: string, _instance: unknown) {
  console.warn('[PluginWindowManager] registerPluginInstance is deprecated.')
}

/**
 * @deprecated 使用 PluginManager 管理插件生命周期
 */
unregisterPluginInstance(_pluginId: string) {
  console.warn('[PluginWindowManager] unregisterPluginInstance is deprecated.')
}
```

### 4. 插件实例获取策略

新的获取策略采用分层回退机制：

```typescript
private getPluginInstance(pluginId: string): unknown {
  // 1. 优先从 PluginManager 获取（推荐）
  if (this.pluginManager?.getPluginInstance) {
    const instance = this.pluginManager.getPluginInstance(pluginId)
    if (instance) return instance
  }

  // 2. 回退到全局 __pluginInstances（兼容性）
  const globalWindow = window as unknown as {
    __pluginInstances?: Record<string, unknown>
  }
  
  if (globalWindow.__pluginInstances?.[pluginId]) {
    return globalWindow.__pluginInstances[pluginId]
  }

  // 3. 未找到插件实例
  return null
}
```

## 优势

### 1. **单一数据源**
- 插件实例只在 PluginManager 中管理
- 避免数据不一致的问题
- 减少内存占用

### 2. **自动同步**
- PluginWindowManager 始终获取最新的插件实例
- 无需手动同步插件状态

### 3. **更好的错误处理**
- 集中的插件实例管理
- 统一的错误处理机制

### 4. **向后兼容**
- 保留已弃用的方法，不会破坏现有代码
- 渐进式迁移策略

## 迁移指南

### 对于插件开发者

无需任何变更！插件的 `handleLaunchEvent` 方法仍然正常工作：

```typescript
async handleLaunchEvent(event: PluginLaunchEvent) {
  // 这些代码无需变更
  const { action, route, params } = event
  // ... 处理逻辑
}
```

### 对于系统集成

1. **移除手动注册调用**：
   ```typescript
   // 不再需要这样做
   // pluginWindowManager.registerPluginInstance(pluginId, instance)
   ```

2. **确保 PluginManager 可用**：
   ```typescript
   // 确保 PluginManager 在全局可访问
   window.pluginManager = pluginManagerInstance
   ```

## 调试信息

新的实现提供了更好的调试信息：

```
[PluginWindowManager] Successfully connected to PluginManager
[PluginWindowManager] Forwarding plugin launch event to plugin: my-plugin
[PluginWindowManager] Plugin my-plugin handled launch event successfully
```

## 性能影响

- **内存使用**: 减少了重复的插件实例存储
- **查找性能**: 直接从 PluginManager 获取，减少了查找层级
- **初始化时间**: 增加了连接 PluginManager 的时间，但影响微小

## 注意事项

1. **初始化顺序**: PluginWindowManager 需要在 PluginManager 之后初始化
2. **错误恢复**: 如果 PluginManager 不可用，系统会自动重试连接
3. **兼容性**: 旧的 `registerPluginInstance` 调用会输出警告但不会破坏功能

这些变更使得插件窗口管理系统更加健壮和高效，同时保持了与现有代码的兼容性。
