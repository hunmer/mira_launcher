import type { PluginMetadata } from '@/types/plugin'
import { BasePlugin } from '@/plugins/core/BasePlugin'
import type { PluginDiscoveryResult } from './Discovery'

/**
 * 插件加载结果
 */
export interface PluginLoadResult {
  /** 插件 ID */
  pluginId: string
  /** 插件类构造函数 */
  pluginClass?: new () => BasePlugin
  /** 插件元数据 */
  metadata: PluginMetadata
  /** 是否加载成功 */
  success: boolean
  /** 错误信息 */
  error?: string
  /** 加载时间 */
  loadTime: number
  /** 插件模块 */
  module?: any
}

/**
 * 插件加载配置
 */
export interface PluginLoaderConfig {
  /** 加载超时时间（毫秒） */
  loadTimeout: number
  /** 是否启用缓存 */
  enableCache: boolean
  /** 是否验证插件类 */
  validatePluginClass: boolean
  /** 允许的权限列表 */
  allowedPermissions: string[]
  /** 沙箱模式 */
  sandboxMode: boolean
}

/**
 * 插件模块缓存
 */
interface PluginModuleCache {
  module: any
  loadTime: number
  metadata: PluginMetadata
}

/**
 * 插件加载器
 * 负责动态加载插件模块和实例化插件类
 */
export class PluginLoader {
  private config: PluginLoaderConfig
  private moduleCache: Map<string, PluginModuleCache> = new Map()
  private loadingPromises: Map<string, Promise<PluginLoadResult>> = new Map()

  constructor(config?: Partial<PluginLoaderConfig>) {
    this.config = {
      loadTimeout: 10000,
      enableCache: true,
      validatePluginClass: true,
      allowedPermissions: ['storage', 'notification', 'menu', 'component'],
      sandboxMode: true,
      ...config
    }
  }

  /**
   * 加载插件
   */
  async loadPlugin(discoveryResult: PluginDiscoveryResult): Promise<PluginLoadResult> {
    const { metadata, entryPath, pluginPath } = discoveryResult
    const startTime = performance.now()

    // 检查是否已经在加载中
    const existingPromise = this.loadingPromises.get(metadata.id)
    if (existingPromise) {
      return existingPromise
    }

    const loadPromise = this.doLoadPlugin(discoveryResult, startTime)
    this.loadingPromises.set(metadata.id, loadPromise)

    try {
      const result = await loadPromise
      return result
    } finally {
      this.loadingPromises.delete(metadata.id)
    }
  }

  /**
   * 实际加载插件的实现
   */
  private async doLoadPlugin(discoveryResult: PluginDiscoveryResult, startTime: number): Promise<PluginLoadResult> {
    const { metadata, entryPath } = discoveryResult

    try {
      // 检查缓存
      if (this.config.enableCache && this.moduleCache.has(metadata.id)) {
        const cached = this.moduleCache.get(metadata.id)!
        console.log(`[PluginLoader] Using cached module for plugin: ${metadata.id}`)
        
        return {
          pluginId: metadata.id,
          pluginClass: cached.module.default || cached.module.Plugin,
          metadata: cached.metadata,
          success: true,
          loadTime: performance.now() - startTime,
          module: cached.module
        }
      }

      // 验证权限
      const permissionCheck = this.validatePermissions(metadata)
      if (!permissionCheck.valid) {
        throw new Error(`Invalid permissions: ${permissionCheck.errors.join(', ')}`)
      }

      // 动态导入插件模块
      const module = await this.importPluginModule(entryPath)

      // 验证插件类
      const pluginClass = this.extractPluginClass(module, metadata)
      if (this.config.validatePluginClass && !pluginClass) {
        throw new Error('Plugin module does not export a valid plugin class')
      }

      // 缓存模块
      if (this.config.enableCache) {
        this.moduleCache.set(metadata.id, {
          module,
          loadTime: Date.now(),
          metadata
        })
      }

      const loadTime = performance.now() - startTime
      console.log(`[PluginLoader] Successfully loaded plugin: ${metadata.id} (${loadTime.toFixed(2)}ms)`)

      const result: PluginLoadResult = {
        pluginId: metadata.id,
        metadata,
        success: true,
        loadTime,
        module
      }
      
      if (pluginClass) {
        result.pluginClass = pluginClass
      }

      return result
    } catch (error) {
      const loadTime = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown loading error'
      
      console.error(`[PluginLoader] Failed to load plugin ${metadata.id}:`, error)

      return {
        pluginId: metadata.id,
        metadata,
        success: false,
        error: errorMessage,
        loadTime
      }
    }
  }

  /**
   * 动态导入插件模块
   */
  private async importPluginModule(entryPath: string): Promise<any> {
    try {
      // 使用超时包装动态导入
      const importPromise = this.createDynamicImport(entryPath)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Plugin load timeout')), this.config.loadTimeout)
      })

      const module = await Promise.race([importPromise, timeoutPromise])
      return module
    } catch (error) {
      console.error(`[PluginLoader] Failed to import module from ${entryPath}:`, error)
      throw error
    }
  }

  /**
   * 创建动态导入
   * 支持不同的文件类型和环境
   */
  private async createDynamicImport(entryPath: string): Promise<any> {
    // 处理不同的文件扩展名
    const ext = entryPath.substring(entryPath.lastIndexOf('.'))
    
    switch (ext) {
      case '.js':
      case '.mjs':
        return await import(/* @vite-ignore */ entryPath)
      
      case '.ts':
        // TypeScript 文件需要先编译（在实际环境中可能需要不同的处理）
        console.warn(`[PluginLoader] Loading TypeScript files directly is not recommended: ${entryPath}`)
        return await import(/* @vite-ignore */ entryPath)
      
      case '.vue':
        // Vue 单文件组件
        return await import(/* @vite-ignore */ entryPath)
      
      default:
        throw new Error(`Unsupported file type: ${ext}`)
    }
  }

  /**
   * 从模块中提取插件类
   */
  private extractPluginClass(module: any, metadata: PluginMetadata): (new () => BasePlugin) | undefined {
    // 尝试多种导出方式
    const candidates = [
      module.default,
      module.Plugin,
      module[metadata.name],
      module[`${metadata.name}Plugin`],
      ...Object.values(module).filter(value => 
        typeof value === 'function' && 
        value.prototype instanceof BasePlugin
      )
    ]

    for (const candidate of candidates) {
      if (this.isValidPluginClass(candidate)) {
        return candidate as new () => BasePlugin
      }
    }

    return undefined
  }

  /**
   * 验证是否为有效的插件类
   */
  private isValidPluginClass(candidate: any): boolean {
    if (typeof candidate !== 'function') {
      return false
    }

    try {
      // 检查是否继承自 BasePlugin
      return candidate.prototype instanceof BasePlugin
    } catch (error) {
      console.warn('[PluginLoader] Error checking plugin class:', error)
      return false
    }
  }

  /**
   * 验证插件权限
   */
  private validatePermissions(metadata: PluginMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const requestedPermissions = metadata.permissions || []

    for (const permission of requestedPermissions) {
      if (!this.config.allowedPermissions.includes(permission)) {
        errors.push(`Permission not allowed: ${permission}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 批量加载插件
   */
  async loadPlugins(discoveryResults: PluginDiscoveryResult[]): Promise<PluginLoadResult[]> {
    const loadPromises = discoveryResults.map(result => this.loadPlugin(result))
    const results = await Promise.allSettled(loadPromises)

    return results.map((result, index) => {
      const discoveryResult = discoveryResults[index]
      if (!discoveryResult) {
        throw new Error(`Missing discovery result at index ${index}`)
      }
      
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        const metadata = discoveryResult.metadata
        console.error(`[PluginLoader] Failed to load plugin ${metadata.id}:`, result.reason)
        
        return {
          pluginId: metadata.id,
          metadata,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
          loadTime: 0
        }
      }
    })
  }

  /**
   * 卸载插件模块
   */
  unloadPlugin(pluginId: string): boolean {
    if (this.moduleCache.has(pluginId)) {
      this.moduleCache.delete(pluginId)
      console.log(`[PluginLoader] Unloaded plugin module: ${pluginId}`)
      return true
    }
    return false
  }

  /**
   * 获取已加载的插件模块
   */
  getLoadedModule(pluginId: string): any | undefined {
    return this.moduleCache.get(pluginId)?.module
  }

  /**
   * 检查插件是否已加载
   */
  isPluginLoaded(pluginId: string): boolean {
    return this.moduleCache.has(pluginId)
  }

  /**
   * 获取加载统计信息
   */
  getLoadStats() {
    const modules = Array.from(this.moduleCache.values())
    
    return {
      totalLoaded: modules.length,
      avgLoadTime: modules.length > 0 
        ? modules.reduce((sum, cache) => sum + (Date.now() - cache.loadTime), 0) / modules.length 
        : 0,
      cacheEnabled: this.config.enableCache,
      loadTimeout: this.config.loadTimeout,
      loadedPlugins: modules.map(cache => ({
        id: cache.metadata.id,
        name: cache.metadata.name,
        version: cache.metadata.version,
        loadTime: cache.loadTime
      }))
    }
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.moduleCache.clear()
    console.log('[PluginLoader] Cleared all module cache')
  }

  /**
   * 预热插件加载器
   */
  async warmup(): Promise<void> {
    console.log('[PluginLoader] Warming up plugin loader...')
    // 可以在这里执行一些预热操作，比如预编译模板等
  }

  /**
   * 重新加载插件（清除缓存后重新加载）
   */
  async reloadPlugin(discoveryResult: PluginDiscoveryResult): Promise<PluginLoadResult> {
    const { metadata } = discoveryResult
    
    // 清除缓存
    this.unloadPlugin(metadata.id)
    
    // 重新加载
    return await this.loadPlugin(discoveryResult)
  }

  /**
   * 获取插件加载器配置
   */
  getConfig(): PluginLoaderConfig {
    return { ...this.config }
  }

  /**
   * 更新插件加载器配置
   */
  updateConfig(newConfig: Partial<PluginLoaderConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[PluginLoader] Configuration updated')
  }
}

/**
 * 创建插件加载器实例
 */
export function createPluginLoader(config?: Partial<PluginLoaderConfig>): PluginLoader {
  return new PluginLoader(config)
}

/**
 * 全局插件加载器实例
 */
export const globalPluginLoader = new PluginLoader()

/**
 * 插件加载工具函数
 */
export const loaderUtils = {
  /**
   * 检查模块是否为有效的插件模块
   */
  isValidPluginModule(module: any): boolean {
    if (!module) return false
    
    // 检查是否有默认导出或插件类导出
    const hasValidExport = !!(
      module.default ||
      module.Plugin ||
      Object.values(module).some(value => 
        typeof value === 'function' && 
        value.prototype instanceof BasePlugin
      )
    )
    
    return hasValidExport
  },

  /**
   * 提取模块信息
   */
  extractModuleInfo(module: any) {
    return {
      hasDefault: !!module.default,
      hasPlugin: !!module.Plugin,
      exports: Object.keys(module),
      functions: Object.keys(module).filter(key => typeof module[key] === 'function'),
      classes: Object.keys(module).filter(key => 
        typeof module[key] === 'function' && 
        module[key].prototype && 
        module[key].prototype.constructor === module[key]
      )
    }
  },

  /**
   * 安全地执行模块代码
   */
  safeExecuteModule(moduleFactory: () => any): { success: boolean; result?: any; error?: Error } {
    try {
      const result = moduleFactory()
      return { success: true, result }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown execution error')
      }
    }
  }
}
