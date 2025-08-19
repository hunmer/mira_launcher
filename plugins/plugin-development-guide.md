# Mira Launcher 插件开发指南

## 概述

本指南介绍了在 Mira Launcher 中开发插件时需要注意的关键点，特别是针对 eval 环境中的模块导入和类型处理。

## 核心要点

### 1. 模块导入方式

由于插件在 eval 环境中执行，**不能使用标准的 ES6 import 语句**。

#### ❌ 错误做法
```typescript
import { BasePlugin } from '../plugin-sdk'
import type { PluginSearchEntry } from '../plugin-sdk'
```

#### ✅ 正确做法
```typescript
// 从 window 变量缓存中同步访问插件SDK模块（通过eval环境可以访问）
const pluginSDK = (window as any).__moduleCache['../plugin-sdk']
const BasePlugin = pluginSDK?.BasePlugin

// 由于TypeScript接口在运行时不存在，我们只需要BasePlugin类
// 其他类型定义用any替代，在运行时会正常工作
```

### 2. Tauri API 导入

对于 Tauri API，使用全局的 `__importModule` 函数进行异步导入。

#### ❌ 错误做法
```typescript
const { exists } = await import('@tauri-apps/plugin-fs')
```

#### ✅ 正确做法
```typescript
const fs = await (window as any).__importModule('@tauri-apps/plugin-fs')
await fs.exists(path)
```

### 3. 类型声明处理

在 eval 环境中，TypeScript 接口在运行时不存在，需要使用 `any` 类型。

#### ❌ 错误做法
```typescript
override readonly search_regexps: PluginSearchEntry[] = []
override readonly logs: PluginLogConfig = {}
```

#### ✅ 正确做法
```typescript
readonly search_regexps: any[] = []
readonly logs: any = {}
```

### 4. 移除 override 修饰符

由于基类在运行时可能被解析为 `any` 类型，需要移除 `override` 修饰符。

#### ❌ 错误做法
```typescript
override async onLoad(): Promise<void> {}
override getMetadata(): PluginMetadata {}
```

#### ✅ 正确做法
```typescript
async onLoad(): Promise<void> {}
getMetadata(): any {}
```

## 支持的 Tauri 模块

主应用在 `main.ts` 中预配置了以下模块，可通过 `__importModule` 访问：

- `@tauri-apps/plugin-fs` - 文件系统操作
- `@tauri-apps/plugin-opener` - 系统程序打开
- `@tauri-apps/plugin-shell` - Shell 命令执行
- `@tauri-apps/api/core` - 核心 API
- `../plugin-sdk` - 插件 SDK

## 完整的插件模板

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// 从 window 变量缓存中同步访问插件SDK模块（通过eval环境可以访问）
const pluginSDK = (window as any).__moduleCache['../plugin-sdk']
const BasePlugin = pluginSDK?.BasePlugin

// 由于TypeScript接口在运行时不存在，我们只需要BasePlugin类
// 其他类型定义用any替代，在运行时会正常工作

/**
 * 示例插件
 */
class ExamplePlugin extends BasePlugin {
  // 必需的抽象属性实现
  readonly id = 'com.example.plugin'
  readonly name = '示例插件'
  readonly version = '1.0.0'
  readonly description = '这是一个示例插件'
  readonly author = 'Example Team'
  readonly dependencies = []
  readonly minAppVersion = '1.0.0'
  readonly permissions = ['filesystem', 'shell']

  // 配置项（使用 any 类型）
  readonly search_regexps: any[] = []
  readonly logs: any = { level: 'info', maxEntries: 100, persist: true, format: 'simple' }
  readonly configs: any = { properties: {}, required: [], defaults: {} }

  // 生命周期方法（无 override 修饰符）
  async onLoad(): Promise<void> {
    console.log('Plugin loaded')
  }

  async onActivate(): Promise<void> {
    console.log('Plugin activated')
  }

  async onDeactivate(): Promise<void> {
    console.log('Plugin deactivated')
  }

  async onUnload(): Promise<void> {
    console.log('Plugin unloaded')
  }

  getMetadata(): any {
    return this.metadata
  }

  // 使用 Tauri API 的示例方法
  private async useFileSystem(): Promise<void> {
    try {
      const fs = await (window as any).__importModule('@tauri-apps/plugin-fs')
      const exists = await fs.exists('/some/path')
      console.log('Path exists:', exists)
    } catch (error) {
      console.error('Failed to access filesystem:', error)
    }
  }

  private async openFile(path: string): Promise<void> {
    try {
      const opener = await (window as any).__importModule('@tauri-apps/plugin-opener')
      await opener.openPath(path)
    } catch (error) {
      console.error('Failed to open file:', error)
    }
  }
}

// 全局变量导出（用于 eval 环境）
if (typeof window !== 'undefined') {
  // 将插件实例暴露到全局 __pluginInstances
  if (typeof (window as any).__pluginInstances === 'object') {
    const pluginInstance = new ExamplePlugin()
    ;(window as any).__pluginInstances['example-plugin'] = pluginInstance
    console.log('[ExamplePlugin] Exported instance to global __pluginInstances')
  }
}
```

## 开发流程

1. **创建插件文件**：使用上述模板创建 TypeScript 插件文件
2. **实现业务逻辑**：根据需要实现具体的插件功能
3. **编译插件**：运行 `npm run compile:plugins` 编译为 JavaScript
4. **测试插件**：在应用中测试插件功能

## 调试技巧

### 1. 使用控制台日志
```typescript
console.log('[PluginName] Debug message:', data)
```

### 2. 检查全局变量
```typescript
console.log('Module cache:', (window as any).__moduleCache)
console.log('Plugin instances:', (window as any).__pluginInstances)
```

### 3. 错误处理
```typescript
try {
  const module = await (window as any).__importModule('module-name')
  // 使用模块
} catch (error) {
  console.error('Module import failed:', error)
  // 降级处理
}
```

## 常见问题

### Q: 为什么不能使用标准的 import 语句？
A: 插件代码通过 eval 执行，eval 环境不支持 ES6 模块导入。需要使用运行时的全局函数。

### Q: 为什么要移除 override 修饰符？
A: 在 eval 环境中，基类可能被解析为 `any` 类型，TypeScript 编译器无法正确识别继承关系。

### Q: 如何添加新的 Tauri 模块支持？
A: 在 `src/main.ts` 的 `importModule` 函数中添加新的 case 分支。

### Q: 插件如何与主应用交互？
A: 通过 `this._api` 对象提供的 API 方法，如 `this.log()`、`this.sendNotification()` 等。

## 最佳实践

1. **错误处理**：始终为异步操作添加 try-catch
2. **类型安全**：虽然使用 any，但在注释中说明预期的类型结构
3. **资源清理**：在 `onDeactivate` 和 `onUnload` 中清理资源
4. **日志记录**：使用 `this.log()` 方法记录重要操作
5. **配置管理**：合理使用存储 API 保存插件配置

## 更新历史

- **v1.0.0** (2025-08-19): 初始版本，基于 eval 环境插件开发经验总结
