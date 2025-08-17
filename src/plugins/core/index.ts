/**
 * 插件系统核心模块导出
 *
 * 这个文件统一导出插件系统的所有核心组件，
 * 方便其他模块进行导入和使用
 */

// 核心类
export { BasePlugin } from './BasePlugin'
export {
  createReactiveEventBus,
  EventBus,
  eventBusUtils,
  globalEventBus,
} from './EventBus'
export { PluginAutoStartService } from './PluginAutoStartService'
export { createReactivePluginManager, PluginManager } from './PluginManager'
export { PluginSettingsService } from './PluginSettingsService'

// 队列系统
export { BaseQueue } from './BaseQueue'
export {
  CircularQueue,
  DelayedQueue,
  FIFOQueue,
  PriorityQueue,
  QueueFactory,
} from './QueueFactory'
export { TaskExecutor } from './TaskExecutor'

// 任务调度系统 (Task 2)
export { default as ConcurrencyController } from './ConcurrencyController'
export {
  globalSchedulerMonitor,
  default as SchedulerPerformanceMonitor,
} from './SchedulerPerformanceMonitor'
export { default as TaskScheduler } from './TaskScheduler'

// 错误处理和监控系统 (Task 3)
export { default as DeadLetterQueue } from './DeadLetterQueue'
export { default as QueueMonitor } from './QueueMonitor'
export { default as RetryHandler } from './RetryHandler'

// 测试功能 (开发环境)
// export {
//   runQueueTests, testDelayedQueue, testFIFOQueue,
//   testPriorityQueue, testTaskExecutor
// } from './QueueTest'

export {
  runSchedulerTests,
  testConcurrencyController,
  testMixedMode,
  testModeSwitch,
  testParallelMode,
  testRateLimit,
  testSerialMode,
  testTaskCancellation,
} from './SchedulerTest'

// 工具函数
export { usePluginStore } from '@/stores/plugin'

// 类型定义 (从 types 模块重新导出，方便使用)
export type {
  EventListener,
  EventListenerOptions,
  ITaskQueue,
  PluginAPI,
  PluginConfiguration,
  PluginEvent,
  PluginEventType,
  PluginInfo,
  PluginLifecycleEvent,
  PluginMetadata,
  PluginRegistryEntry,
  PluginState,
  PluginStats,
  QueueConfig,
  QueueEventContext,
  QueueStats,
  QueueType,
  Task,
  TaskExecutorOptions,
  TaskExecutorStats,
  TaskMetadata,
  TaskState,
} from '@/types/plugin'

// 导入核心类用于函数内部使用
import type { PluginMetadata } from '@/types/plugin'
import { BasePlugin } from './BasePlugin'
import { EventBus } from './EventBus'
import { PluginManager } from './PluginManager'

/**
 * 插件系统快速初始化函数
 *
 * @param config 插件系统配置
 * @returns 插件管理器实例
 */
export function createPluginSystem(config?: {
  maxPlugins?: number
  autoActivate?: boolean
  enableSandbox?: boolean
  sandboxTimeout?: number
  loadTimeout?: number
}) {
  const eventBus = new EventBus()
  const pluginManager = new PluginManager(eventBus, config)

  return {
    eventBus,
    pluginManager,

    // 便捷方法
    async register(
      pluginClass: new () => BasePlugin,
      metadata: PluginMetadata,
    ) {
      return await pluginManager.register(pluginClass, metadata)
    },

    async activate(pluginId: string) {
      return await pluginManager.activate(pluginId)
    },

    async deactivate(pluginId: string) {
      return await pluginManager.deactivate(pluginId)
    },

    getPlugin(pluginId: string) {
      return pluginManager.getPlugin(pluginId)
    },

    getAllPlugins() {
      return pluginManager.getAllPlugins()
    },

    getStats() {
      return pluginManager.getStats()
    },

    async destroy() {
      return await pluginManager.destroy()
    },
  }
}

/**
 * 默认配置
 */
export const defaultPluginConfig = {
  maxPlugins: 100,
  autoActivate: false,
  enableSandbox: true,
  sandboxTimeout: 5000,
  loadTimeout: 10000,
}

/**
 * 常用的插件事件类型常量
 */
export const PLUGIN_EVENTS = {
  REGISTERED: 'plugin:registered' as const,
  BEFORE_LOAD: 'plugin:beforeLoad' as const,
  LOADED: 'plugin:loaded' as const,
  BEFORE_ACTIVATE: 'plugin:beforeActivate' as const,
  ACTIVATED: 'plugin:activated' as const,
  BEFORE_DEACTIVATE: 'plugin:beforeDeactivate' as const,
  DEACTIVATED: 'plugin:deactivated' as const,
  BEFORE_UNLOAD: 'plugin:beforeUnload' as const,
  UNLOADED: 'plugin:unloaded' as const,
  ERROR: 'plugin:error' as const,
  STATE_CHANGED: 'plugin:stateChanged' as const,
  CONFIG_CHANGED: 'plugin:configChanged' as const,
} as const

/**
 * 插件状态常量
 */
export const PLUGIN_STATES = {
  REGISTERED: 'registered' as const,
  UNLOADED: 'unloaded' as const,
  LOADING: 'loading' as const,
  LOADED: 'loaded' as const,
  ACTIVATING: 'activating' as const,
  ACTIVE: 'active' as const,
  DEACTIVATING: 'deactivating' as const,
  INACTIVE: 'inactive' as const,
  UNLOADING: 'unloading' as const,
  ERROR: 'error' as const,
} as const
