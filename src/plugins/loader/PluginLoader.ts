import { BasePlugin } from '@/plugins/core/BasePlugin'
import { getRegisteredPlugin, getRegisteredPluginIds, isPluginRegistered } from '@/plugins/registry'
import type { PluginMetadata } from '@/types/plugin'
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
      const isDev = import.meta.env.DEV

      if (this.config.validatePluginClass && !pluginClass) {
        if (isDev) {
          console.warn(`[PluginLoader] Plugin class validation failed for ${metadata.id}, but continuing in dev mode`)
          console.log(`[PluginLoader] Module structure:`, module)
        } else {
          throw new Error('Plugin module does not export a valid plugin class')
        }
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
      // 首先检查插件是否已经在注册表中（开发环境）
      const isDev = import.meta.env.DEV

      if (isDev) {
        // 从路径中提取插件 ID
        console.log(`[PluginLoader] Attempting to extract plugin ID from path: ${entryPath}`)
        const pluginIdMatch = entryPath.match(/[\\\/]([^\\\/]+)[\\\/]index\.[tj]s?$/) ||
          entryPath.match(/[\\\/]([^\\\/]+)[\\\/]index\.js$/) ||
          entryPath.match(/[\\\/]([^\\\/]+)$/) ||
          entryPath.match(/([^\\\/]+)[\\\/]index\.[tj]s?$/) ||
          entryPath.match(/([^\\\/]+)[\\\/]index\.js$/)

        if (pluginIdMatch) {
          const pluginId = pluginIdMatch[1]
          console.log(`[PluginLoader] Extracted plugin ID: ${pluginId}`)

          if (pluginId && isPluginRegistered(pluginId)) {
            console.log(`[PluginLoader] Using registered plugin: ${pluginId}`)
            const factory = getRegisteredPlugin(pluginId)!
            return await factory()
          } else {
            console.log(`[PluginLoader] Plugin ${pluginId} not found in registry. Available: ${getRegisteredPluginIds().join(', ')}`)
          }
        } else {
          console.log(`[PluginLoader] Could not extract plugin ID from path: ${entryPath}`)
        }
      }      // 使用超时包装动态导入
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

    // 在开发环境中，将文件路径转换为 Vite 可以处理的路径
    const isDev = import.meta.env.DEV

    if (isDev) {
      // 将绝对路径转换为相对于项目根目录的路径
      let importPath = entryPath

      // 如果是 Windows 绝对路径，转换为相对路径
      if (entryPath.match(/^[A-Za-z]:\\/)) {
        // 提取相对于项目根目录的路径
        const projectRootPattern = /.*[\\\/]mira_launcher[\\\/]/
        if (projectRootPattern.test(entryPath)) {
          importPath = entryPath.replace(projectRootPattern, './')
          importPath = importPath.replace(/\\/g, '/')

          // 确保路径以 ./ 开头
          if (!importPath.startsWith('./')) {
            importPath = './' + importPath
          }
        }
      }

      console.log(`[PluginLoader] Converting path: ${entryPath} -> ${importPath}`)

      try {
        // For JavaScript files, ensure we're using the correct extension
        if (ext === '.js' && !importPath.endsWith('.js')) {
          importPath += '.js'
        }

        // 直接使用相对路径导入
        return await import(/* @vite-ignore */ importPath)
      } catch (importError) {
        console.warn(`[PluginLoader] Relative import failed for ${importPath}:`, importError)

        // 如果相对路径导入失败，尝试使用原始路径
        try {
          return await import(/* @vite-ignore */ entryPath)
        } catch (originalError) {
          console.error(`[PluginLoader] Both import methods failed:`, {
            relativePath: importPath,
            relativeError: importError,
            originalPath: entryPath,
            originalError: originalError
          })
          throw originalError
        }
      }
    }

    // 生产环境或其他情况的处理
    switch (ext) {
      case '.js':
      case '.mjs':
        return await import(/* @vite-ignore */ entryPath)

      case '.ts':
        // TypeScript 文件需要先编译
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
    console.log(`[PluginLoader] Extracting plugin class for ${metadata.id}. Module:`, Object.keys(module))

    // 尝试多种导出方式
    const candidates = [
      module.default,
      module.Plugin,
      module[metadata.name],
      module[`${metadata.name}Plugin`],
      module[metadata.id],
      module[metadata.id.replace(/-/g, '')], // 移除连字符
      ...Object.values(module).filter(value =>
        typeof value === 'function'
      )
    ]

    // 移除重复项和undefined
    const uniqueCandidates = [...new Set(candidates)].filter(c => c)

    console.log(`[PluginLoader] Found ${uniqueCandidates.length} plugin class candidates`)

    for (const candidate of uniqueCandidates) {
      console.log(`[PluginLoader] Testing candidate:`, candidate.name || 'unnamed')
      if (this.isValidPluginClass(candidate)) {
        console.log(`[PluginLoader] Valid plugin class found: ${candidate.name}`)
        return candidate as new () => BasePlugin
      }
    }

    console.log(`[PluginLoader] No valid plugin class found in module for ${metadata.id}`)
    return undefined
  }

  /**
   * 验证是否为有效的插件类
   */
  private isValidPluginClass(candidate: any): boolean {
    if (typeof candidate !== 'function') {
      console.log(`[PluginLoader] Candidate is not a function:`, typeof candidate)
      return false
    }

    try {
      // 检查是否继承自 BasePlugin
      let extendsBasePlugin = false
      try {
        extendsBasePlugin = candidate.prototype instanceof BasePlugin
      } catch (e) {
        // BasePlugin may not be available in the plugin's context
        console.log(`[PluginLoader] BasePlugin check failed for ${candidate.name}, continuing with duck typing`)
      }

      // 如果继承自 BasePlugin，直接认为有效
      if (extendsBasePlugin) {
        console.log(`[PluginLoader] Plugin ${candidate.name} extends BasePlugin`)
        return true
      }

      // 如果不继承 BasePlugin，使用鸭子类型检测 (duck typing)
      console.log(`[PluginLoader] Using duck typing for plugin ${candidate.name}`)

      // 检查原型上的方法
      const hasPrototypeMethods =
        typeof candidate.prototype.getMetadata === 'function' ||
        typeof candidate.prototype.onLoad === 'function' ||
        typeof candidate.prototype.onActivate === 'function'

      if (hasPrototypeMethods) {
        console.log(`[PluginLoader] Plugin ${candidate.name} has required prototype methods`)
        return true
      }

      // 尝试创建实例来检查实例属性和方法（仅在开发环境）
      const isDev = import.meta.env.DEV
      if (isDev) {
        try {
          console.log(`[PluginLoader] Attempting to create test instance of ${candidate.name}`)
          const testInstance = new candidate()

          // 检查必需的实例属性
          const hasRequiredProperties =
            typeof testInstance.id === 'string' &&
            typeof testInstance.name === 'string' &&
            typeof testInstance.version === 'string'

          // 检查必需的实例方法
          const hasRequiredMethods =
            typeof testInstance.getMetadata === 'function' ||
            typeof testInstance.onLoad === 'function' ||
            typeof testInstance.onActivate === 'function'

          const isValid = hasRequiredProperties || hasRequiredMethods
          console.log(`[PluginLoader] Test instance validation for ${candidate.name}: properties=${hasRequiredProperties}, methods=${hasRequiredMethods}, valid=${isValid}`)

          return isValid
        } catch (instanceError) {
          console.warn(`[PluginLoader] Could not create test instance of ${candidate.name}:`, instanceError)
          // 如果无法创建实例，就基于基本检查
          return false
        }
      }

      // 在生产环境中，只检查基本的函数特征
      return typeof candidate === 'function' && candidate.name
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
