// 插件相关类型定义
// 扩展现有 components.ts 类型系统，确保与项目架构一致

import type { MenuItem } from 'primevue/menuitem'
import type { App, Component } from 'vue'
import type { Router } from 'vue-router'

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
  /** 搜索框正则规则 */
  search_regexps?: string[]
  /** 插件日志配置 */
  logs?: PluginLogConfig
  /** 插件配置定义 */
  configs?: PluginConfigDefinition
  /** 插件右键菜单 */
  contextMenus?: PluginContextMenu[]
  /** 插件快捷键 */
  hotkeys?: PluginHotkey[]
  /** 插件事件订阅 */
  subscriptions?: PluginSubscription[]
  /** 插件通知配置 */
  notifications?: PluginNotificationConfig
  /** 插件存储配置 */
  storage?: PluginStorageConfig
  /** 队列管理器配置 */
  queue?: PluginQueueConfig
  /** 插件构建器函数 */
  builder?: PluginBuilderFunction
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
  | 'queue:taskAdded'
  | 'queue:taskStarted'
  | 'queue:taskCompleted'
  | 'queue:taskFailed'
  | 'queue:taskCancelled'
  | 'queue:stateChanged'
  | 'queue:error'
  | 'scheduler:initialized'
  | 'scheduler:taskScheduled'
  | 'scheduler:taskCompleted'
  | 'scheduler:taskFailed'
  | 'scheduler:taskCancelled'
  | 'scheduler:allTasksCancelled'
  | 'scheduler:rateLimitExceeded'
  | 'scheduler:started'
  | 'scheduler:stopped'
  | 'scheduler:modeChanged'
  | 'scheduler:configUpdated'
  | 'scheduler:destroyed'
  | 'concurrency:initialized'
  | 'concurrency:adjusted'
  | 'concurrency:schedulerRegistered'
  | 'concurrency:schedulerUnregistered'
  | 'concurrency:configUpdated'
  | 'concurrency:destroyed'
  | 'scheduler:performanceMonitorStarted'
  | 'scheduler:performanceMonitorStopped'
  | 'scheduler:metricsUpdated'
  | 'scheduler:metricsReset'
  | 'scheduler:performanceMonitorDestroyed'
  | 'retry:taskSucceededAfterRetry'
  | 'retry:taskScheduled'
  | 'retry:taskStarted'
  | 'retry:taskFinallyFailed'
  | 'retry:taskCancelled'
  | 'retry:statsReset'
  | 'retry:configUpdated'
  | 'retry:handlerDestroyed'
  | 'deadLetter:queueInitialized'
  | 'deadLetter:taskAdded'
  | 'deadLetter:taskReprocessed'
  | 'deadLetter:reprocessFailed'
  | 'deadLetter:batchReprocessed'
  | 'deadLetter:taskRecovered'
  | 'deadLetter:tasksExpired'
  | 'deadLetter:analysisCompleted'
  | 'deadLetter:configUpdated'
  | 'deadLetter:queueCleared'
  | 'deadLetter:queueDestroyed'
  | 'deadLetter:taskProcessed'
  | 'monitor:alertTriggered'
  | 'monitor:thresholdExceeded'
  | 'monitor:reportGenerated'
  | 'monitor:initialized'
  | 'monitor:metricsCollected'
  | 'monitor:alertAcknowledged'
  | 'monitor:configUpdated'
  | 'monitor:destroyed'
  | 'download:taskAdded'
  | 'download:taskRemoved'
  | 'download:taskStarted'
  | 'download:taskPaused'
  | 'download:taskResumed'
  | 'download:taskCancelled'
  | 'download:taskRetrying'
  | 'download:progressUpdated'
  | 'download:taskCompleted'
  | 'download:taskFailed'
  | 'download:stateChanged'
  | 'download:historyAdded'
  | 'download:historyCleared'
  | 'download:configUpdated'
  | 'download:completedTasksCleared'
  | 'download:managerInitialized'
  | 'download:downloadCreated'
  | 'download:downloadCompleted'
  | 'download:downloadFailed'
  | 'download:batchDownloadsCreated'
  | 'download:allDownloadsPaused'
  | 'download:allDownloadsResumed'
  | 'download:allDownloadsCancelled'
  | 'download:managerConfigUpdated'
  | 'download:managerDestroyed'
  | 'download:progressStart'
  | 'download:progressUpdate'
  | 'download:progressEnd'
  | 'download:progressError'
  | 'download:progressPause'
  | 'download:progressResume'

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
}> { }

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

/**
 * 任务状态枚举
 */
export type TaskState =
  | 'pending'    // 等待执行
  | 'running'    // 正在执行
  | 'completed'  // 已完成
  | 'failed'     // 执行失败
  | 'cancelled'  // 已取消

/**
 * 任务接口
 */
export interface Task {
  /** 任务唯一标识符 */
  id: string
  /** 任务优先级 (数字越大优先级越高) */
  priority: number
  /** 任务执行函数 */
  execute: () => Promise<any>
  /** 成功回调 */
  onSuccess?: (result: any) => void
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 任务超时时间（毫秒） */
  timeout?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 任务元数据 */
  metadata?: Record<string, any>
  /** 任务状态 */
  state?: TaskState
  /** 创建时间 */
  createdAt?: Date
  /** 开始执行时间 */
  startedAt?: Date
  /** 完成时间 */
  completedAt?: Date
  /** 执行结果 */
  result?: any
  /** 错误信息 */
  error?: Error
}

/**
 * 任务元数据类型
 */
export type TaskMetadata = Record<string, any>

/**
 * 任务执行器选项
 */
export interface TaskExecutorOptions {
  /** 默认超时时间 */
  defaultTimeout?: number
  /** 启用资源监控 */
  enableResourceMonitoring?: boolean
  /** 最大并发数 */
  maxConcurrency?: number
}

/**
 * 任务执行器统计信息
 */
export interface TaskExecutorStats {
  /** 执行的任务总数 */
  totalExecuted: number
  /** 成功的任务数 */
  successCount: number
  /** 失败的任务数 */
  failureCount: number
  /** 平均执行时间 */
  averageExecutionTime: number
  /** 当前运行的任务数 */
  currentRunning: number
}

/**
 * 队列事件上下文
 */
export interface QueueEventContext {
  /** 队列ID */
  queueId: string
  /** 任务ID */
  taskId?: string
  /** 任务信息 */
  task?: Task
  /** 队列统计信息 */
  stats?: QueueStats
  /** 额外数据 */
  data?: Record<string, any>
}

/**
 * 队列统计信息
 */
export interface QueueStats {
  /** 总任务数 */
  totalTasks: number
  /** 等待中的任务数 */
  pendingTasks: number
  /** 正在执行的任务数 */
  runningTasks: number
  /** 已完成的任务数 */
  completedTasks: number
  /** 失败的任务数 */
  failedTasks: number
  /** 平均执行时间（毫秒） */
  averageExecutionTime: number
  /** 吞吐量（任务/秒） */
  throughput: number
}

/**
 * 队列配置
 */
export interface QueueConfig {
  /** 最大并发数 */
  concurrency?: number
  /** 自动启动 */
  autostart?: boolean
  /** 任务超时时间 */
  timeout?: number
  /** 是否收集结果 */
  results?: boolean
}

/**
 * 队列类型
 */
export type QueueType = 'fifo' | 'priority' | 'delayed' | 'circular'

/**
 * 任务队列接口
 */
export interface ITaskQueue {
  /** 添加任务到队列 */
  push(task: Task): Promise<string>
  /** 启动队列处理 */
  start(): Promise<void>
  /** 停止队列处理 */
  stop(): Promise<void>
  /** 获取队列统计信息 */
  getStats(): QueueStats
  /** 获取队列长度 */
  length: number
  /** 队列是否正在运行 */
  isRunning: boolean
}

// ===== 新增插件扩展类型定义 =====

/**
 * 插件日志配置
 */
export interface PluginLogConfig {
  /** 日志级别 */
  level?: 'debug' | 'info' | 'warn' | 'error'
  /** 最大日志条数 */
  maxEntries?: number
  /** 是否持久化 */
  persist?: boolean
  /** 日志格式 */
  format?: 'simple' | 'json' | 'detailed'
}

/**
 * 插件配置定义
 */
export interface PluginConfigDefinition {
  /** 配置项定义 */
  properties?: Record<string, PluginConfigProperty>
  /** 必填配置项 */
  required?: string[]
  /** 默认配置值 */
  defaults?: Record<string, unknown>
}

/**
 * 插件配置属性
 */
export interface PluginConfigProperty {
  /** 配置类型 */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  /** 配置标题 */
  title?: string
  /** 配置描述 */
  description?: string
  /** 默认值 */
  default?: unknown
  /** 可选值 */
  enum?: unknown[]
  /** 最小值 */
  minimum?: number
  /** 最大值 */
  maximum?: number
}

/**
 * 插件右键菜单
 */
export interface PluginContextMenu {
  /** 菜单ID */
  id: string
  /** 菜单标题 */
  title: string
  /** 菜单图标 */
  icon?: string
  /** 触发上下文 */
  contexts: PluginContextType[]
  /** 点击处理函数 */
  onClick?: (info: PluginContextMenuInfo) => void
  /** 子菜单 */
  children?: PluginContextMenu[]
}

/**
 * 插件上下文类型
 */
export type PluginContextType = 'selection' | 'link' | 'image' | 'page' | 'frame' | 'all'

/**
 * 插件右键菜单信息
 */
export interface PluginContextMenuInfo {
  /** 菜单ID */
  menuItemId: string
  /** 选中的文本 */
  selectionText?: string
  /** 链接URL */
  linkUrl?: string
  /** 页面URL */
  pageUrl?: string
}

/**
 * 插件快捷键
 */
export interface PluginHotkey {
  /** 快捷键ID */
  id: string
  /** 快捷键组合 */
  combination: string
  /** 快捷键描述 */
  description?: string
  /** 是否全局 */
  global?: boolean
  /** 触发处理函数 */
  handler: () => void
}

/**
 * 插件事件订阅
 */
export interface PluginSubscription {
  /** 事件名称 */
  event: PluginEventType | string
  /** 事件处理函数 */
  handler: (data?: unknown) => void
  /** 订阅选项 */
  options?: PluginSubscriptionOptions
}

/**
 * 插件订阅选项
 */
export interface PluginSubscriptionOptions {
  /** 是否只执行一次 */
  once?: boolean
  /** 优先级 */
  priority?: number
  /** 过滤条件 */
  filter?: (data?: unknown) => boolean
}

/**
 * 插件通知配置
 */
export interface PluginNotificationConfig {
  /** 默认通知选项 */
  defaults?: PluginNotificationOptions
  /** 通知模板 */
  templates?: Record<string, PluginNotificationTemplate>
}

/**
 * 插件通知选项
 */
export interface PluginNotificationOptions {
  /** 通知标题 */
  title?: string
  /** 通知内容 */
  message?: string
  /** 通知类型 */
  type?: 'info' | 'success' | 'warning' | 'error'
  /** 持续时间（毫秒） */
  duration?: number
  /** 是否可关闭 */
  closable?: boolean
  /** 通知图标 */
  icon?: string
}

/**
 * 插件通知模板
 */
export interface PluginNotificationTemplate {
  /** 模板标题 */
  title: string
  /** 模板内容 */
  message: string
  /** 模板类型 */
  type: 'info' | 'success' | 'warning' | 'error'
}

/**
 * 插件存储配置
 */
export interface PluginStorageConfig {
  /** 存储方式 */
  type?: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'file'
  /** 存储键前缀 */
  prefix?: string
  /** 是否加密 */
  encrypt?: boolean
  /** 存储限制（字节） */
  sizeLimit?: number
}

/**
 * 插件队列配置
 */
export interface PluginQueueConfig {
  /** 队列类型 */
  type?: QueueType
  /** 队列配置 */
  config?: QueueConfig
  /** 自定义队列实现 */
  custom?: boolean
}

/**
 * 插件构建器函数类型
 */
export type PluginBuilderFunction = (options?: PluginBuilderOptions) => unknown

/**
 * 插件构建器选项
 */
export interface PluginBuilderOptions {
  /** 构建环境 */
  env?: 'development' | 'production' | 'test'
  /** 构建配置 */
  config?: Record<string, unknown>
  /** API实例 */
  api?: unknown
  /** 应用实例 */
  app?: App
}
