/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Enhanced console for plugins (to solve eval output display issues)
 */
export const console = {
    log: (...args: any[]) => {
        const originalConsole = (globalThis as any).console || window.console
        originalConsole.log('[Plugin]', ...args)
    },
    error: (...args: any[]) => {
        const originalConsole = (globalThis as any).console || window.console
        originalConsole.error('[Plugin Error]', ...args)
    },
    warn: (...args: any[]) => {
        const originalConsole = (globalThis as any).console || window.console
        originalConsole.warn('[Plugin Warning]', ...args)
    },
    info: (...args: any[]) => {
        const originalConsole = (globalThis as any).console || window.console
        originalConsole.info('[Plugin Info]', ...args)
    },
    debug: (...args: any[]) => {
        const originalConsole = (globalThis as any).console || window.console
        originalConsole.debug('[Plugin Debug]', ...args)
    },
}

/**
 * Plugin Metadata Interface
 */
export interface PluginMetadata {
    id: string
    name: string
    version: string
    type?: 'app' | 'background'  // 新增 type 字段
    description?: string
    author?: string
    dependencies?: string[]
    permissions?: string[]
    minAppVersion?: string
    keywords?: string[]
    homepage?: string
    repository?: string
    license?: string
    configSchema?: any
}

/**
 * Plugin Window Configuration
 */
export interface PluginWindowOptions {
    title: string
    width?: number
    height?: number
    x?: number
    y?: number
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    resizable?: boolean
    center?: boolean
    alwaysOnTop?: boolean
    skipTaskbar?: boolean
    decorations?: boolean
    transparent?: boolean
    modal?: boolean
    parent?: string // 父窗口ID
    url?: string // 自定义HTML页面URL
    html?: string // 直接提供HTML内容
    devTools?: boolean // 是否启用开发者工具
}

/**
 * Plugin Window Instance
 */
export interface PluginWindow {
    id: string
    label: string
    close: () => Promise<void>
    focus: () => Promise<void>
    hide: () => Promise<void>
    show: () => Promise<void>
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    unmaximize: () => Promise<void>
    isMaximized: () => Promise<boolean>
    isMinimized: () => Promise<boolean>
    isVisible: () => Promise<boolean>
    setTitle: (title: string) => Promise<void>
    setSize: (width: number, height: number) => Promise<void>
    setPosition: (x: number, y: number) => Promise<void>
    setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>
    setResizable: (resizable: boolean) => Promise<void>
    emit: (event: string, data?: unknown) => Promise<void>
    listen: (event: string, handler: (data?: unknown) => void) => Promise<() => void>
    once: (event: string, handler: (data?: unknown) => void) => Promise<() => void>
}

/**
 * Plugin Window API
 */
export interface PluginWindowAPI {
    /**
     * 创建新窗口
     */
    createWindow: (options: PluginWindowOptions) => Promise<PluginWindow>
    
    /**
     * 创建原生HTML窗口（插件完全控制内容）
     */
    createHTMLWindow: (options: PluginWindowOptions & { html: string }) => Promise<PluginWindow>
    
    /**
     * 创建基于URL的窗口
     */
    createURLWindow: (options: PluginWindowOptions & { url: string }) => Promise<PluginWindow>
    
    /**
     * 获取当前窗口
     */
    getCurrentWindow: () => PluginWindow | null
    
    /**
     * 获取所有窗口
     */
    getAllWindows: () => PluginWindow[]
    
    /**
     * 根据ID获取窗口
     */
    getWindow: (id: string) => PluginWindow | null
    
    /**
     * 关闭所有窗口
     */
    closeAll: () => Promise<void>
    
    /**
     * 显示模态对话框
     */
    showModal: (options: {
        title: string
        content: string
        buttons?: Array<{
            label: string
            action: 'confirm' | 'cancel' | string
            primary?: boolean
        }>
    }) => Promise<string>
    
    /**
     * 显示文件选择对话框
     */
    showFileDialog: (options: {
        title?: string
        filters?: Array<{ name: string; extensions: string[] }>
        multiple?: boolean
        directory?: boolean
    }) => Promise<string | string[] | null>
}

/**
 * Plugin Protocol Handler
 */
export interface PluginProtocolAPI {
    registerHandler: (route: string, handler: (params: Record<string, unknown>) => void) => void
    unregisterHandler: (route: string) => void
    navigate: (pluginId: string, route: string, params?: Record<string, unknown>) => Promise<void>
}

/**
 * Plugin API (simplified for external plugins)
 */
export interface PluginAPI {
    log: (level: string, message: string, ...args: unknown[]) => void
    sendNotification: (type: string, options: unknown) => void
    getStorage: () => unknown
    emit: (event: string, data?: unknown) => void
  on: (event: string, handler: (data?: unknown) => void) => void
    off: (event: string, handler?: (data?: unknown) => void) => void
    getConfig: () => PluginConfig
    setConfig: (config: Partial<PluginConfig>) => void
    registerComponent: (name: string, component: unknown) => void
    window: PluginWindowAPI
    protocol: PluginProtocolAPI
  /** 添加入口注册 API（与核心系统交互，用于在"添加"菜单中动态插入项） */
  addEntry?: {
    register(entry: {
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
        filters?: Array<{ name: string; extensions: string[] }>
        description?: string
      }>
      exec?: (ctx: { fields: Record<string, unknown> }) => boolean | Promise<boolean>
      handler?: () => void | Promise<void>
    }): string
    unregister(id: string): void
    list(): Array<{ id: string; label: string; icon: string; type: string; priority?: number }>
  }
}


/**
 * Plugin Configuration Definition
 */
export interface PluginConfigDefinition {
    properties: Record<string, unknown>
    required?: string[]
    defaults?: Record<string, unknown>
}

/**
 * Plugin Context Menu Item
 */
export interface PluginContextMenu {
    id: string
    title: string
    contexts: string[]
    icon?: string
    action?: string
    submenu?: PluginContextMenu[]
}

/**
 * Plugin Hotkey Definition
 */
export interface PluginHotkey {
    id: string
    combination: string
    description: string
    global: boolean
    handler: () => void
}

/**
 * Plugin Log Configuration
 */
export interface PluginLogConfig {
    level: 'debug' | 'info' | 'warn' | 'error'
    maxEntries: number
    persist: boolean
    format: 'simple' | 'json' | 'structured'
}

/**
 * Plugin Notification Configuration
 */
export interface PluginNotificationConfig {
    defaults: {
        type: 'info' | 'success' | 'warning' | 'error'
        duration: number
        closable: boolean
    }
    templates?: Record<string, {
        title: string
        message: string
        type: 'info' | 'success' | 'warning' | 'error'
    }>
}

/**
 * Plugin Storage Configuration
 */
export interface PluginStorageConfig {
    type: 'localStorage' | 'sessionStorage' | 'indexedDB'
    prefix: string
    encrypt: boolean
    sizeLimit?: number
}

/**
 * Plugin Queue Configuration
 */
export interface PluginQueueConfig {
    type: 'fifo' | 'lifo' | 'priority'
    config: {
        concurrency: number
        autostart: boolean
        timeout: number
        results: boolean
    }
}

/**
 * Plugin Subscription
 */
export interface PluginSubscription {
    event: string
    handler: (data?: unknown) => void
    options: { once: boolean }
}

/**
 * Plugin Builder Function
 */
export type PluginBuilderFunction = (options?: unknown) => unknown

/**
 * Plugin State
 */
export interface PluginState {
    loaded: boolean
    activated: boolean
    error: string | null
}

/**
 * Plugin Configuration
 */
export interface PluginConfig {
    [key: string]: unknown
}

/**
 * Plugin Search Entry Configuration
 */
export interface PluginSearchEntry {
    /** 路由标识 */
    router: string
    /** 入口标题 */
    title: string
    /** 入口图标（可选，覆盖插件默认图标） */
    icon?: string
    /** 入口标签（可选，覆盖插件默认标签） */
    tags?: string[]
    /** 正则表达式列表 */
    regexps: string[]
    /** 解析器函数（可选，用于通过正则后的额外判断） */
    parser?: (context: PluginSearchContext) => Promise<boolean>
    /** 执行器函数（必须，用于处理执行结果） */
    runner: (context: PluginSearchContext) => Promise<void>
}

/**
 * Plugin Search Context
 */
export interface PluginSearchContext {
    /** 搜索参数 */
    args: {
        /** 搜索查询字符串 */
        query: string
        /** 匹配的正则表达式 */
        matchedRegexp?: string
        /** 正则匹配结果 */
        matches?: RegExpMatchArray | null
    }
    /** 插件API */
    api?: PluginAPI
}

/**
 * Plugin Components
 */
export interface PluginComponents {
    [componentName: string]: unknown
}

/**
 * Base Plugin Class
 * All plugins must extend this class
 */
export abstract class BasePlugin {
    // Required abstract properties
    abstract readonly id: string
    abstract readonly name: string
    abstract readonly version: string
    abstract readonly type?: 'app' | 'background'  // 新增 type 字段
    abstract readonly description?: string
    abstract readonly author?: string
    abstract readonly dependencies?: string[]
    abstract readonly permissions?: string[]
    abstract readonly minAppVersion?: string

    // Optional properties with defaults
    readonly search_regexps?: PluginSearchEntry[] = []
    readonly logs?: PluginLogConfig
    readonly configs?: PluginConfigDefinition
    readonly contextMenus?: PluginContextMenu[]
    readonly hotkeys?: PluginHotkey[]
    readonly subscriptions?: PluginSubscription[]
    readonly notifications?: PluginNotificationConfig
    readonly storage?: PluginStorageConfig
    readonly queue?: PluginQueueConfig
    readonly builder?: PluginBuilderFunction

    // Internal state
    protected _state: PluginState = {
      loaded: false,
      activated: false,
      error: null,
    }

    protected _api: PluginAPI | null = null
    protected _config: PluginConfig = {}
    protected _components: PluginComponents = {}
    private _apiInitialized = false

    /**
     * Get plugin metadata
     */
    get metadata(): PluginMetadata {
      const metadata: PluginMetadata = {
        id: this.id,
        name: this.name,
        version: this.version,
        dependencies: this.dependencies || [],
        permissions: this.permissions || [],
      }
      if (this.type !== undefined) metadata.type = this.type
      if (this.description !== undefined) metadata.description = this.description
      if (this.author !== undefined) metadata.author = this.author
      if (this.minAppVersion !== undefined) metadata.minAppVersion = this.minAppVersion
      return metadata
    }

    /**
     * Get plugin state
     */
    get state(): PluginState {
      return { ...this._state }
    }

    /**
     * Initialize plugin with API (only once)
     */
    initialize(api: PluginAPI): void {
      if (this._apiInitialized) {
        console.warn(`[${this.name}] API already initialized, ignoring duplicate initialization`)
        return
      }
      
      this._api = api
      this._apiInitialized = true
      this._state.loaded = true
      console.log(`[${this.name}] API initialized successfully`)
    }

    /**
     * Set API (internal method, used by PluginManager)
     */
    _setAPI(api: PluginAPI): void {
      if (this._apiInitialized) {
        console.warn(`[${this.name}] API already initialized, ignoring _setAPI call`)
        return
      }
      
      this._api = api
      this._apiInitialized = true
      console.log(`[${this.name}] API set successfully via _setAPI`)
    }

    /**
     * Get API (protected method for subclasses)
     */
    protected get api(): PluginAPI | null {
      if (!this._api && !this._apiInitialized) {
        // 尝试从全局获取API（仅在未初始化时）
        this._tryInitializeFromGlobal()
      }
      return this._api
    }

    /**
     * 尝试从全局 PluginManager 初始化 API（仅一次）
     */
    private _tryInitializeFromGlobal(): void {
      if (this._apiInitialized) {
        return
      }

      try {
        const globalWindow = window as unknown as { 
          pluginManager?: { createPluginAPI?: (id: string) => PluginAPI }
        }
        const pluginManager = globalWindow.pluginManager
        
        if (pluginManager && typeof pluginManager.createPluginAPI === 'function') {
          const api = pluginManager.createPluginAPI(this.id)
          if (api) {
            this._api = api
            this._apiInitialized = true
            console.log(`[${this.name}] API initialized from global PluginManager`)
          }
        }
      } catch (error) {
        console.error(`[${this.name}] Failed to initialize API from global:`, error)
      }
    }

    /**
     * 统一的方法调用接口（供外部调用插件方法）
     */
    async call(methodName: string, ...args: unknown[]): Promise<unknown> {
      try {
        // 定义允许外部调用的方法列表
        const allowedMethods = [
          'onLoad',
          'onActivate', 
          'onDeactivate',
          'onUnload',
          'onLaunch',
          'onProtocolNavigate',
        ]

        if (!allowedMethods.includes(methodName)) {
          throw new Error(`Method '${methodName}' is not allowed to be called externally`)
        }

        // 确保 API 可用
        if (!this.api && !this._apiInitialized) {
          this._tryInitializeFromGlobal()
        }

        // 检查方法是否存在
        const method = (this as any)[methodName]
        if (typeof method !== 'function') {
          console.warn(`[${this.name}] Method '${methodName}' not found, skipping call`)
          return undefined
        }

        // 调用方法
        console.log(`[${this.name}] Calling method: ${methodName}`, args)
        const result = await method.apply(this, args)
        console.log(`[${this.name}] Method '${methodName}' completed successfully`)
        return result
      } catch (error) {
        console.error(`[${this.name}] Method '${methodName}' failed:`, error)
        throw error
      }
    }

    /**
     * Log a message
     */
    protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void {
      if (this.api) {
        this.api.log(level, `[${this.name}] ${message}`, ...args)
      } else {
        console[level](`[${this.name}] ${message}`, ...args)
      }
    }

    /**
     * Send a notification
     */
    protected sendNotification(type: 'info' | 'success' | 'warning' | 'error', options: unknown): void {
      if (this.api) {
        this.api.sendNotification(type, options)
      }
    }

    /**
     * Get storage instance
     */
    protected getStorage(): unknown {
      return this.api?.getStorage()
    }

    /**
     * Emit an event
     */
    protected emit(event: string, data?: unknown): void {
      if (this.api) {
        this.api.emit(event, data)
      }
    }

    /**
     * Listen to an event
     */
    protected on(event: string, handler: (data?: unknown) => void): void {
      if (this.api) {
        this.api.on(event, handler)
      }
    }

    /**
     * Remove event listener
     */
    protected off(event: string, handler?: (data?: unknown) => void): void {
      if (this.api) {
        this.api.off(event, handler)
      }
    }

    /**
     * Get plugin configuration
     */
    protected getConfig(): PluginConfig {
      if (this._api) {
        return this._api.getConfig()
      }
      return this._config
    }

    /**
     * Set plugin configuration
     */
    protected setConfig(config: Partial<PluginConfig>): void {
      if (this._api) {
        this._api.setConfig(config)
      } else {
        this._config = { ...this._config, ...config }
      }
    }

    /**
     * Register a component
     */
    protected registerComponent(name: string, component: unknown): void {
      if (this._api) {
        this._api.registerComponent(name, component)
      } else {
        this._components[name] = component
      }
    }

    // Lifecycle methods (to be implemented by plugins)
    async onLoad(): Promise<void> {
      this.log('info', 'Plugin loaded')
      this._state.loaded = true
    }

    async onActivate(): Promise<void> {
      this.log('info', 'Plugin activated')
      this._state.activated = true
    }

    async onDeactivate(): Promise<void> {
      this.log('info', 'Plugin deactivated')
      this._state.activated = false
    }

    async onUnload(): Promise<void> {
      this.log('info', 'Plugin unloaded')
      this._state.loaded = false
    }

    /**
     * Get plugin metadata
     */
    getMetadata(): PluginMetadata {
      return this.metadata
    }

    /**
     * Update plugin state
     */
    protected setState(updates: Partial<PluginState>): void {
      this._state = { ...this._state, ...updates }
    }

    /**
     * Check if plugin is loaded
     */
    isLoaded(): boolean {
      return this._state.loaded
    }

    /**
     * Check if plugin is activated
     */
    isActivated(): boolean {
      return this._state.activated
    }

    /**
     * Get plugin error if any
     */
    getError(): string | null {
      return this._state.error
    }

    /**
     * Set plugin error
     */
    protected setError(error: string | null): void {
      this._state.error = error
    }
}
