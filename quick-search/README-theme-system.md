# 独立轻量化样式系统

## 概述

这是为 Quick Search 项目设计的完全独立的轻量化样式系统，支持深色/浅色模式、响应式布局和动画效果。系统不依赖任何外部CSS框架，提供完整的主题管理能力。

## 特性

### 🎨 主题系统

- **深色/浅色模式**: 自动响应系统偏好设置
- **CSS变量驱动**: 基于CSS自定义属性的完整主题系统
- **动态切换**: 支持运行时主题切换，无需页面刷新
- **本地存储**: 主题偏好自动保存到本地存储

### 📱 响应式设计

- **移动优先**: 从移动设备开始设计，逐步增强
- **灵活断点**: 支持手机(≤640px)、平板(641-1024px)、桌面(≥1025px)
- **自适应布局**: 内容自动适应不同屏幕尺寸
- **触摸友好**: 移动设备上的交互体验优化

### ✨ 动画效果

- **性能优化**: 使用GPU加速的transform和opacity动画
- **用户偏好**: 自动检测并尊重用户的动画偏好设置
- **流畅过渡**: 所有状态变化都有平滑的过渡效果
- **加载动画**: 提供各种加载指示器和状态反馈

### ♿ 辅助功能

- **键盘导航**: 完整的键盘操作支持
- **屏幕阅读器**: 语义化HTML和ARIA属性
- **高对比度**: 支持高对比度显示模式
- **焦点管理**: 清晰的焦点指示和管理

## 文件结构

```
quick-search/
├── theme-system.css          # 核心主题系统样式
├── theme-manager.js          # 主题管理JavaScript模块
├── component-integration.css # 组件集成适配器
├── test-theme-system.html    # 主题系统测试页面
└── README-theme-system.md    # 本文档
```

## 使用方法

### 基础使用

1. **引入样式文件**:

```html
<!-- 核心主题系统 -->
<link rel="stylesheet" href="theme-system.css" />
<!-- 组件集成（如果使用现有组件） -->
<link rel="stylesheet" href="component-integration.css" />
```

2. **引入JavaScript模块**:

```html
<script src="theme-manager.js"></script>
```

3. **使用CSS变量**:

```css
.my-component {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
```

### 主题管理

#### JavaScript API

```javascript
// 获取主题管理器实例
const themeManager = window.themeManager

// 设置主题
themeManager.setTheme('dark') // 深色模式
themeManager.setTheme('light') // 浅色模式
themeManager.setTheme('auto') // 自动模式（跟随系统）

// 切换主题
themeManager.toggleTheme()

// 获取当前主题
const currentTheme = themeManager.currentTheme
const effectiveTheme = themeManager.getEffectiveTheme()

// 监听主题变化
window.addEventListener('themechange', event => {
  console.log('主题已切换:', event.detail.effectiveTheme)
})
```

#### Vue组件

```vue
<template>
  <ThemeToggle />
</template>

<script>
export default {
  components: {
    ThemeToggle,
  },
}
</script>
```

### 响应式工具

```javascript
// 获取当前断点
const breakpoint = window.ResponsiveUtils.getCurrentBreakpoint()

// 检查设备类型
const isMobile = window.ResponsiveUtils.isMobile()
const isTablet = window.ResponsiveUtils.isTablet()
const isDesktop = window.ResponsiveUtils.isDesktop()

// 监听窗口大小变化
const cleanup = window.ResponsiveUtils.onResize(() => {
  console.log('窗口大小已变化')
})

// 清理监听器
cleanup()
```

### 动画工具

```javascript
// 检查是否启用动画
const animationEnabled = window.AnimationUtils.isAnimationEnabled()

// 动画效果
await window.AnimationUtils.fadeIn(element, 300)
await window.AnimationUtils.fadeOut(element, 300)
await window.AnimationUtils.slideIn(element, 'down', 300)
```

## CSS变量参考

### 颜色系统

```css
/* 主要颜色 */
--color-primary: #3b82f6;
--color-success: #10b981;
--color-warning: #f59e0b;
--color-danger: #ef4444;

/* 背景色 */
--bg-primary: rgba(255, 255, 255, 0.95);
--bg-secondary: rgba(248, 250, 252, 0.9);
--bg-overlay: rgba(0, 0, 0, 0.8);
--bg-glass: rgba(255, 255, 255, 0.1);

/* 文本色 */
--text-primary: #1f2937;
--text-secondary: #6b7280;
--text-tertiary: #9ca3af;

/* 边框色 */
--border-primary: rgba(0, 0, 0, 0.1);
--border-secondary: rgba(0, 0, 0, 0.05);
--border-focus: var(--color-primary);
```

### 间距系统

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

### 圆角系统

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### 字体系统

```css
/* 字体大小 */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;

/* 字重 */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* 行高 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### 阴影系统

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.3);
```

### 过渡动画

```css
--transition-fast: 0.15s ease-out;
--transition-normal: 0.2s ease-out;
--transition-slow: 0.3s ease-out;
```

## 深色模式

深色模式通过 `.dark` 类和 `[data-theme="dark"]` 属性选择器自动应用。所有颜色变量在深色模式下都有对应的深色版本。

```css
.dark {
  --bg-primary: rgba(31, 41, 55, 0.95);
  --text-primary: #f9fafb;
  --border-primary: rgba(255, 255, 255, 0.1);
  /* ... 更多深色模式变量 */
}
```

## 响应式断点

```css
/* 移动设备 */
@media (max-width: 640px) {
}

/* 平板设备 */
@media (min-width: 641px) and (max-width: 1024px) {
}

/* 桌面设备 */
@media (min-width: 1025px) {
}
```

## 组件开发指南

### 1. 使用CSS变量

始终使用CSS变量而不是硬编码的颜色值：

```css
/* ✅ 正确 */
.my-button {
  background: var(--color-primary);
  color: white;
  border: 1px solid var(--color-primary);
}

/* ❌ 错误 */
.my-button {
  background: #3b82f6;
  color: white;
  border: 1px solid #3b82f6;
}
```

### 2. 遵循间距系统

```css
/* ✅ 正确 */
.my-component {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

/* ❌ 错误 */
.my-component {
  padding: 15px;
  margin-bottom: 25px;
}
```

### 3. 添加过渡动画

```css
.my-interactive-element {
  transition: all var(--transition-normal);
}

.my-interactive-element:hover {
  background: var(--bg-hover);
  transform: translateY(-1px);
}
```

### 4. 支持辅助功能

```css
.my-focusable-element:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .my-animated-element {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 测试

运行测试页面以验证主题系统：

```bash
# 在浏览器中打开
open test-theme-system.html
```

测试页面包含：

- 主题切换功能测试
- 颜色系统展示
- 响应式布局测试
- 动画效果演示
- 辅助功能检查

## 浏览器支持

- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+

### CSS变量支持

- CSS自定义属性 (CSS Variables)
- `prefers-color-scheme` 媒体查询
- `prefers-reduced-motion` 媒体查询
- `backdrop-filter` 属性 (部分支持)

## 性能特性

- **轻量级**: 核心CSS文件 < 15KB (gzipped < 4KB)
- **零依赖**: 不依赖任何外部CSS框架
- **GPU加速**: 使用transform和opacity进行动画
- **缓存友好**: CSS变量减少重复样式

## 迁移指南

### 从原有样式系统迁移

1. **替换硬编码颜色**:

```css
/* 旧代码 */
background: #ffffff;
color: #000000;

/* 新代码 */
background: var(--bg-primary);
color: var(--text-primary);
```

2. **更新间距值**:

```css
/* 旧代码 */
padding: 20px;
margin: 15px;

/* 新代码 */
padding: var(--spacing-lg);
margin: var(--spacing-md);
```

3. **添加主题切换支持**:

```javascript
// 初始化主题管理器
const themeManager = new ThemeManager()

// 添加主题切换按钮
;<ThemeToggle />
```

## 故障排除

### 常见问题

1. **CSS变量不生效**
   - 确保变量名称正确
   - 检查是否在正确的作用域中定义
   - 验证浏览器支持

2. **深色模式不切换**
   - 检查JavaScript是否正确加载
   - 确认主题管理器初始化
   - 验证CSS类是否正确应用

3. **动画不流畅**
   - 使用transform而不是改变布局属性
   - 检查是否启用了GPU加速
   - 验证用户的动画偏好设置

## 贡献指南

如需扩展主题系统：

1. 在 `theme-system.css` 中添加新的CSS变量
2. 确保深色模式有对应的变量定义
3. 更新 `component-integration.css` 中的组件适配
4. 在测试页面中添加相应的演示
5. 更新本文档

## 许可证

本主题系统遵循 MIT 许可证。
