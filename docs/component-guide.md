# Mira Launcher 组件开发指南

## 项目概述

Mira Launcher 是一个基于 Tauri + Vue 3 + TypeScript 构建的轻量级桌面应用启动器，支持插件扩展和高度自定义。

## 技术栈

### 前端技术
- **Vue 3**: 渐进式 JavaScript 框架，使用 Composition API
- **TypeScript**: 提供类型安全和更好的开发体验
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Naive UI**: 现代化的 Vue 3 组件库
- **Pinia**: Vue 的状态管理库
- **Vue Router**: 官方路由管理器
- **Vite**: 现代化的前端构建工具

### 后端技术
- **Tauri**: 基于 Rust 的跨平台桌面应用框架
- **Rust**: 系统级编程语言，确保性能和安全

## 项目结构

```
src/
├── components/           # 组件目录
│   ├── common/          # 通用组件
│   ├── layout/          # 布局组件
│   ├── ui/              # UI 组件
│   ├── icons/           # 图标组件
│   ├── grid/            # 网格组件
│   └── business/        # 业务组件
├── views/               # 页面组件
├── stores/              # 状态管理
├── router/              # 路由配置
├── config/              # 配置文件
├── plugins/             # 插件系统
└── styles/              # 样式文件
```

## 组件开发规范

### 命名规范

1. **组件文件名**: 使用 PascalCase，如 `MainLayout.vue`
2. **组件名**: 与文件名保持一致
3. **Props**: 使用 camelCase
4. **Events**: 使用 kebab-case

### 组件结构

```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 导入
import { ref, computed } from 'vue'

// 接口定义
interface Props {
  // props 类型定义
}

interface Emits {
  // emits 类型定义
}

// Props 和 Emits
const props = withDefaults(defineProps<Props>(), {
  // 默认值
})

const emit = defineEmits<Emits>()

// 响应式数据
const state = ref()

// 计算属性
const computed = computed(() => {
  // 计算逻辑
})

// 方法
const methods = () => {
  // 方法实现
}
</script>

<style scoped>
/* 样式 */
</style>
```

### TypeScript 规范

1. **严格类型**: 启用严格模式，避免使用 `any`
2. **接口定义**: 为 Props、Emits、数据结构定义明确接口
3. **类型导入**: 使用 `import type` 导入类型

### 样式规范

1. **Tailwind 优先**: 优先使用 Tailwind CSS 类
2. **Scoped 样式**: 使用 `scoped` 避免样式污染
3. **暗黑模式**: 支持深色主题，使用 `dark:` 前缀

## 全局组件系统

### 组件注册

项目使用插件系统自动注册全局组件：

```typescript
// src/plugins/components.ts
import { registerGlobalComponents } from '@/plugins/components'

// 自动注册所有分类目录下的组件
registerGlobalComponents(app)
```

### 组件分类

#### 1. Common Components (通用组件)
基础复用组件，如基础包装器等。

#### 2. Layout Components (布局组件)
- `MainLayout`: 主布局容器
- `TitleBar`: 标题栏
- `WindowControls`: 窗口控制
- `MainContent`: 主内容区域
- `Container`: 通用容器
- `Divider`: 分割线

#### 3. UI Components (UI 组件)
- `Button`: 按钮组件
- `Input`: 输入框组件
- `Modal`: 模态框组件
- `Card`: 卡片组件
- `LoadingSpinner`: 加载动画
- `NotificationContainer`: 通知容器

#### 4. Icon Components (图标组件)
- `AppIcon`: 应用图标（基于 lucide-vue-next）
- `BaseIcon`: 图标基础组件

#### 5. Grid Components (网格组件)
网格布局相关组件。

#### 6. Business Components (业务组件)
特定业务逻辑组件。

## 路由系统

### 路由配置

```typescript
// src/router/index.ts
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      transition: 'fade',
      keepAlive: true
    }
  }
]
```

### 路由元信息

- `title`: 页面标题
- `transition`: 过渡动画类型 ('fade', 'slide', 'scale')
- `keepAlive`: 是否缓存组件
- `requiresAuth`: 是否需要认证

### 路由过渡动画

支持三种内置过渡动画：
- `fade`: 淡入淡出
- `slide`: 滑动效果
- `scale`: 缩放效果

## 状态管理

使用 Pinia 进行状态管理：

### Theme Store (主题管理)
```typescript
// src/stores/theme.ts
export const useThemeStore = defineStore('theme', {
  state: () => ({
    themeMode: 'auto' as 'light' | 'dark' | 'auto'
  }),
  actions: {
    toggleTheme() {
      // 切换主题逻辑
    }
  }
})
```

### App Store (应用状态)
```typescript
// src/stores/app.ts
export const useAppStore = defineStore('app', {
  state: () => ({
    isLoading: false,
    notifications: []
  })
})
```

## 开发最佳实践

### 1. 组件设计原则
- **单一职责**: 每个组件只负责一个功能
- **可复用性**: 设计通用的、可配置的组件
- **类型安全**: 使用 TypeScript 确保类型安全

### 2. 性能优化
- **懒加载**: 路由组件使用动态导入
- **缓存**: 适当使用 keep-alive 缓存组件
- **异步组件**: 大型组件使用异步加载

### 3. 测试策略
- **单元测试**: 测试组件的核心逻辑
- **集成测试**: 测试组件间的交互
- **E2E 测试**: 测试完整的用户流程

### 4. 代码质量
- **ESLint**: 使用 ESLint 检查代码质量
- **Prettier**: 统一代码格式
- **Husky**: Git hooks 确保代码质量

## 构建和部署

### 开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check
```

### 生产构建
```bash
# 构建应用
npm run build

# 构建 Tauri 应用
npm run tauri:build
```

## 插件开发

### 插件结构
```typescript
interface Plugin {
  name: string
  version: string
  description: string
  main: string
  dependencies?: string[]
}
```

### 插件 API
```typescript
// 插件主文件
export default {
  install(app: App) {
    // 插件安装逻辑
  }
}
```

## 故障排除

### 常见问题

1. **TypeScript 类型错误**
   - 检查 `tsconfig.json` 配置
   - 确保类型定义正确

2. **样式不生效**
   - 检查 Tailwind CSS 配置
   - 确保使用 `scoped` 样式

3. **组件未注册**
   - 检查组件导出是否正确
   - 确认全局注册插件运行

### 调试技巧

1. **Vue DevTools**: 使用 Vue 开发者工具调试
2. **Console 日志**: 使用 `console.log` 调试状态
3. **类型检查**: 运行 `npm run type-check` 检查类型

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

---

最后更新时间: 2024年1月
版本: 1.0.0
