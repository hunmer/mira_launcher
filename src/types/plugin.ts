// 插件相关类型定义
// 扩展现有 components.ts 类型系统，确保与项目架构一致

import type { App, Component } from 'vue'
import type { Router } from 'vue-router'
import type { MenuItem } from 'primevue/menuitem'

/**
 * 插件状态枚举
 */
export type PluginState = 
  | 'registered'  // 已注册
  | 'unloaded'    // 未加载
  | 'loading'     // 加载中
  | 'loaded'      // 已加载
  | 'activating'  // 激活中
  | 'active'      // 已激活
  | 'deactivating' // 停用中
  | 'inactive'    // 已停用
  | 'unloading'   // 卸载中
  | 'error'       // 错误状态

/**
 * 插件元数据接口
 */
export interface PluginMetadata {
  /** 插件唯一标识符 */
  id: string
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version: string
  /** 插件描述 */
  description?: string
  /** 插件作者 */
  author?: string
  /** 插件图标 */
  icon?: string
  /** 插件主页 */
  homepage?: string
  /** 插件仓库地址 */
  repository?: string
  /** 插件许可证 */
  license?: string
  /** 插件关键词 */
  keywords?: string[]
  /** 插件依赖 */
  dependencies?: string[]
  /** 最小应用版本要求 */
  minAppVersion?: string
  /** 最大应用版本要求 */
  maxAppVersion?: string
  /** 插件权限要求 */
  permissions?: string[]
  /** 插件配置模式 */
  configSchema?: Record<string, unknown>
  /** 插件入口文件 */
  main?: string
  /** 插件样式文件 */
  style?: string[]
  /** 插件资源文件 */
  assets?: string[]
}

/**
 * 插件配置接口
 */
export interface PluginConfig {
  /** 插件是否启用 */
  enabled?: boolean
  /** 插件自定义配置 */
  [key: string]: unknown
}

/**
 * 插件信息接口
 * 包含插件的基本信息和运行时状态
 */
export interface PluginInfo {
  /** 插件元数据 */
  metadata: PluginMetadata
  /** 插件状态 */
  state: PluginState
  /** 插件配置 */
  config: PluginConfig
  /** 插件是否可配置 */
  configurable: boolean
  /** 插件错误信息 */
  error?: string
  /** 插件加载时间 */
  loadTime?: number
  /** 插件最后激活时间 */
  lastActivated?: Date
  /** 插件使用统计 */
  stats?: PluginStats
}

/**
 * 插件统计信息
 */
export interface PluginStats {
  /** 激活次数 */
  activationCount: number
  /** 总运行时间（毫秒） */
  totalRuntime: number
  /** 错误次数 */
  errorCount: number
  /** 最后错误时间 */
  lastError?: Date
  /** 内存使用（字节） */
  memoryUsage?: number
}

/**
 * 插件事件类型
 */
export type PluginEventType = 
  | 'plugin:registered'
  | 'plugin:beforeLoad'
  | 'plugin:loaded'
  | 'plugin:beforeActivate'
  | 'plugin:activated'
  | 'plugin:beforeDeactivate'
  | 'plugin:deactivated'
  | 'plugin:beforeUnload'
  | 'plugin:unloaded'
  | 'plugin:error'
  | 'plugin:stateChanged'
  | 'plugin:configChanged'
  | 'ui:componentRegistered'
  | 'ui:menuItemAdded'
  | 'ui:notificationShown'
  | 'system:beforeShutdown'
  | 'system:ready'

/**
 * 插件事件数据接口
 */
export interface PluginEvent<T = unknown> {
  /** 事件类型 */
  type: PluginEventType
  /** 事件数据 */
  data: T
  /** 事件时间戳 */
  timestamp: number
  /** 事件来源插件 ID */
  source?: string
  /** 事件是否可取消 */
  cancelable?: boolean
  /** 事件是否已被取消 */
  cancelled?: boolean
}

/**
 * 事件监听器函数类型
 */
export type EventListener<T = unknown> = (event: PluginEvent<T>) => void | Promise<void>

/**
 * 事件监听器选项
 */
export interface EventListenerOptions {
  /** 监听器优先级（数字越大优先级越高） */
  priority?: number
  /** 是否只执行一次 */
  once?: boolean
}

/**
 * 菜单 API 接口
 */
export interface MenuAPI {
  /** 注册菜单项 */
  register(items: MenuItem[], position?: string): void
  /** 注销菜单项 */
  unregister(itemId: string): void
  /** 更新菜单项 */
  update(itemId: string, item: Partial<MenuItem>): void
  /** 获取所有菜单项 */
  getAll(): MenuItem[]
}

/**
 * 快捷键 API 接口
 */
export interface ShortcutAPI {
  /** 注册快捷键 */
  register(shortcut: string, handler: () => void, description?: string): void
  /** 注销快捷键 */
  unregister(shortcut: string): void
  /** 获取所有快捷键 */
  getAll(): Array<{ shortcut: string; description?: string }>
  /** 检查快捷键冲突 */
  hasConflict(shortcut: string): boolean
}

/**
 * 存储 API 接口
 */
export interface StorageAPI {
  /** 获取数据 */
  get<T = unknown>(key: string): T | null
  /** 设置数据 */
  set<T = unknown>(key: string, value: T): boolean
  /** 删除数据 */
  remove(key: string): boolean
  /** 清空所有数据 */
  clear(): boolean
  /** 获取所有键 */
  keys(): string[]
  /** 检查键是否存在 */
  has(key: string): boolean
}

/**
 * 通知 API 接口
 */
export interface NotificationAPI {
  /** 显示信息通知 */
  info(message: string, title?: string, options?: NotificationOptions): void
  /** 显示成功通知 */
  success(message: string, title?: string, options?: NotificationOptions): void
  /** 显示警告通知 */
  warn(message: string, title?: string, options?: NotificationOptions): void
  /** 显示错误通知 */
  error(message: string, title?: string, options?: NotificationOptions): void
  /** 显示自定义通知 */
  show(type: 'info' | 'success' | 'warn' | 'error', message: string, title?: string, options?: NotificationOptions): void
}

/**
 * 通知选项
 */
export interface NotificationOptions {
  /** 持续时间（毫秒），0 表示不自动关闭 */
  duration?: number
  /** 是否可关闭 */
  closable?: boolean
  /** 点击回调 */
  onClick?: () => void
  /** 关闭回调 */
  onClose?: () => void
}

/**
 * 插件组件定义
 */
export interface PluginComponentDefinition {
  /** Vue组件 */
  component: Component
  /** 组件元数据 */
  metadata?: {
    /** 组件描述 */
    description?: string
    /** 组件版本 */
    version?: string
    /** 组件标签 */
    tags?: string[]
    /** 是否为全局组件 */
    global?: boolean
  }
}

/**
 * 插件组件映射
 */
export type PluginComponents = Record<string, PluginComponentDefinition>

/**
 * 组件 API 接口
 */
export interface ComponentAPI {
  /** 注册全局组件 */
  register(name: string, component: Component): void
  /** 注销全局组件 */
  unregister(name: string): void
  /** 获取组件 */
  get(name: string): Component | undefined
  /** 检查组件是否存在 */
  has(name: string): boolean
}

/**
 * 路由 API 接口
 */
export interface RouteAPI {
  /** 获取路由实例 */
  getRouter(): Router
  /** 导航到指定路由 */
  push(to: string | object): Promise<void>
  /** 替换当前路由 */
  replace(to: string | object): Promise<void>
  /** 后退 */
  back(): void
  /** 前进 */
  forward(): void
  /** 获取当前路由 */
  getCurrentRoute(): object
}

/**
 * 主插件 API 接口
 * 提供给插件的完整 API 集合
 */
export interface PluginAPI {
  /** 应用信息 */
  app: {
    name: string
    version: string
    vue: App
  }
  /** 菜单 API */
  menu: MenuAPI
  /** 快捷键 API */
  shortcut: ShortcutAPI
  /** 存储 API */
  storage: StorageAPI
  /** 通知 API */
  notification: NotificationAPI
  /** 组件 API */
  component: ComponentAPI
  /** 路由 API */
  route: RouteAPI
  /** 事件系统 */
  events: {
    /** 监听事件 */
    on<T = unknown>(type: PluginEventType, listener: EventListener<T>, options?: EventListenerOptions): void
    /** 监听一次事件 */
    once<T = unknown>(type: PluginEventType, listener: EventListener<T>): void
    /** 取消监听事件 */
    off<T = unknown>(type: PluginEventType, listener: EventListener<T>): void
    /** 发布事件 */
    emit<T = unknown>(type: PluginEventType, data: T, source?: string): void
    /** 发布可取消事件 */
    emitCancelable<T = unknown>(type: PluginEventType, data: T, source?: string): boolean
  }
  /** 插件管理 */
  plugins: {
    /** 获取插件信息 */
    get(id: string): PluginInfo | undefined
    /** 获取所有插件 */
    getAll(): PluginInfo[]
    /** 检查插件是否存在 */
    has(id: string): boolean
    /** 检查插件是否激活 */
    isActive(id: string): boolean
  }
  /** 工具函数 */
  utils: {
    /** 生成唯一 ID */
    generateId(): string
    /** 深拷贝对象 */
    deepClone<T>(obj: T): T
    /** 防抖函数 */
    debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T
    /** 节流函数 */
    throttle<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T
  }
}

/**
 * 插件注册表项接口
 */
export interface PluginRegistryItem {
  /** 插件 ID */
  id: string
  /** 插件实例 */
  instance: unknown
  /** 插件元数据 */
  metadata: PluginMetadata
  /** 插件状态 */
  state: PluginState
  /** 插件配置 */
  config: PluginConfig
  /** 插件依赖 */
  dependencies: string[]
  /** 插件加载时间 */
  loadTime: number
  /** 插件文件路径 */
  filePath?: string
  /** 插件错误信息 */
  error?: string
}

/**
 * 插件注册表项（用于插件管理器）
 */
export interface PluginRegistryEntry {
  metadata: PluginMetadata
  instance: any // BasePlugin - 避免循环依赖
  state: PluginState
  registeredAt?: number
  loadedAt?: number
  activatedAt?: number
  deactivatedAt?: number
  configuration: PluginConfiguration
  dependencies: string[]
  dependents: string[]
  error?: unknown
}

/**
 * 插件配置
 */
export interface PluginConfiguration {
  [key: string]: unknown
}

/**
 * 插件生命周期事件数据
 */
export interface PluginLifecycleEvent extends PluginEvent<{
  pluginId: string
  metadata: PluginMetadata
  loadTime?: number
  activationTime?: number
  deactivationTime?: number
}> {}

/**
 * 插件加载器选项
 */
export interface PluginLoaderOptions {
  /** 插件目录路径 */
  pluginDir: string
  /** 是否启用开发模式 */
  dev?: boolean
  /** 是否启用热重载 */
  hotReload?: boolean
  /** 插件白名单 */
  whitelist?: string[]
  /** 插件黑名单 */
  blacklist?: string[]
  /** 最大加载时间（毫秒） */
  maxLoadTime?: number
}

/**
 * 插件验证结果
 */
export interface PluginValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误信息 */
  errors: string[]
  /** 警告信息 */
  warnings: string[]
}

/**
 * 插件依赖信息
 */
export interface PluginDependency {
  /** 依赖 ID */
  id: string
  /** 依赖版本要求 */
  version?: string
  /** 是否为可选依赖 */
  optional?: boolean
}
