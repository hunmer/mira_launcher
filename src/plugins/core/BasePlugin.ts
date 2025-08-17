import type { App } from 'vue'
import type {
  PluginAPI,
  PluginBuilderFunction,
  PluginComponents,
  PluginConfig,
  PluginConfigDefinition,
  PluginContextMenu,
  PluginHotkey,
  PluginLogConfig,
  PluginMetadata,
  PluginNotificationConfig,
  PluginQueueConfig,
  PluginSearchEntry,
  PluginState,
  PluginStorageConfig,
  PluginSubscription,
} from '../../types/plugin'

/**
 * 插件基类
 * 所有插件都必须继承此抽象类并实现所有抽象方法
 * 遵循 Vue 3 Composition API 风格和项目架构规范
 */
export abstract class BasePlugin {
  /**
   * 插件唯一标识符
   * 格式: com.domain.plugin-name
   */
  abstract readonly id: string

  /**
   * 插件名称
   */
  abstract readonly name: string

  /**
   * 插件版本
   * 遵循 SemVer 规范
   */
  abstract readonly version: string

  /**
   * 插件描述
   */
  abstract readonly description?: string

  /**
   * 插件作者
   */
  abstract readonly author?: string

  /**
   * 插件依赖列表
   */
  abstract readonly dependencies?: string[]

  /**
   * 插件最小主应用版本要求
   */
  abstract readonly minAppVersion?: string

  /**
   * 插件权限要求
   */
  abstract readonly permissions?: string[]

  /**
   * 搜索框正则规则
   */
  abstract readonly search_regexps?: PluginSearchEntry[]

  /**
   * 插件日志配置
   */
  abstract readonly logs?: PluginLogConfig

  /**
   * 插件配置定义
   */
  abstract readonly configs?: PluginConfigDefinition

  /**
   * 插件右键菜单
   */
  abstract readonly contextMenus?: PluginContextMenu[]

  /**
   * 插件快捷键
   */
  abstract readonly hotkeys?: PluginHotkey[]

  /**
   * 插件事件订阅
   */
  abstract readonly subscriptions?: PluginSubscription[]

  /**
   * 插件通知配置
   */
  abstract readonly notifications?: PluginNotificationConfig

  /**
   * 插件存储配置
   */
  abstract readonly storage?: PluginStorageConfig

  /**
   * 队列管理器配置
   */
  abstract readonly queue?: PluginQueueConfig

  /**
   * 插件构建器函数
   */
  abstract readonly builder?: PluginBuilderFunction

  /**
   * 插件当前状态
   */
  protected _state: PluginState = 'unloaded'

  /**
   * 插件配置
   */
  protected _config: PluginConfig = {}

  /**
   * 插件 API 实例
   */
  protected _api?: PluginAPI

  /**
   * Vue 应用实例
   */
  protected _app?: App

  /**
   * 获取插件元数据
   */
  get metadata(): PluginMetadata {
    const metadata: any = {
      id: this.id,
      name: this.name,
      version: this.version,
      dependencies: this.dependencies || [],
      permissions: this.permissions || [],
    }

    if (this.description) {
      metadata.description = this.description
    }

    if (this.author) {
      metadata.author = this.author
    }

    if (this.minAppVersion) {
      metadata.minAppVersion = this.minAppVersion
    }

    // 添加新字段支持
    if (this.search_regexps) {
      metadata.search_regexps = this.search_regexps
    }

    if (this.logs) {
      metadata.logs = this.logs
    }

    if (this.configs) {
      metadata.configs = this.configs
    }

    if (this.contextMenus) {
      metadata.contextMenus = this.contextMenus
    }

    if (this.hotkeys) {
      metadata.hotkeys = this.hotkeys
    }

    if (this.subscriptions) {
      metadata.subscriptions = this.subscriptions
    }

    if (this.notifications) {
      metadata.notifications = this.notifications
    }

    if (this.storage) {
      metadata.storage = this.storage
    }

    if (this.queue) {
      metadata.queue = this.queue
    }

    if (this.builder) {
      metadata.builder = this.builder
    }

    return metadata
  }

  /**
   * 获取插件状态
   */
  get state(): PluginState {
    return this._state
  }

  /**
   * 获取插件配置
   */
  get config(): PluginConfig {
    return { ...this._config }
  }

  /**
   * 获取插件组件
   * 子类可以重写此方法来提供自定义组件
   */
  getComponents(): PluginComponents {
    return {}
  }

  /**
   * 插件加载生命周期方法
   * 在插件首次加载时调用，用于初始化插件资源
   */
  abstract onLoad(api: PluginAPI, app: App): Promise<void>

  /**
   * 插件卸载生命周期方法
   * 在插件卸载时调用，用于清理插件资源
   */
  abstract onUnload(): Promise<void>

  /**
   * 插件激活生命周期方法
   * 在插件启用时调用，用于注册插件功能
   */
  abstract onActivate(): Promise<void>

  /**
   * 插件停用生命周期方法
   * 在插件禁用时调用，用于注销插件功能
   */
  abstract onDeactivate(): Promise<void>

  /**
   * 插件配置更新处理方法
   * 在插件配置发生变化时调用
   */
  onConfigChange?(
    newConfig: PluginConfig,
    oldConfig: PluginConfig
  ): Promise<void>

  /**
   * 插件错误处理方法
   * 在插件运行过程中发生错误时调用
   */
  onError?(error: Error): Promise<void>

  /**
   * 内部方法：设置插件状态
   */
  _setState(state: PluginState): void {
    this._state = state
  }

  /**
   * 内部方法：设置插件配置
   */
  _setConfig(config: PluginConfig): void {
    this._config = { ...config }
  }

  /**
   * 内部方法：设置插件 API 实例
   */
  _setAPI(api: PluginAPI): void {
    this._api = api
  }

  /**
   * 内部方法：设置 Vue 应用实例
   */
  _setApp(app: App): void {
    this._app = app
  }

  /**
   * 获取插件 API
   */
  protected getAPI(): PluginAPI {
    if (!this._api) {
      throw new Error(`Plugin ${this.id}: API not initialized`)
    }
    return this._api
  }

  /**
   * 获取 Vue 应用实例
   */
  protected getApp(): App {
    if (!this._app) {
      throw new Error(`Plugin ${this.id}: Vue app not initialized`)
    }
    return this._app
  }

  /**
   * 注册右键菜单
   */
  protected registerContextMenus(): void {
    if (this.contextMenus && this._api) {
      this.contextMenus.forEach(menu => {
        // 通过API注册右键菜单
        console.log(`[Plugin:${this.name}] Registering context menu:`, menu.id)
      })
    }
  }

  /**
   * 注册快捷键
   */
  protected registerHotkeys(): void {
    if (this.hotkeys && this._api) {
      this.hotkeys.forEach(hotkey => {
        // 通过API注册快捷键
        console.log(
          `[Plugin:${this.name}] Registering hotkey:`,
          hotkey.combination,
        )
      })
    }
  }

  /**
   * 订阅事件
   */
  protected subscribeEvents(): void {
    if (this.subscriptions && this._api) {
      this.subscriptions.forEach(subscription => {
        // 通过API订阅事件
        console.log(
          `[Plugin:${this.name}] Subscribing to event:`,
          subscription.event,
        )
      })
    }
  }

  /**
   * 发送通知
   */
  protected sendNotification(
    type: string,
    options?: Record<string, unknown>,
  ): void {
    if (this._api) {
      console.log(`[Plugin:${this.name}] Sending notification:`, type, options)
      // 通过API发送通知
    }
  }

  /**
   * 获取存储实例
   */
  protected getStorage(): unknown {
    if (this._api) {
      console.log(`[Plugin:${this.name}] Getting storage instance`)
      // 通过API获取存储实例
      return {}
    }
    return null
  }

  /**
   * 获取队列实例
   */
  protected getQueue(): unknown {
    if (this._api) {
      console.log(`[Plugin:${this.name}] Getting queue instance`)
      // 通过API获取队列实例
      return {}
    }
    return null
  }

  /**
   * 执行构建器函数
   */
  protected executeBuilder(options?: Record<string, unknown>): unknown {
    if (this.builder && this._api && this._app) {
      console.log(`[Plugin:${this.name}] Executing builder function`)
      return this.builder({ ...options, api: this._api, app: this._app })
    }
    return null
  }

  /**
   * 日志记录辅助方法
   */
  protected log(
    level: 'info' | 'warn' | 'error',
    message: string,
    ...args: unknown[]
  ): void {
    const prefix = `[Plugin:${this.name}]`
    switch (level) {
    case 'info':
      console.log(prefix, message, ...args)
      break
    case 'warn':
      console.warn(prefix, message, ...args)
      break
    case 'error':
      console.error(prefix, message, ...args)
      break
    }
  }
}

/**
 * 插件工厂函数类型
 * 用于创建插件实例
 */
export type PluginFactory = () => BasePlugin

/**
 * 插件导出接口
 * 插件模块应该默认导出符合此接口的对象
 */
export interface PluginExport {
  default: PluginFactory
  metadata?: Partial<PluginMetadata>
}
