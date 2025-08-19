/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAddEntryAPI } from '@/plugins/api/AddEntryAPI'
import { createShortcutManager } from '@/plugins/api/ShortcutAPI'
import type {
  EventListener,
  EventListenerOptions,
  PluginConfiguration,
  PluginEventType,
  PluginLifecycleEvent,
  PluginMetadata,
  PluginRegistryEntry,
  PluginState,
  ShortcutAPI,
} from '@/types/plugin'
import { reactive, type Ref } from 'vue'
import { BasePlugin } from './BasePlugin'
import { EventBus } from './EventBus'

/**
 * 插件管理器配置
 */
interface PluginManagerConfig {
  maxPlugins?: number
  allowDuplicates?: boolean
  autoActivate?: boolean
  enableSandbox?: boolean
  sandboxTimeout?: number
  loadTimeout?: number
}

/**
 * 插件管理器
 * 负责插件的注册、加载、激活、停用和卸载
 * 与现有 Pinia stores 和组件系统集成
 */
export class PluginManager {
  private plugins: Map<string, PluginRegistryEntry> = new Map()
  private loadedModules: Map<string, unknown> = new Map()
  private activationOrder: string[] = []
  private eventBus: EventBus
  private config: Required<PluginManagerConfig>
  private isDestroyed = false
  private globalShortcutManager = createShortcutManager()

  constructor(eventBus?: EventBus, config: PluginManagerConfig = {}) {
    this.eventBus = eventBus || new EventBus()
    this.config = {
      maxPlugins: config.maxPlugins || 100,
      allowDuplicates: config.allowDuplicates || false,
      autoActivate: config.autoActivate || false,
      enableSandbox: config.enableSandbox || true,
      sandboxTimeout: config.sandboxTimeout || 5000,
      loadTimeout: config.loadTimeout || 10000,
    }

    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听插件生命周期事件
    this.eventBus.on('plugin:beforeLoad', this.handleBeforeLoad.bind(this))
    this.eventBus.on('plugin:loaded', this.handleLoaded.bind(this))
    this.eventBus.on(
      'plugin:beforeActivate',
      this.handleBeforeActivate.bind(this),
    )
    this.eventBus.on('plugin:activated', this.handleActivated.bind(this))
    this.eventBus.on(
      'plugin:beforeDeactivate',
      this.handleBeforeDeactivate.bind(this),
    )
    this.eventBus.on('plugin:deactivated', this.handleDeactivated.bind(this))
    this.eventBus.on('plugin:beforeUnload', this.handleBeforeUnload.bind(this))
    this.eventBus.on('plugin:unloaded', this.handleUnloaded.bind(this))
    this.eventBus.on('plugin:error', this.handleError.bind(this))
  }

  /**
   * 注册插件
   */
  async register(
    pluginClass: new () => BasePlugin,
    metadata: PluginMetadata,
  ): Promise<boolean> {
    if (this.isDestroyed) {
      throw new Error('Plugin manager has been destroyed')
    }

    try {
      // 验证插件
      this.validatePlugin(pluginClass, metadata)

      // 检查重复
      if (!this.config.allowDuplicates && this.plugins.has(metadata.id)) {
        console.warn(
          `[PluginManager] Plugin ${metadata.id} is already registered`,
        )
        return false
      }

      // 检查最大插件数量
      if (this.plugins.size >= this.config.maxPlugins) {
        throw new Error(
          `Maximum number of plugins (${this.config.maxPlugins}) exceeded`,
        )
      }

      // 创建插件实例
      const pluginInstance = new pluginClass()

      // 设置插件API（仅对支持的插件）
      const pluginAPI = this.createPluginAPI(metadata.id)
      console.log(`[PluginManager] Creating API for plugin ${metadata.id}:`, {
        hasSetAPI: typeof pluginInstance._setAPI === 'function',
        hasInitialize: typeof (pluginInstance as any).initialize === 'function',
        apiKeys: Object.keys(pluginAPI),
      })
      
      if (typeof pluginInstance._setAPI === 'function') {
        pluginInstance._setAPI(pluginAPI)
        console.log(`[PluginManager] Set API for plugin ${metadata.id}`)
      } else if (typeof (pluginInstance as any).initialize === 'function') {
        // 尝试使用 initialize 方法（用于 plugin-sdk BasePlugin）
        (pluginInstance as any).initialize(pluginAPI)
        console.log(`[PluginManager] Initialized API for plugin ${metadata.id}`)
      } else {
        console.log(
          `[PluginManager] Plugin ${metadata.id} doesn't support API injection (external plugin)`,
        )
        // 对于不支持API的插件，我们可以将API作为属性添加
        const externalPlugin = pluginInstance as any
        if (!externalPlugin.api) {
          externalPlugin.api = pluginAPI
        }
      }

      const registryEntry: PluginRegistryEntry = {
        metadata,
        instance: pluginInstance,
        state: 'registered',
        registeredAt: Date.now(),
        configuration: {},
        dependencies: metadata.dependencies || [],
        dependents: [],
      }

      this.plugins.set(metadata.id, registryEntry)

      // 发布注册事件
      await this.eventBus.emit('plugin:registered', {
        pluginId: metadata.id,
        metadata,
      })

      console.log(
        `[PluginManager] Plugin ${metadata.id} registered successfully`,
      )

      // 自动激活（如果配置）
      if (this.config.autoActivate) {
        await this.activate(metadata.id)
      }

      return true
    } catch (error) {
      console.error(
        `[PluginManager] Failed to register plugin ${metadata.id}:`,
        error,
      )
      await this.eventBus.emit('plugin:error', {
        pluginId: metadata.id,
        error,
        operation: 'register',
      })
      return false
    }
  }

  /**
   * 从全局 __pluginInstances 获取插件实例
   * 用于 eval 执行的插件
   */
  private getPluginInstance(pluginId: string): BasePlugin | null {
    try {
      const globalWindow = window as unknown as {
        __pluginInstances?: Record<string, BasePlugin>
      }
      
      if (globalWindow.__pluginInstances && globalWindow.__pluginInstances[pluginId]) {
        return globalWindow.__pluginInstances[pluginId]
      }
      
      // 如果全局实例不存在，回退到注册时的实例
      const entry = this.plugins.get(pluginId)
      return entry?.instance || null
    } catch (error) {
      console.error(`[PluginManager] Error getting plugin instance for ${pluginId}:`, error)
      return null
    }
  }

  /**
   * 加载插件
   */
  async load(pluginId: string): Promise<boolean> {
    const entry = this.plugins.get(pluginId)
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (entry.state !== 'registered') {
      console.warn(
        `[PluginManager] Plugin ${pluginId} is not in registered state (current: ${entry.state})`,
      )
      return false
    }

    try {
      // 发布加载前事件
      const canLoad = await this.eventBus.emitCancelable('plugin:beforeLoad', {
        pluginId,
        metadata: entry.metadata,
      })

      if (!canLoad) {
        console.log(`[PluginManager] Plugin ${pluginId} load was cancelled`)
        return false
      }

      // 检查依赖
      await this.checkDependencies(pluginId)

      // 执行加载
      entry.state = 'loading'

      // 发布状态变化事件
      await this.eventBus.emit('plugin:stateChanged', {
        pluginId,
        metadata: entry.metadata,
        oldState: 'registered',
        newState: 'loading',
      })

      // 获取实际的插件实例（可能是从 __pluginInstances 或注册时的实例）
      const pluginInstance = this.getPluginInstance(pluginId)
      if (!pluginInstance) {
        throw new Error(`Plugin instance not found for ${pluginId}`)
      }

      // 创建插件API
      const pluginAPI = this.createPluginAPI(pluginId)

      // 确保插件实例有正确的 API 设置
      // 特别是从 __pluginInstances 获取的实例可能没有设置 API
      if (typeof pluginInstance._setAPI === 'function') {
        pluginInstance._setAPI(pluginAPI)
        console.log(`[PluginManager] Set API for global plugin instance ${pluginId} during load`)
      } else if (typeof (pluginInstance as any).initialize === 'function') {
        (pluginInstance as any).initialize(pluginAPI)
        console.log(`[PluginManager] Initialized API for global plugin instance ${pluginId} during load`)
      } else {
        // 直接设置 _api 属性
        (pluginInstance as any)._api = pluginAPI
        console.log(`[PluginManager] Directly set _api for global plugin instance ${pluginId} during load`)
      }

      const loadPromise = this.executeWithTimeout(
        () => pluginInstance.onLoad(pluginAPI as any, null as any),
        this.config.loadTimeout,
        `Plugin ${pluginId} load timeout`,
      )

      await loadPromise

      entry.state = 'loaded'
      entry.loadedAt = Date.now()

      // 发布状态变化事件
      await this.eventBus.emit('plugin:stateChanged', {
        pluginId,
        metadata: entry.metadata,
        oldState: 'loading',
        newState: 'loaded',
      })

      // 发布加载完成事件
      await this.eventBus.emit('plugin:loaded', {
        pluginId,
        metadata: entry.metadata,
        loadTime: entry.loadedAt! - (entry.registeredAt || entry.loadedAt!),
      })

      console.log(`[PluginManager] Plugin ${pluginId} loaded successfully`)
      return true
    } catch (error) {
      entry.state = 'error'
      entry.error = error
      console.error(`[PluginManager] Failed to load plugin ${pluginId}:`, error)

      await this.eventBus.emit('plugin:error', {
        pluginId,
        error,
        operation: 'load',
      })

      return false
    }
  }

  /**
   * 激活插件
   */
  async activate(pluginId: string): Promise<boolean> {
    const entry = this.plugins.get(pluginId)
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    // 确保插件已加载
    if (entry.state === 'registered') {
      const loaded = await this.load(pluginId)
      if (!loaded) {
        return false
      }
    }

    if (entry.state !== 'loaded') {
      console.warn(
        `[PluginManager] Plugin ${pluginId} is not in loaded state (current: ${entry.state})`,
      )
      return false
    }

    try {
      // 发布激活前事件
      const canActivate = await this.eventBus.emitCancelable(
        'plugin:beforeActivate',
        {
          pluginId,
          metadata: entry.metadata,
        },
      )

      if (!canActivate) {
        console.log(
          `[PluginManager] Plugin ${pluginId} activation was cancelled`,
        )
        return false
      }

      // 激活依赖插件
      await this.activateDependencies(pluginId)

      // 执行激活
      entry.state = 'activating'

      // 发布状态变化事件
      await this.eventBus.emit('plugin:stateChanged', {
        pluginId,
        metadata: entry.metadata,
        oldState: 'loaded',
        newState: 'activating',
      })

      // 获取实际的插件实例（可能是从 __pluginInstances 或注册时的实例）
      const pluginInstance = this.getPluginInstance(pluginId)
      if (!pluginInstance) {
        throw new Error(`Plugin instance not found for ${pluginId}`)
      }

      // 确保插件实例有正确的 API 设置
      // 特别是从 __pluginInstances 获取的实例可能没有设置 API
      const pluginAPI = this.createPluginAPI(pluginId)
      if (typeof pluginInstance._setAPI === 'function') {
        pluginInstance._setAPI(pluginAPI)
        console.log(`[PluginManager] Set API for global plugin instance ${pluginId}`)
      } else if (typeof (pluginInstance as any).initialize === 'function') {
        (pluginInstance as any).initialize(pluginAPI)
        console.log(`[PluginManager] Initialized API for global plugin instance ${pluginId}`)
      } else {
        // 直接设置 _api 属性
        (pluginInstance as any)._api = pluginAPI
        console.log(`[PluginManager] Directly set _api for global plugin instance ${pluginId}`)
      }

      await pluginInstance.onActivate()

      // 注册插件扩展功能
      await this.registerPluginExtensions(entry)

      entry.state = 'active'
      entry.activatedAt = Date.now()

      // 发布状态变化事件
      await this.eventBus.emit('plugin:stateChanged', {
        pluginId,
        metadata: entry.metadata,
        oldState: 'activating',
        newState: 'active',
      })

      // 记录激活顺序
      if (!this.activationOrder.includes(pluginId)) {
        this.activationOrder.push(pluginId)
      }

      // 发布激活完成事件
      await this.eventBus.emit('plugin:activated', {
        pluginId,
        metadata: entry.metadata,
        activationTime:
          entry.activatedAt! - (entry.loadedAt || entry.activatedAt!),
      })

      console.log(`[PluginManager] Plugin ${pluginId} activated successfully`)
      return true
    } catch (error) {
      entry.state = 'error'
      entry.error = error
      console.error(
        `[PluginManager] Failed to activate plugin ${pluginId}:`,
        error,
      )

      await this.eventBus.emit('plugin:error', {
        pluginId,
        error,
        operation: 'activate',
      })

      return false
    }
  }

  /**
   * 停用插件
   */
  async deactivate(pluginId: string): Promise<boolean> {
    const entry = this.plugins.get(pluginId)
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (entry.state !== 'active') {
      console.warn(
        `[PluginManager] Plugin ${pluginId} is not active (current: ${entry.state})`,
      )
      return false
    }

    try {
      // 发布停用前事件
      const canDeactivate = await this.eventBus.emitCancelable(
        'plugin:beforeDeactivate',
        {
          pluginId,
          metadata: entry.metadata,
        },
      )

      if (!canDeactivate) {
        console.log(
          `[PluginManager] Plugin ${pluginId} deactivation was cancelled`,
        )
        return false
      }

      // 停用依赖此插件的其他插件
      await this.deactivateDependents(pluginId)

      // 执行停用
      entry.state = 'deactivating'

      // 发布状态变化事件
      await this.eventBus.emit('plugin:stateChanged', {
        pluginId,
        metadata: entry.metadata,
        oldState: 'active',
        newState: 'deactivating',
      })

      // 获取实际的插件实例（可能是从 __pluginInstances 或注册时的实例）
      const pluginInstance = this.getPluginInstance(pluginId)
      if (!pluginInstance) {
        throw new Error(`Plugin instance not found for ${pluginId}`)
      }

      await pluginInstance.onDeactivate()
      entry.state = 'loaded'
      entry.deactivatedAt = Date.now()

      // 发布状态变化事件
      await this.eventBus.emit('plugin:stateChanged', {
        pluginId,
        metadata: entry.metadata,
        oldState: 'deactivating',
        newState: 'loaded',
      })

      // 从激活顺序中移除
      const index = this.activationOrder.indexOf(pluginId)
      if (index !== -1) {
        this.activationOrder.splice(index, 1)
      }

      // 发布停用完成事件
      await this.eventBus.emit('plugin:deactivated', {
        pluginId,
        metadata: entry.metadata,
        deactivationTime:
          entry.deactivatedAt! - (entry.activatedAt || entry.deactivatedAt!),
      })

      console.log(`[PluginManager] Plugin ${pluginId} deactivated successfully`)
      return true
    } catch (error) {
      entry.state = 'error'
      entry.error = error
      console.error(
        `[PluginManager] Failed to deactivate plugin ${pluginId}:`,
        error,
      )

      await this.eventBus.emit('plugin:error', {
        pluginId,
        error,
        operation: 'deactivate',
      })

      return false
    }
  }

  /**
   * 卸载插件
   */
  async unload(pluginId: string): Promise<boolean> {
    const entry = this.plugins.get(pluginId)
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    try {
      // 如果插件是活动状态，先停用
      if (entry.state === 'active') {
        const deactivated = await this.deactivate(pluginId)
        if (!deactivated) {
          return false
        }
      }

      // 发布卸载前事件
      const canUnload = await this.eventBus.emitCancelable(
        'plugin:beforeUnload',
        {
          pluginId,
          metadata: entry.metadata,
        },
      )

      if (!canUnload) {
        console.log(`[PluginManager] Plugin ${pluginId} unload was cancelled`)
        return false
      }

      // 执行卸载
      const previousState = entry.state
      entry.state = 'unloading'

      // 发布状态变化事件
      await this.eventBus.emit('plugin:stateChanged', {
        pluginId,
        metadata: entry.metadata,
        oldState: previousState,
        newState: 'unloading',
      })

      // 获取实际的插件实例（可能是从 __pluginInstances 或注册时的实例）
      const pluginInstance = this.getPluginInstance(pluginId)
      if (!pluginInstance) {
        throw new Error(`Plugin instance not found for ${pluginId}`)
      }

      await pluginInstance.onUnload()

      // 移除插件
      this.plugins.delete(pluginId)
      this.loadedModules.delete(pluginId)

      // 发布卸载完成事件
      await this.eventBus.emit('plugin:unloaded', {
        pluginId,
        metadata: entry.metadata,
      })

      console.log(`[PluginManager] Plugin ${pluginId} unloaded successfully`)
      return true
    } catch (error) {
      if (entry) {
        entry.state = 'error'
        entry.error = error
      }
      console.error(
        `[PluginManager] Failed to unload plugin ${pluginId}:`,
        error,
      )

      await this.eventBus.emit('plugin:error', {
        pluginId,
        error,
        operation: 'unload',
      })

      return false
    }
  }

  /**
   * 验证插件
   */
  private validatePlugin(
    pluginClass: new () => BasePlugin,
    metadata: PluginMetadata,
  ): void {
    if (!pluginClass || typeof pluginClass !== 'function') {
      throw new Error(
        'Plugin class is required and must be a constructor function',
      )
    }

    if (!metadata.id || typeof metadata.id !== 'string') {
      throw new Error('Plugin metadata must have a valid id')
    }

    if (!metadata.name || typeof metadata.name !== 'string') {
      throw new Error('Plugin metadata must have a valid name')
    }

    if (!metadata.version || typeof metadata.version !== 'string') {
      throw new Error('Plugin metadata must have a valid version')
    }

    // 验证版本格式（简单的语义版本检查）
    const versionRegex = /^\d+\.\d+\.\d+$/
    if (!versionRegex.test(metadata.version)) {
      throw new Error('Plugin version must follow semantic versioning (x.y.z)')
    }

    // 验证新字段
    this.validatePluginExtensions(metadata)
  }

  /**
   * 验证插件扩展字段
   */
  private validatePluginExtensions(metadata: PluginMetadata): void {
    // 验证搜索正则表达式
    if (metadata.search_regexps) {
      if (!Array.isArray(metadata.search_regexps)) {
        throw new Error('search_regexps must be an array of strings')
      }

      for (const regex of metadata.search_regexps) {
        if (typeof regex !== 'string') {
          throw new Error('search_regexps must contain only strings')
        }

        try {
          new RegExp(regex)
        } catch (error) {
          throw new Error(`Invalid regex pattern in search_regexps: ${regex}`)
        }
      }
    }

    // 验证日志配置
    if (metadata.logs) {
      const validLevels = ['debug', 'info', 'warn', 'error']
      if (metadata.logs.level && !validLevels.includes(metadata.logs.level)) {
        throw new Error(`Invalid log level: ${metadata.logs.level}`)
      }
    }

    // 验证右键菜单配置
    if (metadata.contextMenus) {
      if (!Array.isArray(metadata.contextMenus)) {
        throw new Error('contextMenus must be an array')
      }

      for (const menu of metadata.contextMenus) {
        if (!menu.id || !menu.title || !menu.contexts) {
          throw new Error(
            'contextMenus items must have id, title, and contexts',
          )
        }
      }
    }

    // 验证快捷键配置
    if (metadata.hotkeys) {
      if (!Array.isArray(metadata.hotkeys)) {
        throw new Error('hotkeys must be an array')
      }

      for (const hotkey of metadata.hotkeys) {
        if (!hotkey.id || !hotkey.combination || !hotkey.handler) {
          throw new Error(
            'hotkeys items must have id, combination, and handler',
          )
        }
      }
    }

    // 验证存储配置
    if (metadata.storage) {
      const validTypes = ['localStorage', 'sessionStorage', 'indexedDB', 'file']
      if (
        metadata.storage.type &&
        !validTypes.includes(metadata.storage.type)
      ) {
        throw new Error(`Invalid storage type: ${metadata.storage.type}`)
      }
    }

    // 验证队列配置
    if (metadata.queue) {
      const validQueueTypes = ['fifo', 'priority', 'delayed', 'circular']
      if (
        metadata.queue.type &&
        !validQueueTypes.includes(metadata.queue.type)
      ) {
        throw new Error(`Invalid queue type: ${metadata.queue.type}`)
      }
    }

    // 验证构建器函数
    if (metadata.builder && typeof metadata.builder !== 'function') {
      throw new Error('builder must be a function')
    }
  }

  /**
   * 注册插件扩展功能
   */
  private async registerPluginExtensions(
    entry: PluginRegistryEntry,
  ): Promise<void> {
    const { metadata, instance } = entry

    try {
      // 注册右键菜单
      if (metadata.contextMenus && metadata.contextMenus.length > 0) {
        console.log(
          `[PluginManager] Registering ${metadata.contextMenus.length} context menus for plugin ${metadata.id}`,
        )
        // 通过插件实例的保护方法注册
        if (typeof (instance as any).registerContextMenus === 'function') {
          (instance as any).registerContextMenus()
        }
      }

      // 注册快捷键
      if (metadata.hotkeys && metadata.hotkeys.length > 0) {
        console.log(
          `[PluginManager] Registering ${metadata.hotkeys.length} hotkeys for plugin ${metadata.id}`,
        )
        if (typeof (instance as any).registerHotkeys === 'function') {
          (instance as any).registerHotkeys()
        }
      }

      // 订阅事件
      if (metadata.subscriptions && metadata.subscriptions.length > 0) {
        console.log(
          `[PluginManager] Subscribing to ${metadata.subscriptions.length} events for plugin ${metadata.id}`,
        )
        if (typeof (instance as any).subscribeEvents === 'function') {
          (instance as any).subscribeEvents()
        }
      }

      // 初始化存储
      if (metadata.storage) {
        console.log(
          `[PluginManager] Initializing storage for plugin ${metadata.id}`,
        )
        if (typeof (instance as any).getStorage === 'function') {
          (instance as any).getStorage()
        }
      }

      // 初始化队列
      if (metadata.queue) {
        console.log(
          `[PluginManager] Initializing queue for plugin ${metadata.id}`,
        )
        if (typeof (instance as any).getQueue === 'function') {
          (instance as any).getQueue()
        }
      }

      // 执行构建器函数
      if (metadata.builder) {
        console.log(
          `[PluginManager] Executing builder function for plugin ${metadata.id}`,
        )
        if (typeof (instance as any).executeBuilder === 'function') {
          (instance as any).executeBuilder()
        }
      }

      console.log(
        `[PluginManager] Plugin extensions registered successfully for ${metadata.id}`,
      )
    } catch (error) {
      console.error(
        `[PluginManager] Failed to register extensions for plugin ${metadata.id}:`,
        error,
      )
      throw error
    }
  }

  /**
   * 检查依赖
   */
  private async checkDependencies(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId)
    if (!entry || !entry.dependencies?.length) {
      return
    }

    for (const depId of entry.dependencies) {
      const depEntry = this.plugins.get(depId)

      if (!depEntry) {
        throw new Error(`Dependency ${depId} not found for plugin ${pluginId}`)
      }

      if (depEntry.state === 'error') {
        throw new Error(
          `Dependency ${depId} is in error state for plugin ${pluginId}`,
        )
      }

      // 确保依赖已加载
      if (depEntry.state === 'registered') {
        await this.load(depId)
      }

      // 添加到依赖列表
      if (!depEntry.dependents.includes(pluginId)) {
        depEntry.dependents.push(pluginId)
      }
    }
  }

  /**
   * 激活依赖插件
   */
  private async activateDependencies(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId)
    if (!entry || !entry.dependencies?.length) {
      return
    }

    for (const depId of entry.dependencies) {
      const depEntry = this.plugins.get(depId)
      if (depEntry && depEntry.state === 'loaded') {
        await this.activate(depId)
      }
    }
  }

  /**
   * 停用依赖此插件的其他插件
   */
  private async deactivateDependents(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId)
    if (!entry || !entry.dependents?.length) {
      return
    }

    for (const dependentId of entry.dependents) {
      const dependentEntry = this.plugins.get(dependentId)
      if (dependentEntry && dependentEntry.state === 'active') {
        await this.deactivate(dependentId)
      }
    }
  }

  /**
   * 创建插件API
   */
  private createPluginAPI(pluginId: string): any {
    // 返回扩展的 API，包含 plugin-sdk.ts 需要的方法
    const api = {
      // 添加 plugin-sdk.ts 需要的基础方法
      log: (level: string, message: string, ...args: any[]) => {
        const logLevel = level as 'debug' | 'info' | 'warn' | 'error'
        console[logLevel](`[Plugin ${pluginId}] ${message}`, ...args)
      },
      sendNotification: (type: string, options: any) => {
        console.log(`[Plugin ${pluginId}] Notification:`, type, options)
        // TODO: 集成实际通知系统
      },
      getStorage: () => {
        // 返回简化的存储接口
        return {
          get: async (key: string) => {
            try {
              const stored = localStorage.getItem(`plugin-${pluginId}-${key}`)
              return stored ? JSON.parse(stored) : null
            } catch (e) {
              console.warn(`[Plugin ${pluginId}] Storage get error:`, e)
              return null
            }
          },
          set: async (key: string, value: any) => {
            try {
              localStorage.setItem(`plugin-${pluginId}-${key}`, JSON.stringify(value))
            } catch (e) {
              console.warn(`[Plugin ${pluginId}] Storage set error:`, e)
            }
          },
          remove: async (key: string) => {
            localStorage.removeItem(`plugin-${pluginId}-${key}`)
          },
        }
      },
      emit: (event: string, data?: any) => {
        this.eventBus.emit(event as any, data, pluginId)
      },
      on: (event: string, handler: (data?: any) => void) => {
        this.eventBus.on(event as any, handler as any)
      },
      off: (event: string, handler?: (data?: any) => void) => {
        if (handler) {
          this.eventBus.off(event as any, handler as any)
        }
      },
      getConfig: () => {
        // TODO: 返回插件配置
        return {}
      },
      setConfig: (config: any) => {
        // TODO: 设置插件配置
        console.log(`[Plugin ${pluginId}] Set config:`, config)
      },
      registerComponent: (name: string, component: any) => {
        console.log(`[Plugin ${pluginId}] Register component:`, name, component)
        // TODO: 集成组件注册
      },
      app: {
        name: 'Mira Launcher',
        version: '1.0.0',
        vue: null as any, // TODO: 集成 Vue 应用实例
      },
      menu: this.createSimpleMenuAPI(pluginId),
      shortcut: this.createShortcutAPI(pluginId),
      storage: this.createStorageAPI(pluginId),
      notification: this.createSimpleNotificationAPI(pluginId),
      component: this.createSimpleComponentAPI(pluginId),
      route: this.createSimpleRouteAPI(pluginId),
      plugins: this.createSimplePluginsAPI(pluginId),
      addEntry: (() => {
        // 使用新的 AddEntryAPI 实现
        const addEntryAPI = createAddEntryAPI(pluginId)
        
        return {
          register: (entry: {
            id?: string
            label: string
            icon: string
            type: 'app' | 'test' | 'custom'
            priority?: number
            formDefaults?: Record<string, unknown>
            appType?: string
            fields?: Record<string, {
              label: string
              input: string
              required?: boolean
              placeholder?: string
              validation?: {
                pattern?: string
                minLength?: number
                maxLength?: number
                min?: number
                max?: number
              }
              options?: Array<{ label: string; value: unknown }>
              description?: string
            }>
            exec?: (ctx: { fields: Record<string, unknown> }) => boolean | Promise<boolean>
            handler?: () => void | Promise<void>
          }) => {
            try {
              return addEntryAPI.register(entry as any)
            } catch (error) {
              console.error(`[Plugin ${pluginId}] Failed to register addEntry:`, error)
              return ''
            }
          },
          unregister: (id: string) => {
            try {
              addEntryAPI.unregister(id)
            } catch (error) {
              console.error(`[Plugin ${pluginId}] Failed to unregister addEntry:`, error)
            }
          },
          list: () => {
            try {
              return addEntryAPI.getEntries().map((entry: any) => ({
                id: entry.id,
                label: entry.label,
                icon: entry.icon,
                type: entry.type,
                priority: entry.priority,
              }))
            } catch (error) {
              console.error(`[Plugin ${pluginId}] Failed to list addEntries:`, error)
              return []
            }
          },
        }
      })(),
      events: {
        on: <T = unknown>(
          type: PluginEventType,
          listener: EventListener<T>,
          options?: EventListenerOptions,
        ) => {
          this.eventBus.on(type, listener as any, options as any)
        },
        once: <T = unknown>(
          type: PluginEventType,
          listener: EventListener<T>,
        ) => {
          this.eventBus.once(type, listener as any)
        },
        off: <T = unknown>(
          type: PluginEventType,
          listener: EventListener<T>,
        ) => {
          this.eventBus.off(type, listener as any)
        },
        emit: <T = unknown>(
          type: PluginEventType,
          data: T,
          source?: string,
        ) => {
          this.eventBus.emit(type, data, source)
        },
        emitCancelable: <T = unknown>(
          type: PluginEventType,
          data: T,
          source?: string,
        ) => {
          // 同步包装异步方法
          this.eventBus
            .emitCancelable(type, data, source)
            .then(result => result)
          return true // 临时返回值，将在后续优化
        },
      },
      utils: this.createSimpleUtilsAPI(pluginId),
    }
    
    return api
  }


  /**
   * 创建简化菜单API
   */
  private createSimpleMenuAPI(pluginId: string) {
    return {
      register: (items: any[], position?: string) => {
        console.log(
          `[Plugin ${pluginId}] Register menu items:`,
          items,
          position,
        )
        // TODO: 实际菜单集成
      },
      unregister: (itemId: string) => {
        console.log(`[Plugin ${pluginId}] Unregister menu item:`, itemId)
      },
      update: (itemId: string, item: any) => {
        console.log(`[Plugin ${pluginId}] Update menu item:`, itemId, item)
      },
      getAll: () => {
        console.log(`[Plugin ${pluginId}] Get all menu items`)
        return []
      },
    }
  }

  private createShortcutAPI(pluginId: string): ShortcutAPI {
    const baseAPI = {
      register: (shortcut: any) => {
        try {
          // 如果shortcut包含actionId，使用registerShortcutWithAction
          if (shortcut.actionId) {
            return this.globalShortcutManager.registerShortcutWithAction(
              shortcut.key,
              shortcut.actionId,
              { ...shortcut, pluginId },
            )
          } else {
            // 否则使用传统的registerShortcut
            return this.globalShortcutManager.registerShortcut({
              ...shortcut,
              pluginId,
              id: shortcut.id || `${pluginId}-${Date.now()}`,
            })
          }
        } catch (error) {
          console.error(
            `[Plugin ${pluginId}] Failed to register shortcut:`,
            error,
          )
          return null
        }
      },
      unregister: (id: string) => {
        try {
          this.globalShortcutManager.unregister(id)
          console.log(`[Plugin ${pluginId}] Unregistered shortcut: ${id}`)
        } catch (error) {
          console.error(
            `[Plugin ${pluginId}] Failed to unregister shortcut:`,
            error,
          )
        }
      },
      hasConflict: (combination: string) => {
        try {
          return this.globalShortcutManager.hasConflict(combination)
        } catch (error) {
          console.error(
            `[Plugin ${pluginId}] Failed to check shortcut conflict:`,
            error,
          )
          return false
        }
      },
      getAll: () => {
        try {
          const shortcuts = this.globalShortcutManager.getByPlugin(pluginId)
          return shortcuts.map(shortcut => ({
            shortcut: shortcut.key,
            description: shortcut.description || '',
          }))
        } catch (error) {
          console.error(`[Plugin ${pluginId}] Failed to get shortcuts:`, error)
          return []
        }
      },
    } as ShortcutAPI

    // 添加扩展方法
    return Object.assign(baseAPI, {
      registerAction: (action: any) => {
        try {
          this.globalShortcutManager.registerAction({
            ...action,
            category: action.category || pluginId,
          })
          console.log(`[Plugin ${pluginId}] Registered action: ${action.id}`)
        } catch (error) {
          console.error(
            `[Plugin ${pluginId}] Failed to register action:`,
            error,
          )
        }
      },
      getAvailableActions: () => {
        try {
          return this.globalShortcutManager.getAvailableActions()
        } catch (error) {
          console.error(
            `[Plugin ${pluginId}] Failed to get available actions:`,
            error,
          )
          return []
        }
      },
    })
  }

  /**
   * 创建简化通知API
   */
  private createSimpleNotificationAPI(pluginId: string) {
    return {
      info: (message: string, title?: string, options?: any) => {
        console.log(`[Plugin ${pluginId}] INFO: ${title || ''} ${message}`)
      },
      success: (message: string, title?: string, options?: any) => {
        console.log(`[Plugin ${pluginId}] SUCCESS: ${title || ''} ${message}`)
      },
      warning: (message: string, title?: string, options?: any) => {
        console.log(`[Plugin ${pluginId}] WARNING: ${title || ''} ${message}`)
      },
      warn: (message: string, title?: string, options?: any) => {
        console.log(`[Plugin ${pluginId}] WARN: ${title || ''} ${message}`)
      },
      error: (message: string, title?: string, options?: any) => {
        console.log(`[Plugin ${pluginId}] ERROR: ${title || ''} ${message}`)
      },
      show: (type: string, message: string, title?: string, options?: any) => {
        console.log(
          `[Plugin ${pluginId}] ${type.toUpperCase()}: ${title || ''} ${message}`,
        )
      },
    }
  }

  /**
   * 创建简化组件API
   */
  private createSimpleComponentAPI(pluginId: string) {
    return {
      register: (name: string, component: any) => {
        console.log(`[Plugin ${pluginId}] Register component:`, name, component)
      },
      unregister: (name: string) => {
        console.log(`[Plugin ${pluginId}] Unregister component:`, name)
      },
      get: (name: string) => {
        console.log(`[Plugin ${pluginId}] Get component:`, name)
        return undefined
      },
      has: (name: string) => {
        console.log(`[Plugin ${pluginId}] Has component:`, name)
        return false
      },
      getAll: () => {
        return []
      },
    }
  }

  /**
   * 创建简化路由API
   */
  private createSimpleRouteAPI(pluginId: string) {
    return {
      add: (route: any) => {
        console.log(`[Plugin ${pluginId}] Add route:`, route)
      },
      remove: (name: string) => {
        console.log(`[Plugin ${pluginId}] Remove route:`, name)
      },
      navigate: (to: string) => {
        console.log(`[Plugin ${pluginId}] Navigate to:`, to)
      },
      getRouter: () => {
        console.log(`[Plugin ${pluginId}] Get router`)
        return undefined as any
      },
      push: async (to: any) => {
        console.log(`[Plugin ${pluginId}] Push route:`, to)
      },
      replace: async (to: any) => {
        console.log(`[Plugin ${pluginId}] Replace route:`, to)
      },
      back: async () => {
        console.log(`[Plugin ${pluginId}] Go back`)
      },
      forward: async () => {
        console.log(`[Plugin ${pluginId}] Go forward`)
      },
      getCurrentRoute: () => {
        return { path: '/', name: 'home' }
      },
    }
  }

  /**
   * 创建简化插件API
   */
  private createSimplePluginsAPI(pluginId: string) {
    return {
      getAll: () => {
        return Array.from(this.plugins.entries()).map(([id, entry]) => {
          const info: any = {
            metadata: entry.metadata,
            state: entry.state,
            config: entry.configuration,
            configurable: true,
            stats: {
              activationCount: 0,
              totalRuntime: 0,
              errorCount: 0,
              lastError: undefined,
              memoryUsage: undefined,
            },
          }

          if (entry.error) {
            info.error = String(entry.error)
          }

          if (entry.loadedAt && entry.registeredAt) {
            info.loadTime = entry.loadedAt - entry.registeredAt
          }

          if (entry.activatedAt) {
            info.lastActivated = new Date(entry.activatedAt)
          }

          return info
        })
      },
      get: (id: string) => {
        const entry = this.plugins.get(id)
        if (!entry) return undefined

        const info: any = {
          metadata: entry.metadata,
          state: entry.state,
          config: entry.configuration,
          configurable: true,
          stats: {
            activationCount: 0,
            totalRuntime: 0,
            errorCount: 0,
            lastError: undefined,
            memoryUsage: undefined,
          },
        }

        if (entry.error) {
          info.error = String(entry.error)
        }

        if (entry.loadedAt && entry.registeredAt) {
          info.loadTime = entry.loadedAt - entry.registeredAt
        }

        if (entry.activatedAt) {
          info.lastActivated = new Date(entry.activatedAt)
        }

        return info
      },
      has: (id: string) => {
        return this.plugins.has(id)
      },
      isActive: (id: string) => {
        const entry = this.plugins.get(id)
        return entry?.state === 'active'
      },
    }
  }

  /**
   * 创建简化工具API
   */
  private createSimpleUtilsAPI(pluginId: string) {
    return {
      generateId: () => {
        return `plugin-${pluginId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },
      deepClone: <T>(obj: T): T => {
        try {
          return JSON.parse(JSON.stringify(obj))
        } catch (error) {
          console.error(`[Plugin ${pluginId}] Deep clone failed:`, error)
          return obj
        }
      },
      debounce: <T extends (...args: unknown[]) => unknown>(
        fn: T,
        delay: number,
      ): T => {
        let timeoutId: number | undefined
        return ((...args: unknown[]) => {
          if (timeoutId) clearTimeout(timeoutId)
          timeoutId = setTimeout(() => fn(...args), delay)
        }) as T
      },
      throttle: <T extends (...args: unknown[]) => unknown>(
        fn: T,
        delay: number,
      ): T => {
        let lastCall = 0
        return ((...args: unknown[]) => {
          const now = Date.now()
          if (now - lastCall >= delay) {
            lastCall = now
            fn(...args)
          }
        }) as T
      },
    }
  }

  /**
   * 创建存储API
   */
  private createStorageAPI(pluginId: string) {
    const prefix = `plugin:${pluginId}:`

    return {
      get: (key: string) => {
        try {
          const value = localStorage.getItem(prefix + key)
          return value ? JSON.parse(value) : null
        } catch (error) {
          console.error(
            `[PluginManager] Failed to get storage for ${pluginId}:`,
            error,
          )
          return null
        }
      },

      set: (key: string, value: unknown) => {
        try {
          localStorage.setItem(prefix + key, JSON.stringify(value))
          return true
        } catch (error) {
          console.error(
            `[PluginManager] Failed to set storage for ${pluginId}:`,
            error,
          )
          return false
        }
      },

      remove: (key: string) => {
        try {
          localStorage.removeItem(prefix + key)
          return true
        } catch (error) {
          console.error(
            `[PluginManager] Failed to remove storage for ${pluginId}:`,
            error,
          )
          return false
        }
      },

      clear: () => {
        try {
          const keys = Object.keys(localStorage).filter(key =>
            key.startsWith(prefix),
          )
          keys.forEach(key => localStorage.removeItem(key))
          return true
        } catch (error) {
          console.error(
            `[PluginManager] Failed to clear storage for ${pluginId}:`,
            error,
          )
          return false
        }
      },

      keys: () => {
        try {
          return Object.keys(localStorage)
            .filter(key => key.startsWith(prefix))
            .map(key => key.substring(prefix.length))
        } catch (error) {
          console.error(
            `[PluginManager] Failed to get keys for ${pluginId}:`,
            error,
          )
          return []
        }
      },

      has: (key: string) => {
        try {
          return localStorage.getItem(prefix + key) !== null
        } catch (error) {
          console.error(
            `[PluginManager] Failed to check key for ${pluginId}:`,
            error,
          )
          return false
        }
      },
    }
  }

  /**
   * 创建UI API
   */
  private createUIAPI(pluginId: string) {
    return {
      // 这里将在后续任务中实现具体的UI集成
      showNotification: (
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info',
      ) => {
        console.log(`[Plugin ${pluginId}] ${type.toUpperCase()}: ${message}`)
        // TODO: 集成 PrimeVue Toast
      },

      createMenuItem: (menu: unknown) => {
        console.log(`[Plugin ${pluginId}] Create menu item:`, menu)
        // TODO: 集成到应用菜单系统
      },

      registerComponent: (name: string, component: unknown) => {
        console.log(`[Plugin ${pluginId}] Register component: ${name}`)
        // TODO: 集成到全局组件注册系统
      },
    }
  }

  /**
   * 创建系统API
   */
  private createSystemAPI(pluginId: string) {
    return {
      getPluginInfo: (id?: string) => {
        if (id) {
          const entry = this.plugins.get(id)
          return entry ? { ...entry.metadata, state: entry.state } : null
        }

        return Array.from(this.plugins.entries()).map(([pluginId, entry]) => ({
          id: pluginId,
          name: entry.metadata.name,
          version: entry.metadata.version,
          description: entry.metadata.description,
          author: entry.metadata.author,
          state: entry.state,
        }))
      },

      isPluginActive: (id: string) => {
        const entry = this.plugins.get(id)
        return entry?.state === 'active'
      },

      getVersion: () => {
        // TODO
        return '1.0.0'
      },
    }
  }

  /**
   * 执行带超时的操作
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T> | T,
    timeout: number,
    errorMessage: string,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(errorMessage))
      }, timeout)

      Promise.resolve(operation())
        .then(result => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  // 事件处理器
  private async handleBeforeLoad(event: PluginLifecycleEvent): Promise<void> {
    console.log(`[PluginManager] Before load: ${event.data.pluginId}`)
  }

  private async handleLoaded(event: PluginLifecycleEvent): Promise<void> {
    console.log(`[PluginManager] Loaded: ${event.data.pluginId}`)
  }

  private async handleBeforeActivate(
    event: PluginLifecycleEvent,
  ): Promise<void> {
    console.log(`[PluginManager] Before activate: ${event.data.pluginId}`)
  }

  private async handleActivated(event: PluginLifecycleEvent): Promise<void> {
    console.log(`[PluginManager] Activated: ${event.data.pluginId}`)
  }

  private async handleBeforeDeactivate(
    event: PluginLifecycleEvent,
  ): Promise<void> {
    console.log(`[PluginManager] Before deactivate: ${event.data.pluginId}`)
  }

  private async handleDeactivated(event: PluginLifecycleEvent): Promise<void> {
    console.log(`[PluginManager] Deactivated: ${event.data.pluginId}`)
  }

  private async handleBeforeUnload(event: PluginLifecycleEvent): Promise<void> {
    console.log(`[PluginManager] Before unload: ${event.data.pluginId}`)
  }

  private async handleUnloaded(event: PluginLifecycleEvent): Promise<void> {
    console.log(`[PluginManager] Unloaded: ${event.data.pluginId}`)
  }

  private async handleError(event: any): Promise<void> {
    console.error('[PluginManager] Plugin error:', event.data)
  }

  // 公共接口方法

  /**
   * 获取插件信息
   */
  getPlugin(pluginId: string): PluginRegistryEntry | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取指定状态的插件
   */
  getPluginsByState(state: PluginState): PluginRegistryEntry[] {
    return Array.from(this.plugins.values()).filter(
      entry => entry.state === state,
    )
  }

  /**
   * 获取激活顺序
   */
  getActivationOrder(): string[] {
    return [...this.activationOrder]
  }

  /**
   * 配置插件
   */
  configurePlugin(
    pluginId: string,
    configuration: PluginConfiguration,
  ): boolean {
    const entry = this.plugins.get(pluginId)
    if (!entry) {
      return false
    }

    entry.configuration = { ...entry.configuration, ...configuration }
    return true
  }

  /**
   * 获取插件配置
   */
  getPluginConfiguration(pluginId: string): PluginConfiguration | undefined {
    return this.plugins.get(pluginId)?.configuration
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const states = Array.from(this.plugins.values()).reduce(
      (acc, entry) => {
        acc[entry.state] = (acc[entry.state] || 0) + 1
        return acc
      },
      {} as Record<PluginState, number>,
    )

    return {
      total: this.plugins.size,
      states,
      activationOrder: this.activationOrder.length,
      maxPlugins: this.config.maxPlugins,
    }
  }

  /**
   * 销毁插件管理器
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return
    }

    // 按激活顺序逆序停用所有插件
    const pluginsToDeactivate = [...this.activationOrder].reverse()
    for (const pluginId of pluginsToDeactivate) {
      await this.deactivate(pluginId).catch(console.error)
    }

    // 卸载所有插件
    const pluginIds = Array.from(this.plugins.keys())
    for (const pluginId of pluginIds) {
      await this.unload(pluginId).catch(console.error)
    }

    // 销毁全局快捷键管理器
    await this.globalShortcutManager.destroy()

    this.plugins.clear()
    this.loadedModules.clear()
    this.activationOrder = []
    this.eventBus.destroy()
    this.isDestroyed = true

    console.log('[PluginManager] Plugin manager destroyed')
  }
}

/**
 * 创建响应式插件管理器
 */
export function createReactivePluginManager(
  eventBus?: EventBus,
  config?: PluginManagerConfig,
): PluginManager & Ref {
  const manager = new PluginManager(eventBus, config)
  return reactive(manager) as PluginManager & Ref
}
