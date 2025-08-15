/**
 * Plugin SDK for Mira Launcher
 * This file provides the necessary types and base classes for plugin development
 * without requiring direct imports from the main application source code.
 */

/**
 * Plugin Metadata Interface
 */
export interface PluginMetadata {
    id: string
    name: string
    version: string
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
 * Plugin Configuration Definition
 */
export interface PluginConfigDefinition {
    properties: Record<string, any>
    required?: string[]
    defaults?: Record<string, any>
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
export type PluginBuilderFunction = (options?: any) => any

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
    [key: string]: any
}

/**
 * Plugin Components
 */
export interface PluginComponents {
    [componentName: string]: any
}

/**
 * Plugin API (simplified for external plugins)
 */
export interface PluginAPI {
    log: (level: string, message: string, ...args: any[]) => void
    sendNotification: (type: string, options: any) => void
    getStorage: () => any
    emit: (event: string, data?: any) => void
    on: (event: string, handler: (data?: any) => void) => void
    off: (event: string, handler?: (data?: any) => void) => void
    getConfig: () => PluginConfig
    setConfig: (config: Partial<PluginConfig>) => void
    registerComponent: (name: string, component: any) => void
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
    abstract readonly description?: string
    abstract readonly author?: string
    abstract readonly dependencies?: string[]
    abstract readonly permissions?: string[]
    abstract readonly minAppVersion?: string

    // Optional properties with defaults
    readonly search_regexps?: string[] = []
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
        error: null
    }

    protected _api: PluginAPI | null = null
    protected _config: PluginConfig = {}
    protected _components: PluginComponents = {}

    /**
     * Get plugin metadata
     */
    get metadata(): PluginMetadata {
        const metadata: PluginMetadata = {
            id: this.id,
            name: this.name,
            version: this.version,
            dependencies: this.dependencies || [],
            permissions: this.permissions || []
        }
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
     * Initialize plugin with API
     */
    initialize(api: PluginAPI): void {
        this._api = api
        this._state.loaded = true
    }

    /**
     * Log a message
     */
    protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
        if (this._api) {
            this._api.log(level, `[${this.name}] ${message}`, ...args)
        } else {
            console[level](`[${this.name}] ${message}`, ...args)
        }
    }

    /**
     * Send a notification
     */
    protected sendNotification(type: 'info' | 'success' | 'warning' | 'error', options: any): void {
        if (this._api) {
            this._api.sendNotification(type, options)
        }
    }

    /**
     * Get storage instance
     */
    protected getStorage(): any {
        return this._api?.getStorage()
    }

    /**
     * Emit an event
     */
    protected emit(event: string, data?: any): void {
        if (this._api) {
            this._api.emit(event, data)
        }
    }

    /**
     * Listen to an event
     */
    protected on(event: string, handler: (data?: any) => void): void {
        if (this._api) {
            this._api.on(event, handler)
        }
    }

    /**
     * Remove event listener
     */
    protected off(event: string, handler?: (data?: any) => void): void {
        if (this._api) {
            this._api.off(event, handler)
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
    protected registerComponent(name: string, component: any): void {
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
