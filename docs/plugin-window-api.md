# 插件窗口管理API文档

## 概述

Mira Launcher 现在提供了全新的插件窗口管理API，允许插件完全自定义窗口内容和行为。该API取代了之前的通用窗口模板方式，为插件开发者提供了更大的灵活性。

## 核心特性

- **自定义HTML内容**: 插件可以提供完整的HTML内容来创建窗口
- **基于URL的窗口**: 支持加载外部网页或本地文件
- **窗口控制API**: 提供完整的窗口操作接口
- **模态对话框**: 内置模态对话框支持
- **文件选择对话框**: 集成的文件选择功能
- **事件通信**: 窗口与主应用之间的双向通信

## API 接口

### PluginWindowAPI

```typescript
interface PluginWindowAPI {
  // 创建窗口
  createWindow(options: PluginWindowOptions): Promise<PluginWindow>
  createHTMLWindow(options: PluginWindowOptions & { html: string }): Promise<PluginWindow>
  createURLWindow(options: PluginWindowOptions & { url: string }): Promise<PluginWindow>
  
  // 窗口管理
  getCurrentWindow(): PluginWindow | null
  getAllWindows(): PluginWindow[]
  getWindow(id: string): PluginWindow | null
  closeAll(): Promise<void>
  
  // 对话框
  showModal(options: ModalOptions): Promise<string>
  showFileDialog(options: FileDialogOptions): Promise<string | string[] | null>
}
```

### PluginWindowOptions

```typescript
interface PluginWindowOptions {
  title: string
  width?: number           // 默认: 800
  height?: number          // 默认: 600
  x?: number              // 窗口X坐标
  y?: number              // 窗口Y坐标
  minWidth?: number       // 最小宽度
  minHeight?: number      // 最小高度
  maxWidth?: number       // 最大宽度
  maxHeight?: number      // 最大高度
  resizable?: boolean     // 默认: true
  center?: boolean        // 默认: true
  alwaysOnTop?: boolean   // 默认: false
  skipTaskbar?: boolean   // 默认: false
  decorations?: boolean   // 默认: true
  transparent?: boolean   // 默认: false
  modal?: boolean         // 默认: false
  parent?: string         // 父窗口ID
  url?: string           // 外部URL（用于createURLWindow）
  html?: string          // HTML内容（用于createHTMLWindow）
  devTools?: boolean     // 默认: false
}
```

### PluginWindow

```typescript
interface PluginWindow {
  id: string
  label: string
  
  // 窗口控制
  close(): Promise<void>
  focus(): Promise<void>
  hide(): Promise<void>
  show(): Promise<void>
  minimize(): Promise<void>
  maximize(): Promise<void>
  unmaximize(): Promise<void>
  
  // 窗口状态
  isMaximized(): Promise<boolean>
  isMinimized(): Promise<boolean>
  isVisible(): Promise<boolean>
  
  // 窗口属性
  setTitle(title: string): Promise<void>
  setSize(width: number, height: number): Promise<void>
  setPosition(x: number, y: number): Promise<void>
  setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>
  setResizable(resizable: boolean): Promise<void>
  
  // 事件通信
  emit(event: string, data?: unknown): Promise<void>
  listen(event: string, handler: (data?: unknown) => void): Promise<() => void>
  once(event: string, handler: (data?: unknown) => void): Promise<() => void>
}
```

## 使用示例

### 创建简单窗口

```typescript
// 创建默认窗口（空白模板）
const window = await this.api.window.createWindow({
  title: '我的插件窗口',
  width: 800,
  height: 600,
  center: true
})
```

### 创建自定义HTML窗口

```typescript
const customHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>自定义窗口</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .button { padding: 10px 20px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>这是我的自定义窗口</h1>
  <button class="button" onclick="closeWindow()">关闭窗口</button>
  
  <script>
    function closeWindow() {
      if (window.pluginAPI) {
        window.pluginAPI.close()
      }
    }
  </script>
</body>
</html>
`

const window = await this.api.window.createHTMLWindow({
  title: '自定义HTML窗口',
  html: customHtml,
  width: 600,
  height: 400
})
```

### 创建URL窗口

```typescript
const window = await this.api.window.createURLWindow({
  title: '外部网页',
  url: 'https://example.com',
  width: 1000,
  height: 700
})
```

### 显示模态对话框

```typescript
const result = await this.api.window.showModal({
  title: '确认操作',
  content: '<p>您确定要执行此操作吗？</p>',
  buttons: [
    { label: '确定', action: 'confirm', primary: true },
    { label: '取消', action: 'cancel' }
  ]
})

if (result === 'confirm') {
  // 用户点击了确定
}
```

### 显示文件选择对话框

```typescript
const files = await this.api.window.showFileDialog({
  title: '选择图片文件',
  filters: [
    { name: '图片文件', extensions: ['jpg', 'png', 'gif'] },
    { name: '所有文件', extensions: ['*'] }
  ],
  multiple: true
})

if (files) {
  console.log('选择的文件:', files)
}
```

### 窗口事件通信

```typescript
// 监听来自窗口的事件
window.listen('custom-event', (data) => {
  console.log('收到窗口事件:', data)
})

// 向窗口发送事件
window.emit('plugin-message', { type: 'update', data: 'some data' })
```

## 窗口内JavaScript API

在创建的窗口中，会自动提供 `window.pluginAPI` 对象，包含以下方法：

```javascript
window.pluginAPI = {
  // 关闭当前窗口
  close: () => void
  
  // 发送事件到插件
  emit: (event: string, data?: any) => Promise<void>
  
  // 监听来自插件的事件
  listen: (event: string, handler: (data?: any) => void) => Promise<() => void>
}
```

### 在窗口HTML中使用

```html
<script>
// 向插件发送数据
window.pluginAPI.emit('user-action', { action: 'button-clicked', value: 'test' })

// 监听插件事件
window.pluginAPI.listen('plugin-update', (data) => {
  console.log('插件更新:', data)
  document.getElementById('status').textContent = data.message
})

// 关闭窗口
function closeWindow() {
  window.pluginAPI.close()
}
</script>
```

## 最佳实践

1. **窗口生命周期管理**: 在插件卸载时确保关闭所有窗口
   ```typescript
   async onDeactivate() {
     await this.api.window.closeAll()
   }
   ```

2. **事件清理**: 监听事件时保存清理函数，在适当时候调用
   ```typescript
   const unlisten = await window.listen('event', handler)
   // 在需要时调用
   unlisten()
   ```

3. **错误处理**: 始终包装窗口操作在 try-catch 中
   ```typescript
   try {
     const window = await this.api.window.createWindow(options)
   } catch (error) {
     console.error('创建窗口失败:', error)
   }
   ```

4. **响应式设计**: 为不同的窗口尺寸设计响应式HTML
   ```css
   @media (max-width: 600px) {
     .container { padding: 10px; }
   }
   ```

## 迁移指南

如果您的插件之前使用了旧的窗口系统，请按以下步骤迁移：

1. 移除对 `plugin-window.html` 的依赖
2. 使用 `createHTMLWindow` 替代 `createWindow` 并提供自定义HTML
3. 更新事件处理逻辑使用新的 `listen`/`emit` API
4. 测试所有窗口功能确保正常工作

## 示例插件

参考 `test-plugins/window-demo-plugin.ts` 查看完整的示例实现。
