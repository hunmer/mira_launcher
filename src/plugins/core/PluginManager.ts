import { reactive, type Ref } from 'vue'
import type { 
  PluginMetadata, 
  PluginState, 
  PluginAPI, 
  PluginRegistryEntry,
  PluginLifecycleEvent,
  PluginConfiguration,
  PluginEventType,
  EventListener,
  EventListenerOptions
} from '@/types/plugin'
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
    this.eventBus.on('plugin:beforeActivate', this.handleBeforeActivate.bind(this))
    this.eventBus.on('plugin:activated', this.handleActivated.bind(this))
    this.eventBus.on('plugin:beforeDeactivate', this.handleBeforeDeactivate.bind(this))
    this.eventBus.on('plugin:deactivated', this.handleDeactivated.bind(this))
    this.eventBus.on('plugin:beforeUnload', this.handleBeforeUnload.bind(this))
    this.eventBus.on('plugin:unloaded', this.handleUnloaded.bind(this))
    this.eventBus.on('plugin:error', this.handleError.bind(this))
  }

  /**
   * 注册插件
   */
  async register(pluginClass: new () => BasePlugin, metadata: PluginMetadata): Promise<boolean> {
    if (this.isDestroyed) {
      throw new Error('Plugin manager has been destroyed')
    }

    try {
      // 验证插件
      this.validatePlugin(pluginClass, metadata)

      // 检查重复
      if (!this.config.allowDuplicates && this.plugins.has(metadata.id)) {
        console.warn(`[PluginManager] Plugin ${metadata.id} is already registered`)
        return false
      }

      // 检查最大插件数量
      if (this.plugins.size >= this.config.maxPlugins) {
        throw new Error(`Maximum number of plugins (${this.config.maxPlugins}) exceeded`)
      }

      // 创建插件实例
      const pluginInstance = new pluginClass()
      
      // 设置插件API
      const pluginAPI = this.createPluginAPI(metadata.id)
      pluginInstance._setAPI(pluginAPI)

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

      console.log(`[PluginManager] Plugin ${metadata.id} registered successfully`)

      // 自动激活（如果配置）
      if (this.config.autoActivate) {
        await this.activate(metadata.id)
      }

      return true
    } catch (error) {
      console.error(`[PluginManager] Failed to register plugin ${metadata.id}:`, error)
      await this.eventBus.emit('plugin:error', {
        pluginId: metadata.id,
        error,
        operation: 'register',
      })
      return false
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
      console.warn(`[PluginManager] Plugin ${pluginId} is not in registered state (current: ${entry.state})`)
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
      
      const loadPromise = this.executeWithTimeout(
        () => entry.instance.onLoad(),
        this.config.loadTimeout,
        `Plugin ${pluginId} load timeout`
      )

      await loadPromise

      entry.state = 'loaded'
      entry.loadedAt = Date.now()

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
      console.warn(`[PluginManager] Plugin ${pluginId} is not in loaded state (current: ${entry.state})`)
      return false
    }

    try {
      // 发布激活前事件
      const canActivate = await this.eventBus.emitCancelable('plugin:beforeActivate', {
        pluginId,
        metadata: entry.metadata,
      })

      if (!canActivate) {
        console.log(`[PluginManager] Plugin ${pluginId} activation was cancelled`)
        return false
      }

      // 激活依赖插件
      await this.activateDependencies(pluginId)

      // 执行激活
      entry.state = 'activating'
      await entry.instance.onActivate()
      entry.state = 'active'
      entry.activatedAt = Date.now()

      // 记录激活顺序
      if (!this.activationOrder.includes(pluginId)) {
        this.activationOrder.push(pluginId)
      }

      // 发布激活完成事件
      await this.eventBus.emit('plugin:activated', {
        pluginId,
        metadata: entry.metadata,
        activationTime: entry.activatedAt! - (entry.loadedAt || entry.activatedAt!),
      })

      console.log(`[PluginManager] Plugin ${pluginId} activated successfully`)
      return true
    } catch (error) {
      entry.state = 'error'
      entry.error = error
      console.error(`[PluginManager] Failed to activate plugin ${pluginId}:`, error)
      
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
      console.warn(`[PluginManager] Plugin ${pluginId} is not active (current: ${entry.state})`)
      return false
    }

    try {
      // 发布停用前事件
      const canDeactivate = await this.eventBus.emitCancelable('plugin:beforeDeactivate', {
        pluginId,
        metadata: entry.metadata,
      })

      if (!canDeactivate) {
        console.log(`[PluginManager] Plugin ${pluginId} deactivation was cancelled`)
        return false
      }

      // 停用依赖此插件的其他插件
      await this.deactivateDependents(pluginId)

      // 执行停用
      entry.state = 'deactivating'
      await entry.instance.onDeactivate()
      entry.state = 'loaded'
      entry.deactivatedAt = Date.now()

      // 从激活顺序中移除
      const index = this.activationOrder.indexOf(pluginId)
      if (index !== -1) {
        this.activationOrder.splice(index, 1)
      }

      // 发布停用完成事件
      await this.eventBus.emit('plugin:deactivated', {
        pluginId,
        metadata: entry.metadata,
        deactivationTime: entry.deactivatedAt! - (entry.activatedAt || entry.deactivatedAt!),
      })

      console.log(`[PluginManager] Plugin ${pluginId} deactivated successfully`)
      return true
    } catch (error) {
      entry.state = 'error'
      entry.error = error
      console.error(`[PluginManager] Failed to deactivate plugin ${pluginId}:`, error)
      
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
      const canUnload = await this.eventBus.emitCancelable('plugin:beforeUnload', {
        pluginId,
        metadata: entry.metadata,
      })

      if (!canUnload) {
        console.log(`[PluginManager] Plugin ${pluginId} unload was cancelled`)
        return false
      }

      // 执行卸载
      entry.state = 'unloading'
      await entry.instance.onUnload()

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
      console.error(`[PluginManager] Failed to unload plugin ${pluginId}:`, error)
      
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
  private validatePlugin(pluginClass: new () => BasePlugin, metadata: PluginMetadata): void {
    if (!pluginClass || typeof pluginClass !== 'function') {
      throw new Error('Plugin class is required and must be a constructor function')
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
        throw new Error(`Dependency ${depId} is in error state for plugin ${pluginId}`)
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
  private createPluginAPI(pluginId: string): PluginAPI {
    // 简化版 API，将在后续任务中完善
    return {
      app: {
        name: 'Mira Launcher',
        version: '1.0.0',
        vue: null as any, // TODO: 集成 Vue 应用实例
      },
      menu: this.createSimpleMenuAPI(pluginId),
      shortcut: this.createSimpleShortcutAPI(pluginId),
      storage: this.createStorageAPI(pluginId),
      notification: this.createSimpleNotificationAPI(pluginId),
      component: this.createSimpleComponentAPI(pluginId),
      route: this.createSimpleRouteAPI(pluginId),
      plugins: this.createSimplePluginsAPI(pluginId),
      events: {
        on: <T = unknown>(type: PluginEventType, listener: EventListener<T>, options?: EventListenerOptions) => {
          this.eventBus.on(type, listener as any, options as any)
        },
        once: <T = unknown>(type: PluginEventType, listener: EventListener<T>) => {
          this.eventBus.once(type, listener as any)
        },
        off: <T = unknown>(type: PluginEventType, listener: EventListener<T>) => {
          this.eventBus.off(type, listener as any)
        },
        emit: <T = unknown>(type: PluginEventType, data: T, source?: string) => {
          this.eventBus.emit(type, data, source)
        },
        emitCancelable: <T = unknown>(type: PluginEventType, data: T, source?: string) => {
          // 同步包装异步方法
          this.eventBus.emitCancelable(type, data, source).then(result => result)
          return true // 临时返回值，将在后续优化
        },
      },
      utils: this.createSimpleUtilsAPI(pluginId),
    }
  }

  /**
   * 创建简化菜单API
   */
  private createSimpleMenuAPI(pluginId: string) {
    return {
      register: (items: any[], position?: string) => {
        console.log(`[Plugin ${pluginId}] Register menu items:`, items, position)
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
      }
    }
  }

  /**
   * 创建简化快捷键API
   */
  private createSimpleShortcutAPI(pluginId: string) {
    return {
      register: (shortcut: any) => {
        console.log(`[Plugin ${pluginId}] Register shortcut:`, shortcut)
      },
      unregister: (id: string) => {
        console.log(`[Plugin ${pluginId}] Unregister shortcut:`, id)
      },
      hasConflict: (combination: string) => {
        console.log(`[Plugin ${pluginId}] Check shortcut conflict:`, combination)
        return false
      },
      getAll: () => {
        return []
      }
    }
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
        console.log(`[Plugin ${pluginId}] ${type.toUpperCase()}: ${title || ''} ${message}`)
      }
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
      }
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
      }
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
            }
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
          }
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
      }
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
      debounce: <T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T => {
        let timeoutId: number | undefined
        return ((...args: unknown[]) => {
          if (timeoutId) clearTimeout(timeoutId)
          timeoutId = setTimeout(() => fn(...args), delay)
        }) as T
      },
      throttle: <T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T => {
        let lastCall = 0
        return ((...args: unknown[]) => {
          const now = Date.now()
          if (now - lastCall >= delay) {
            lastCall = now
            fn(...args)
          }
        }) as T
      }
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
          console.error(`[PluginManager] Failed to get storage for ${pluginId}:`, error)
          return null
        }
      },
      
      set: (key: string, value: unknown) => {
        try {
          localStorage.setItem(prefix + key, JSON.stringify(value))
          return true
        } catch (error) {
          console.error(`[PluginManager] Failed to set storage for ${pluginId}:`, error)
          return false
        }
      },
      
      remove: (key: string) => {
        try {
          localStorage.removeItem(prefix + key)
          return true
        } catch (error) {
          console.error(`[PluginManager] Failed to remove storage for ${pluginId}:`, error)
          return false
        }
      },
      
      clear: () => {
        try {
          const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix))
          keys.forEach(key => localStorage.removeItem(key))
          return true
        } catch (error) {
          console.error(`[PluginManager] Failed to clear storage for ${pluginId}:`, error)
          return false
        }
      },

      keys: () => {
        try {
          return Object.keys(localStorage)
            .filter(key => key.startsWith(prefix))
            .map(key => key.substring(prefix.length))
        } catch (error) {
          console.error(`[PluginManager] Failed to get keys for ${pluginId}:`, error)
          return []
        }
      },

      has: (key: string) => {
        try {
          return localStorage.getItem(prefix + key) !== null
        } catch (error) {
          console.error(`[PluginManager] Failed to check key for ${pluginId}:`, error)
          return false
        }
      }
    }
  }

  /**
   * 创建UI API
   */
  private createUIAPI(pluginId: string) {
    return {
      // 这里将在后续任务中实现具体的UI集成
      showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
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
      }
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
        // TODO: 从 package.json 获取应用版本
        return '1.0.0'
      }
    }
  }

  /**
   * 执行带超时的操作
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T> | T,
    timeout: number,
    errorMessage: string
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

  private async handleBeforeActivate(event: PluginLifecycleEvent): Promise<void> {
    console.log(`[PluginManager] Before activate: ${event.data.pluginId}`)
  }

  private async handleActivated(event: PluginLifecycleEvent): Promise<void> {
    console.log(`[PluginManager] Activated: ${event.data.pluginId}`)
  }

  private async handleBeforeDeactivate(event: PluginLifecycleEvent): Promise<void> {
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
    console.error(`[PluginManager] Plugin error:`, event.data)
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
    return Array.from(this.plugins.values()).filter(entry => entry.state === state)
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
  configurePlugin(pluginId: string, configuration: PluginConfiguration): boolean {
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
    const states = Array.from(this.plugins.values()).reduce((acc, entry) => {
      acc[entry.state] = (acc[entry.state] || 0) + 1
      return acc
    }, {} as Record<PluginState, number>)

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
  config?: PluginManagerConfig
): PluginManager & Ref {
  const manager = new PluginManager(eventBus, config)
  return reactive(manager) as PluginManager & Ref
}
