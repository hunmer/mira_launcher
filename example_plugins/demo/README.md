# 插件示例 (Demo Plugin)

这是一个展示 Mira Launcher 插件系统各项功能和能力的综合示例插件。

## 功能特性

### 🎛️ 核心功能
- **网格组件**: 创建可交互的演示组件，支持计数器、颜色变换、状态保存等功能
- **专属页面**: 提供完整的演示页面，展示插件系统的各项能力
- **菜单集成**: 在应用菜单中添加插件专属的功能选项
- **快捷键支持**: 注册多个快捷键，快速访问插件功能
- **主题系统**: 提供自定义主题，支持明暗模式自适应

### 💾 存储功能
- 插件数据持久化存储
- 存储变化实时监听
- 数据导入导出功能
- 存储使用量统计

### 📢 通知系统
- 多种类型通知演示（信息、成功、警告、错误）
- 带操作按钮的交互式通知
- 通知队列管理

### 📊 统计监控
- 组件创建数量统计
- 插件运行时间监控
- 用户交互次数计数
- 存储空间使用监控

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+D` | 打开演示模态框 |
| `Ctrl+Alt+W` | 快速添加演示组件 |
| `Ctrl+Alt+N` | 演示通知功能 |

## 菜单功能

插件在主菜单中提供以下选项：
- 添加演示组件
- 打开演示页面
- 切换演示主题
- 存储功能演示
- 通知功能演示

## API 使用示例

这个插件展示了以下 Mira Launcher Plugin API 的使用：

### 网格系统
```typescript
// 注册组件类型
api.grid.registerItemType('demo-widget', DemoWidget, validator, defaultData)

// 添加组件实例
api.grid.addItem({ type: 'demo-widget', data: componentData })
```

### 页面系统
```typescript
// 注册页面
api.page.registerPage('demo-page', DemoPage, metadata)

// 激活页面
api.page.activate('demo-page')
```

### 主题系统
```typescript
// 注册主题
api.theme.register({
  name: 'demo-theme',
  mode: 'auto',
  cssVariables: { ... },
  styles: { ... }
})
```

### 存储系统
```typescript
// 数据存储
await api.storage.set('key', value)

// 数据读取
const value = await api.storage.get('key')

// 监听变化
api.storage.watch('key', callback)
```

### 通知系统
```typescript
// 显示通知
api.notifications.show('消息', 'success', {
  duration: 3000,
  actions: [{ label: '操作', action: callback }]
})
```

### 快捷键系统
```typescript
// 注册快捷键
api.shortcuts.register('ctrl+shift+d', callback)
```

### 菜单系统
```typescript
// 添加菜单项
api.menu.addMenuItem({
  id: 'menu-id',
  label: '菜单标签',
  icon: 'pi pi-icon',
  submenu: [...]
})
```

## 组件演示

### DemoWidget 组件
- 可自定义颜色的卡片组件
- 内置计数器功能
- 支持状态保存和加载
- 实时统计和信息显示

### DemoPage 页面
- 完整的功能演示页面
- API 功能测试界面
- 插件统计信息展示
- 数据导出和重置功能

## 开发特性

### 热重载支持
开发模式下支持代码热重载，修改后自动更新。

### 性能监控
自动监控插件性能，在开发模式下提供详细的性能报告。

### 错误处理
完善的错误处理机制，确保插件稳定运行。

### 调试工具
提供丰富的调试信息和工具函数。

## 安装和使用

1. 将插件文件复制到 `example_plugins/demo` 目录
2. 在插件管理器中激活插件
3. 使用快捷键 `Ctrl+Shift+D` 或菜单选项开始体验

## 技术细节

- **Vue 3 Composition API**: 使用最新的 Vue 3 语法
- **TypeScript**: 完整的类型定义支持
- **响应式设计**: 适配不同屏幕尺寸
- **主题适配**: 支持明暗主题切换
- **国际化准备**: 预留多语言支持接口

## 许可证

MIT License

## 作者

Mira Team

---

*这个插件是学习和了解 Mira Launcher 插件开发的最佳起点！*
