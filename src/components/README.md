# 核心 UI 组件库使用指南

## 概述

Mira Launcher 的核心 UI 组件库基于 Naive UI 构建，提供了一系列经过封装和定制的组件，确保设计一致性和易用性。

## 通用组件 (Common)

### Button 组件

基于 Naive UI NButton 的按钮组件包装。

```vue
<template>
  <!-- 基础用法 -->
  <Button @click="handleClick">点击我</Button>
  
  <!-- 不同类型 -->
  <Button type="primary">主要按钮</Button>
  <Button type="secondary">次要按钮</Button>
  <Button type="success">成功按钮</Button>
  <Button type="warning">警告按钮</Button>
  <Button type="error">错误按钮</Button>
  
  <!-- 不同尺寸 -->
  <Button size="small">小按钮</Button>
  <Button size="medium">中等按钮</Button>
  <Button size="large">大按钮</Button>
  
  <!-- 加载状态 -->
  <Button :loading="isLoading">加载中</Button>
  
  <!-- 禁用状态 -->
  <Button disabled>禁用按钮</Button>
  
  <!-- 块级按钮 -->
  <Button block>块级按钮</Button>
</template>
```

**Props:**
- `type`: 按钮类型，可选值：`'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'`
- `size`: 按钮尺寸，可选值：`'small' | 'medium' | 'large'`
- `loading`: 是否显示加载状态
- `disabled`: 是否禁用
- `block`: 是否为块级按钮

### Input 组件

基于 Naive UI NInput 的输入框组件包装。

```vue
<template>
  <!-- 基础用法 -->
  <Input v-model:value="inputValue" placeholder="请输入内容" />
  
  <!-- 不同类型 -->
  <Input type="password" placeholder="请输入密码" />
  <Input type="textarea" placeholder="请输入多行内容" />
  
  <!-- 可清除 -->
  <Input v-model:value="inputValue" clearable />
  
  <!-- 前缀后缀 -->
  <Input v-model:value="inputValue">
    <template #prefix>
      <SearchIcon />
    </template>
    <template #suffix>
      .com
    </template>
  </Input>
</template>
```

**Props:**
- `value`: 输入值（支持 v-model）
- `type`: 输入类型，可选值：`'text' | 'password' | 'textarea'`
- `placeholder`: 占位符文本
- `disabled`: 是否禁用
- `readonly`: 是否只读
- `clearable`: 是否可清除
- `size`: 尺寸，可选值：`'small' | 'medium' | 'large'`

### Modal 组件

基于 Naive UI NModal 的模态框组件包装。

```vue
<template>
  <!-- 基础用法 -->
  <Modal v-model:show="showModal" title="模态框标题">
    <p>这是模态框内容</p>
    <template #action>
      <Button @click="showModal = false">取消</Button>
      <Button type="primary" @click="handleConfirm">确认</Button>
    </template>
  </Modal>
  
  <!-- 自定义头部 -->
  <Modal v-model:show="showModal">
    <template #header>
      <div class="flex items-center space-x-2">
        <SettingsIcon />
        <span>设置</span>
      </div>
    </template>
    <p>自定义头部内容</p>
  </Modal>
</template>
```

**Props:**
- `show`: 是否显示（支持 v-model）
- `title`: 模态框标题
- `width`: 模态框宽度
- `closable`: 是否显示关闭按钮
- `maskClosable`: 是否可通过点击遮罩关闭
- `closeOnEsc`: 是否可通过 ESC 键关闭

### Card 组件

基于 Naive UI NCard 的卡片组件包装。

```vue
<template>
  <!-- 基础用法 -->
  <Card title="卡片标题">
    <p>这是卡片内容</p>
  </Card>
  
  <!-- 可悬停 -->
  <Card title="可悬停卡片" hoverable>
    <p>鼠标悬停有阴影效果</p>
  </Card>
  
  <!-- 自定义头部 -->
  <Card>
    <template #header>
      <div class="flex items-center justify-between">
        <span>自定义头部</span>
        <SettingsIcon />
      </div>
    </template>
    <p>卡片内容</p>
    <template #footer>
      <Button>操作按钮</Button>
    </template>
  </Card>
</template>
```

### Tooltip 组件

基于 Naive UI NTooltip 的工具提示组件包装。

```vue
<template>
  <!-- 基础用法 -->
  <Tooltip content="这是提示内容">
    <Button>悬停显示提示</Button>
  </Tooltip>
  
  <!-- 不同位置 -->
  <Tooltip content="顶部提示" placement="top">
    <Button>顶部</Button>
  </Tooltip>
  
  <!-- 自定义内容 -->
  <Tooltip>
    <Button>自定义提示</Button>
    <template #content>
      <div class="p-2">
        <h4 class="font-bold">自定义标题</h4>
        <p>自定义内容</p>
      </div>
    </template>
  </Tooltip>
</template>
```

## UI 基础组件 (UI)

### LoadingSpinner 组件

加载指示器组件。

```vue
<template>
  <!-- 基础用法 -->
  <LoadingSpinner />
  
  <!-- 不同尺寸 -->
  <LoadingSpinner size="small" />
  <LoadingSpinner size="large" />
  <LoadingSpinner :size="32" />
  
  <!-- 带描述 -->
  <LoadingSpinner description="加载中..." />
  
  <!-- 自定义描述 -->
  <LoadingSpinner>
    <template #description>
      <div class="mt-2 text-sm text-gray-600">
        正在处理数据...
      </div>
    </template>
  </LoadingSpinner>
</template>
```

### NotificationContainer 组件

通知容器组件，应该包装在应用的根级别。

```vue
<template>
  <NConfigProvider>
    <NotificationContainer>
      <!-- 应用内容 -->
      <router-view />
    </NotificationContainer>
  </NConfigProvider>
</template>
```

### Badge 组件

徽章组件，用于显示数字或状态。

```vue
<template>
  <!-- 数字徽章 -->
  <Badge :value="5">
    <Button>消息</Button>
  </Badge>
  
  <!-- 点状徽章 -->
  <Badge dot>
    <Button>通知</Button>
  </Badge>
  
  <!-- 不同类型 -->
  <Badge :value="99" type="error">
    <Button>错误</Button>
  </Badge>
</template>
```

### Tag 组件

标签组件。

```vue
<template>
  <!-- 基础标签 -->
  <Tag>标签</Tag>
  
  <!-- 不同类型 -->
  <Tag type="primary">主要</Tag>
  <Tag type="success">成功</Tag>
  <Tag type="warning">警告</Tag>
  <Tag type="error">错误</Tag>
  
  <!-- 可关闭 -->
  <Tag closable @close="handleClose">可关闭标签</Tag>
  
  <!-- 可选择 -->
  <Tag checkable v-model:checked="checked">可选择标签</Tag>
</template>
```

### Empty 组件

空状态组件。

```vue
<template>
  <!-- 基础用法 -->
  <Empty />
  
  <!-- 自定义描述 -->
  <Empty description="没有找到相关数据" />
  
  <!-- 自定义图标和操作 -->
  <Empty description="暂无插件">
    <template #icon>
      <SearchIcon class="w-16 h-16 text-gray-400" />
    </template>
    <template #extra>
      <Button type="primary" @click="goToStore">
        前往插件商店
      </Button>
    </template>
  </Empty>
</template>
```

## 组件设计原则

### 1. 一致的 API 设计
所有组件都遵循相同的 API 设计模式：
- Props 使用 kebab-case
- 事件使用 kebab-case
- 支持 v-model 的组件使用 `update:value` 模式

### 2. 主题响应性
所有组件都支持深色模式，使用 Tailwind CSS 的 `dark:` 前缀。

### 3. TypeScript 类型安全
所有组件都提供完整的 TypeScript 类型定义。

### 4. 插槽支持
组件提供灵活的插槽系统，支持内容定制。

### 5. 事件透传
组件支持原生事件透传，使用 `v-bind="$attrs"`。

## 注意事项

1. **引入方式**: 使用 `@/components/common` 或 `@/components/ui` 路径引入
2. **样式覆盖**: 通过 `class` prop 传递自定义样式类
3. **事件处理**: 所有组件事件都支持 `.stop`、`.prevent` 等修饰符
4. **无障碍性**: 组件遵循 WAI-ARIA 标准，支持键盘导航

## 示例项目

参考 `src/App.vue` 中的组件使用示例，了解实际应用场景。
