import type { App } from 'vue'
import type { PluginAPI, PluginConfig, PluginMetadata, PluginState, PluginComponents } from '../../types/plugin'

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
  onConfigChange?(newConfig: PluginConfig, oldConfig: PluginConfig): Promise<void>

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
   * 日志记录辅助方法
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void {
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
