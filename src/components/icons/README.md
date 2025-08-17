# 图标组件使用规范

## 概述

Mira Launcher 使用基于 `lucide-vue-next` 的统一图标组件系统。所有图标组件都继承自 `BaseIcon` 组件，提供一致的 API 和样式。

## 基础用法

### 导入图标组件

```typescript
// 单个导入
import {
  AppIcon,
  MinimizeIcon,
  MaximizeIcon,
  CloseIcon,
} from '@/components/icons'

// 或者具体路径导入
import AppIcon from '@/components/icons/AppIcon.vue'
```

### 使用图标

```vue
<template>
  <!-- 基础使用 -->
  <AppIcon />

  <!-- 自定义尺寸 -->
  <AppIcon :size="24" />

  <!-- 自定义颜色 -->
  <AppIcon color="#3b82f6" />

  <!-- 自定义样式类 -->
  <AppIcon class="hover:scale-110 transition-transform" />
</template>
```

## 组件 API

### 通用 Props

所有图标组件都支持以下 props：

| 属性  | 类型             | 默认值         | 说明         |
| ----- | ---------------- | -------------- | ------------ |
| size  | string \| number | 16             | 图标尺寸     |
| color | string           | 'currentColor' | 图标颜色     |
| class | string           | -              | 自定义样式类 |

### 事件

图标组件支持所有原生事件，如 `@click`、`@mouseenter` 等。

## 可用图标

### 应用图标

- `AppIcon` - 应用主图标 (Zap)

### 窗口控制图标

- `MinimizeIcon` - 最小化图标 (Minus)
- `MaximizeIcon` - 最大化图标 (Square)
- `CloseIcon` - 关闭图标 (X)

### 功能图标

- `SettingsIcon` - 设置图标 (Settings)
- `SearchIcon` - 搜索图标 (Search)

### 主题图标

- `SunIcon` - 浅色主题图标 (Sun)
- `MoonIcon` - 深色主题图标 (Moon)

## 颜色规范

### 默认颜色

- 继承父元素颜色 (`currentColor`)
- 支持主题切换的响应式颜色

### 预设颜色类

```css
/* 应用图标 */
.text-primary-600.dark:text-primary-400

/* 控制图标 */
.text-gray-600.dark:text-gray-400

/* 悬停效果 */
.hover:text-gray-800.dark:hover:text-gray-200

/* 关闭按钮特殊悬停 */
.hover:text-red-500.dark:hover:text-red-400
```

## 自定义图标

### 创建新图标组件

1. 在 `src/components/icons/` 目录下创建新文件
2. 使用 BaseIcon 组件作为包装器
3. 从 lucide-vue-next 导入所需图标

```vue
<template>
  <BaseIcon
    :icon-component="Heart"
    :size="size"
    :color="color"
    :class="iconClass"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Heart } from 'lucide-vue-next'
import BaseIcon from './BaseIcon.vue'

interface Props {
  size?: string | number
  color?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  color: 'currentColor',
})

const iconClass = computed(() => {
  return ['text-red-500 hover:text-red-600 transition-colors', props.class]
    .filter(Boolean)
    .join(' ')
})
</script>
```

4. 在 `index.ts` 中添加导出

```typescript
export { default as HeartIcon } from './HeartIcon.vue'
```

## 注意事项

1. **尺寸一致性** - 窗口控制图标默认使用 12px，其他图标默认 16px
2. **主题响应** - 所有图标都应支持深色模式
3. **过渡动画** - 建议为悬停状态添加 `transition-colors` 类
4. **无障碍性** - 在按钮中使用图标时，请添加适当的 `title` 或 `aria-label`

## 示例

```vue
<template>
  <div class="flex items-center space-x-2">
    <!-- 应用标题 -->
    <AppIcon class="w-4 h-4" />
    <span>Mira Launcher</span>

    <!-- 窗口控制 -->
    <button @click="minimize" title="最小化">
      <MinimizeIcon class="w-3 h-3" />
    </button>

    <!-- 主题切换 -->
    <button @click="toggleTheme">
      <SunIcon v-if="isDark" />
      <MoonIcon v-else />
    </button>
  </div>
</template>
```
