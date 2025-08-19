// Plugin loader with enhanced Tauri support and eval()-based loading - Updated
import { BasePlugin } from '@/plugins/core/BasePlugin'
import {
  getRegisteredPlugin,
  getRegisteredPluginIds,
  isPluginRegistered,
} from '@/plugins/registry'
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
      ...config,
    }
  }

  /**
   * 加载插件（不立即执行代码，用于发现阶段）
   * 仅加载元数据，不执行插件代码
   */
  async loadPluginMetadataOnly(
    discoveryResult: PluginDiscoveryResult,
  ): Promise<PluginLoadResult> {
    const { metadata } = discoveryResult
    const startTime = performance.now()

    try {
      // 验证权限
      const permissionCheck = this.validatePermissions(metadata)
      if (!permissionCheck.valid) {
        throw new Error(
          `Invalid permissions: ${permissionCheck.errors.join(', ')}`,
        )
      }

      const loadTime = performance.now() - startTime
      console.log(
        `[PluginLoader] Metadata loaded for plugin: ${metadata.id} (${loadTime.toFixed(2)}ms)`,
      )

      return {
        pluginId: metadata.id,
        metadata,
        success: true,
        loadTime,
        // 不提供 pluginClass，表示代码未执行
      }
    } catch (error) {
      const loadTime = performance.now() - startTime
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown loading error'

      console.error(
        `[PluginLoader] Failed to load metadata for plugin ${metadata.id}:`,
        error,
      )

      return {
        pluginId: metadata.id,
        metadata,
        success: false,
        error: errorMessage,
        loadTime,
      }
    }
  }

  /**
   * 激活插件时执行代码加载
   * 仅在插件激活时执行这个方法
   */
  async loadAndExecutePluginCode(
    discoveryResult: PluginDiscoveryResult,
  ): Promise<PluginLoadResult> {
    const { metadata, entryPath } = discoveryResult
    const startTime = performance.now()

    try {
      // 检查缓存
      if (this.config.enableCache && this.moduleCache.has(metadata.id)) {
        const cached = this.moduleCache.get(metadata.id)!
        console.log(
          `[PluginLoader] Using cached module for plugin: ${metadata.id}`,
        )

        return {
          pluginId: metadata.id,
          pluginClass: cached.module.default || cached.module.Plugin,
          metadata: cached.metadata,
          success: true,
          loadTime: performance.now() - startTime,
          module: cached.module,
        }
      }

      // 动态导入并执行插件模块
      const module = await this.importPluginModule(entryPath)

      // 对于 eval 执行的插件，不需要验证插件类
      // 插件代码已经在 eval 中执行，全局对象已经创建

      // 缓存模块
      if (this.config.enableCache) {
        this.moduleCache.set(metadata.id, {
          module,
          loadTime: Date.now(),
          metadata,
        })
      }

      const loadTime = performance.now() - startTime
      console.log(
        `[PluginLoader] Successfully executed plugin code: ${metadata.id} (${loadTime.toFixed(2)}ms)`,
      )

      return {
        pluginId: metadata.id,
        metadata,
        success: true,
        loadTime,
        module,
        // 对于 eval 插件，不返回 pluginClass
      }
    } catch (error) {
      const loadTime = performance.now() - startTime
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown loading error'

      console.error(
        `[PluginLoader] Failed to execute plugin code ${metadata.id}:`,
        error,
      )

      return {
        pluginId: metadata.id,
        metadata,
        success: false,
        error: errorMessage,
        loadTime,
      }
    }
  }

  /**
   * 加载插件
   */
  async loadPlugin(
    discoveryResult: PluginDiscoveryResult,
  ): Promise<PluginLoadResult> {
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
  private async doLoadPlugin(
    discoveryResult: PluginDiscoveryResult,
    startTime: number,
  ): Promise<PluginLoadResult> {
    const { metadata, entryPath } = discoveryResult

    try {
      // 检查缓存
      if (this.config.enableCache && this.moduleCache.has(metadata.id)) {
        const cached = this.moduleCache.get(metadata.id)!
        console.log(
          `[PluginLoader] Using cached module for plugin: ${metadata.id}`,
        )

        return {
          pluginId: metadata.id,
          pluginClass: cached.module.default || cached.module.Plugin,
          metadata: cached.metadata,
          success: true,
          loadTime: performance.now() - startTime,
          module: cached.module,
        }
      }

      // 验证权限
      const permissionCheck = this.validatePermissions(metadata)
      if (!permissionCheck.valid) {
        throw new Error(
          `Invalid permissions: ${permissionCheck.errors.join(', ')}`,
        )
      }

      // 动态导入插件模块
      const module = await this.importPluginModule(entryPath)

      // 验证插件类
      const pluginClass = this.extractPluginClass(module, metadata)
      const isDev = import.meta.env.DEV

      if (this.config.validatePluginClass && !pluginClass) {
        if (isDev) {
          console.warn(
            `[PluginLoader] Plugin class validation failed for ${metadata.id}, but continuing in dev mode`,
          )
          console.log('[PluginLoader] Module structure:', module)
        } else {
          throw new Error('Plugin module does not export a valid plugin class')
        }
      }

      // 缓存模块
      if (this.config.enableCache) {
        this.moduleCache.set(metadata.id, {
          module,
          loadTime: Date.now(),
          metadata,
        })
      }

      const loadTime = performance.now() - startTime
      console.log(
        `[PluginLoader] Successfully loaded plugin: ${metadata.id} (${loadTime.toFixed(2)}ms)`,
      )

      const result: PluginLoadResult = {
        pluginId: metadata.id,
        metadata,
        success: true,
        loadTime,
        module,
      }

      if (pluginClass) {
        result.pluginClass = pluginClass
      }

      return result
    } catch (error) {
      const loadTime = performance.now() - startTime
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown loading error'

      console.error(
        `[PluginLoader] Failed to load plugin ${metadata.id}:`,
        error,
      )

      return {
        pluginId: metadata.id,
        metadata,
        success: false,
        error: errorMessage,
        loadTime,
      }
    }
  }

  /**
   * 动态导入插件模块
   */
  private async importPluginModule(entryPath: string): Promise<any> {
    try {
      // 检查是否在 Tauri 环境中
      const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
      const isDev = import.meta.env.DEV

      // 在开发环境中，先尝试从注册表加载
      if (isDev) {
        // 从路径中提取插件 ID
        console.log(
          `[PluginLoader] Attempting to extract plugin ID from path: ${entryPath}`,
        )
        const pluginIdMatch =
          entryPath.match(/[\\\/]([^\\\/]+)[\\\/]index\.[tj]s?$/) ||
          entryPath.match(/[\\\/]([^\\\/]+)[\\\/]index\.js$/) ||
          entryPath.match(/[\\\/]([^\\\/]+)$/) ||
          entryPath.match(/([^\\\/]+)[\\\/]index\.[tj]s?$/) ||
          entryPath.match(/([^\\\/]+)[\\\/]index\.js$/)

        if (pluginIdMatch) {
          const pluginId = pluginIdMatch[1]
          console.log(`[PluginLoader] Extracted plugin ID: ${pluginId}`)

          if (pluginId && isPluginRegistered(pluginId)) {
            console.log(`[PluginLoader] Using registered plugin: ${pluginId}`)
            const factory = getRegisteredPlugin(pluginId)
            if (factory) {
              return await factory()
            }
          } else {
            console.log(
              `[PluginLoader] Plugin ${pluginId} not found in registry. Available: ${getRegisteredPluginIds().join(', ')}`,
            )
          }
        } else {
          console.log(
            `[PluginLoader] Could not extract plugin ID from path: ${entryPath}`,
          )
        }
      }

      // 在 Tauri 环境中，使用文件系统 API + eval() 方式
      if (isTauri) {
        console.log(`[PluginLoader] Loading plugin via Tauri FS API: ${entryPath}`)
        
        // 提取插件ID用于后置处理
        const pluginIdMatch =
          entryPath.match(/[\\\/]([^\\\/]+)[\\\/]index\.[tj]s?$/) ||
          entryPath.match(/[\\\/]([^\\\/]+)[\\\/]index\.js$/) ||
          entryPath.match(/[\\\/]([^\\\/]+)$/) ||
          entryPath.match(/([^\\\/]+)[\\\/]index\.[tj]s?$/) ||
          entryPath.match(/([^\\\/]+)[\\\/]index\.js$/)
          
        const pluginId = pluginIdMatch ? pluginIdMatch[1] : undefined
        
        return await this.loadPluginWithTauriFS(entryPath, pluginId)
      }

      // 非 Tauri 环境，使用传统的动态导入
      const importPromise = this.createDynamicImport(entryPath)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Plugin load timeout')),
          this.config.loadTimeout,
        )
      })

      const module = await Promise.race([importPromise, timeoutPromise])
      return module
    } catch (error) {
      console.error(
        `[PluginLoader] Failed to import module from ${entryPath}:`,
        error,
      )
      throw error
    }
  }

  /**
   * 预处理插件代码，移除 import 语句和进行其他转换
   */
  private preprocessPluginCode(code: string): string {
    let processedCode = code

    // 移除 ES6 import 语句
    // 匹配所有 import 语句的正则表达式
    const importRegex = /^import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['""][^'"]*['""]\s*;?$/gm
    
    // 记录被移除的 import 语句
    const removedImports = processedCode.match(importRegex) || []
    if (removedImports.length > 0) {
      console.log('[PluginLoader] Removing import statements:', removedImports)
    }

    // 移除 import 语句
    processedCode = processedCode.replace(importRegex, '// import statement removed for eval')

    // 处理 export 语句
    // 移除简单的 export 关键字
    processedCode = processedCode.replace(/^export\s+(?=(?:const|let|var|function|class)\s)/gm, '')
    
    // 处理复杂的 export { ... } 语句，包含 as 重命名的情况
    // 使用多行匹配来处理跨行的 export 语句
    processedCode = processedCode.replace(
      /export\s*\{[^}]*\}\s*;?/gs, 
      '// export statement removed for eval',
    )
    
    // 处理 export default 语句，转换为普通的变量赋值，使用合法的变量名
    processedCode = processedCode.replace(/^export\s+default\s+/gm, 'var pluginDefault = ')

    // 处理内联的 TypeScript 类型断言 (value as Type)
    // 简单地移除 as Type 部分，保留值
    processedCode = processedCode.replace(/\s+as\s+\w+(\[\])?/g, '')

    return processedCode
  }

  /**
   * 为插件代码添加后置处理逻辑，将插件实例暴露到全局变量
   */
  private addPluginPostamble(pluginId: string): string {
    return `
// === Plugin Instance Export ===
// 插件应该在这里将自己的实例暴露到全局 __pluginInstances
console.log('[PluginExport] Plugin ${pluginId} code execution completed');
`
  }

  /**
   * 创建eval环境的前置代码，提供必要的polyfill和模拟实现
   */
  private createEvalPreamble(): string {
    return `
// === Eval Environment Preamble ===
// 提供在eval环境中需要的polyfill和模拟实现

// 1. 确保全局插件实例容器存在（应该由外部 Tauri 应用定义）
if (typeof window.__pluginInstances === 'undefined') {
  console.warn('[PluginLoader] __pluginInstances not found, creating fallback');
  window.__pluginInstances = {};
}

// 2. 模拟 __defProp, __defNormalProp, __publicField 等编译器生成的辅助函数
if (typeof __defProp === 'undefined') {
  var __defProp = Object.defineProperty;
}
if (typeof __defNormalProp === 'undefined') {
  var __defNormalProp = function(obj, key, value) {
    return key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value }) : obj[key] = value;
  };
}
if (typeof __publicField === 'undefined') {
  var __publicField = function(obj, key, value) {
    return __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  };
}

// 2. 模拟常用的Node.js/TypeScript编译器生成的工具函数
if (typeof __spreadArray === 'undefined') {
  var __spreadArray = function(to, from, pack) {
    if (pack === void 0) { pack = false; }
    for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar) ar = Array.prototype.slice.call(to, 0, i);
        ar[i] = from[i];
      }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
}
if (typeof __rest === 'undefined') {
  var __rest = function(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  };
}

// 3. 模拟一些常用的全局变量和函数
if (typeof global === 'undefined') {
  var global = window;
}
if (typeof process === 'undefined') {
  var process = {
    env: {},
    argv: [],
    version: 'v20.0.0',
    platform: 'browser'
  };
}

// 4. 简单的 console polyfill（如果需要）
if (typeof console === 'undefined') {
  var console = {
    log: function() { /* noop */ },
    error: function() { /* noop */ },
    warn: function() { /* noop */ },
    info: function() { /* noop */ }
  };
}

// === End of Preamble ===
`
  }

  /**
   * 使用 Tauri 文件系统 API 加载插件
   */
  private async loadPluginWithTauriFS(entryPath: string, pluginId?: string): Promise<any> {
    try {
      // 动态导入 Tauri 的 FS API
      const { readTextFile } = await import('@tauri-apps/plugin-fs')
      
      console.log(`[PluginLoader] Reading plugin file: ${entryPath}`)
      
      // 读取插件文件内容
      const pluginCode = await readTextFile(entryPath)
      
      console.log(`[PluginLoader] Plugin file read successfully, length: ${pluginCode.length}`)
      
      // 执行插件代码并返回模块
      return await this.executePluginCode(pluginCode, entryPath, pluginId)
    } catch (error) {
      console.error('[PluginLoader] Error loading plugin with Tauri FS:', error)
      throw error
    }
  }

  /**
   * 执行插件代码并返回模块对象
   */
  private async executePluginCode(code: string, pluginPath: string, pluginId?: string): Promise<any> {
    try {
      console.log(`[PluginLoader] Executing plugin code from: ${pluginPath}`)
      
      // 预处理代码：移除或转换 import 语句
      const processedCode = this.preprocessPluginCode(code)
      
      // 创建一个沙箱环境来执行插件代码
      const sandbox = this.createPluginSandbox(pluginPath)
      
      // 准备执行环境
      const moduleExports = {}
      const moduleObj = { exports: moduleExports }
      
      // 将必要的变量注入到全局作用域
      const originalModule = (window as any).module
      const originalExports = (window as any).exports
      const originalRequire = (window as any).require
      
      try {
        // 设置模块环境
        (window as any).module = moduleObj
        ;(window as any).exports = moduleExports
        ;(window as any).require = this.createRequireFunction()
        
        // 添加插件 SDK 到全局环境
        await this.injectPluginSDK()
        
        // 创建完整的执行代码：前置代码 + 预处理后的插件代码 + 后置代码
        const preamble = this.createEvalPreamble()
        const postamble = pluginId ? this.addPluginPostamble(pluginId) : ''
        const fullCode = `${preamble}\n${processedCode}\n${postamble}`
        
        // 执行插件代码
        eval(fullCode)
        
        // 检查导出
        let result = moduleObj.exports
        
        // 如果是空对象，尝试从全局变量中查找
        if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
          result = this.extractExportsFromGlobal(pluginPath)
        }
        
        // console.log('[PluginLoader] Plugin execution completed. Exports:', Object.keys(result))
        
        return result
      } finally {
        // 恢复全局环境
        if (originalModule !== undefined) {
          (window as any).module = originalModule
        } else {
          delete (window as any).module
        }
        
        if (originalExports !== undefined) {
          (window as any).exports = originalExports
        } else {
          delete (window as any).exports
        }
        
        if (originalRequire !== undefined) {
          (window as any).require = originalRequire
        } else {
          delete (window as any).require
        }
      }
    } catch (error) {
      console.error('[PluginLoader] Error executing plugin code:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to execute plugin: ${errorMessage}`)
    }
  }

  /**
   * 创建插件沙箱环境
   */
  private createPluginSandbox(pluginPath: string) {
    return {
      console,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Promise,
      URL,
      fetch: typeof fetch !== 'undefined' ? fetch : undefined,
      __pluginPath: pluginPath,
    }
  }

  /**
   * 创建 require 函数的简单实现
   */
  private createRequireFunction() {
    return (moduleName: string) => {
      // console.log(`[PluginLoader] Plugin requested module: ${moduleName}`)
      
      // 这里可以实现模块的映射
      switch (moduleName) {
        case 'path':
          // 提供简单的 path 模块实现
          return {
            join: (...parts: string[]) => parts.join('/'),
            dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
            basename: (path: string) => path.split('/').pop(),
            extname: (path: string) => {
              const parts = path.split('.')
              return parts.length > 1 ? `.${parts.pop()}` : ''
            },
          }
        case 'fs':
          // 不允许直接访问文件系统
          throw new Error('Direct filesystem access is not allowed in plugins')
        default:
          console.warn(`[PluginLoader] Unknown module requested: ${moduleName}`)
          return {}
      }
    }
  }

  /**
   * 注入插件 SDK 到全局环境
   */
  private async injectPluginSDK() {
    try {
      // 导入 BasePlugin 类
      const { BasePlugin } = await import('@/plugins/core/BasePlugin')
      
      // 将 BasePlugin 添加到全局环境
      ;(window as any).BasePlugin = BasePlugin
      
      // console.log('[PluginLoader] Plugin SDK injected successfully')
    } catch (error) {
      console.error('[PluginLoader] Failed to inject Plugin SDK:', error)
    }
  }

  /**
   * 从全局变量中提取导出
   */
  private extractExportsFromGlobal(_pluginPath: string): any {
    // 查找可能的插件类
    const globalKeys = Object.keys(window).filter(key => 
      key.includes('Plugin') || 
      key.includes('plugin') ||
      key.startsWith('_') ||
      key === 'default' ||
      key === 'pluginDefault',
    )
    
    // 优先查找 pluginDefault 导出 (新转换的 export default)
    if ((window as any).pluginDefault) {
      console.log('[PluginLoader] Found pluginDefault export')
      return { default: (window as any).pluginDefault }
    }
    
    // 备用查找 default 导出 (旧的)
    if ((window as any).default) {
      console.log('[PluginLoader] Found default export')
      return { default: (window as any).default }
    }
    
    for (const key of globalKeys) {
      const value = (window as any)[key]
      if (typeof value === 'function' || (typeof value === 'object' && value !== null)) {
        console.log(`[PluginLoader] Found potential export: ${key}`)
        return { default: value, [key]: value }
      }
    }
    
    return {}
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
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

    if (isDev) {
      // 将绝对路径转换为相对于项目根目录的路径
      let importPath = entryPath
      
      // Convert absolute Windows paths to relative paths for Vite
      if (entryPath.includes('\\') && entryPath.includes(':')) {
        // This is a Windows absolute path, convert to relative
        const workspaceRoot = 'd:\\mira_launcher'
        if (entryPath.startsWith(workspaceRoot)) {
          importPath = `./${entryPath.slice(workspaceRoot.length + 1).replace(/\\/g, '/')}`
        }
      }

      try {
        // For JavaScript files, ensure we're using the correct extension
        if (ext === '.js' && !importPath.endsWith('.js')) {
          importPath += '.js'
        }

        console.log(`[PluginLoader] Attempting to import: ${importPath}`)
        
        // In Tauri environment, convert local file paths to HTTP URLs
        if (isTauri && importPath.startsWith('./plugins/')) {
          // Remove the ./ prefix and use the dev server URL
          const httpPath = importPath.slice(2) // Remove './'
          const httpUrl = `http://localhost:1420/${httpPath}`
          console.log(`[PluginLoader] Using HTTP URL for Tauri: ${httpUrl}`)
          return await import(/* @vite-ignore */ httpUrl)
        }

        // 直接使用相对路径导入
        return await import(/* @vite-ignore */ importPath)
      } catch (importError) {
        console.warn(
          `[PluginLoader] Relative import failed for ${importPath}:`,
          importError,
        )

        // 如果相对路径导入失败，尝试使用原始路径
        try {
          return await import(/* @vite-ignore */ entryPath)
        } catch (originalError) {
          console.error('[PluginLoader] Both import methods failed:', {
            relativePath: importPath,
            relativeError: importError,
            originalPath: entryPath,
            originalError,
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
      console.warn(
        `[PluginLoader] Loading TypeScript files directly is not recommended: ${entryPath}`,
      )
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
  private extractPluginClass(
    module: any,
    metadata: PluginMetadata,
  ): (new () => BasePlugin) | undefined {
    console.log(
      `[PluginLoader] Extracting plugin class for ${metadata.id}. Module:`,
      Object.keys(module),
    )

    // 尝试多种导出方式
    const candidates = [
      module.default,
      module.Plugin,
      module[metadata.name],
      module[`${metadata.name}Plugin`],
      module[metadata.id],
      module[metadata.id.replace(/-/g, '')], // 移除连字符
      ...Object.values(module).filter(value => typeof value === 'function'),
    ]

    // 移除重复项和undefined
    const uniqueCandidates = [...new Set(candidates)].filter(c => c)

    console.log(
      `[PluginLoader] Found ${uniqueCandidates.length} plugin class candidates`,
    )

    for (const candidate of uniqueCandidates) {
      console.log(
        '[PluginLoader] Testing candidate:',
        candidate.name || 'unnamed',
      )
      if (this.isValidPluginClass(candidate)) {
        console.log(
          `[PluginLoader] Valid plugin class found: ${candidate.name}`,
        )
        return candidate as new () => BasePlugin
      }
    }

    console.log(
      `[PluginLoader] No valid plugin class found in module for ${metadata.id}`,
    )
    return undefined
  }

  /**
   * 验证是否为有效的插件类
   */
  private isValidPluginClass(candidate: any): boolean {
    if (typeof candidate !== 'function') {
      console.log(
        '[PluginLoader] Candidate is not a function:',
        typeof candidate,
      )
      return false
    }

    try {
      // 检查是否继承自 BasePlugin
      let extendsBasePlugin = false
      try {
        extendsBasePlugin = candidate.prototype instanceof BasePlugin
      } catch (e) {
        // BasePlugin may not be available in the plugin's context
        console.log(
          `[PluginLoader] BasePlugin check failed for ${candidate.name}, continuing with duck typing`,
        )
      }

      // 如果继承自 BasePlugin，直接认为有效
      if (extendsBasePlugin) {
        console.log(
          `[PluginLoader] Plugin ${candidate.name} extends BasePlugin`,
        )
        return true
      }

      // 如果不继承 BasePlugin，使用鸭子类型检测 (duck typing)
      console.log(
        `[PluginLoader] Using duck typing for plugin ${candidate.name}`,
      )

      // 检查原型上的方法
      const hasPrototypeMethods =
        typeof candidate.prototype.getMetadata === 'function' ||
        typeof candidate.prototype.onLoad === 'function' ||
        typeof candidate.prototype.onActivate === 'function'

      if (hasPrototypeMethods) {
        console.log(
          `[PluginLoader] Plugin ${candidate.name} has required prototype methods`,
        )
        return true
      }

      // 尝试创建实例来检查实例属性和方法（仅在开发环境）
      const isDev = import.meta.env.DEV
      if (isDev) {
        try {
          console.log(
            `[PluginLoader] Attempting to create test instance of ${candidate.name}`,
          )
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
          console.log(
            `[PluginLoader] Test instance validation for ${candidate.name}: properties=${hasRequiredProperties}, methods=${hasRequiredMethods}, valid=${isValid}`,
          )

          return isValid
        } catch (instanceError) {
          console.warn(
            `[PluginLoader] Could not create test instance of ${candidate.name}:`,
            instanceError,
          )
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
  private validatePermissions(metadata: PluginMetadata): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    const requestedPermissions = metadata.permissions || []

    for (const permission of requestedPermissions) {
      if (!this.config.allowedPermissions.includes(permission)) {
        errors.push(`Permission not allowed: ${permission}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * 批量加载插件
   */
  async loadPlugins(
    discoveryResults: PluginDiscoveryResult[],
  ): Promise<PluginLoadResult[]> {
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
        console.error(
          `[PluginLoader] Failed to load plugin ${metadata.id}:`,
          result.reason,
        )

        return {
          pluginId: metadata.id,
          metadata,
          success: false,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : 'Unknown error',
          loadTime: 0,
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
      avgLoadTime:
        modules.length > 0
          ? modules.reduce(
            (sum, cache) => sum + (Date.now() - cache.loadTime),
            0,
          ) / modules.length
          : 0,
      cacheEnabled: this.config.enableCache,
      loadTimeout: this.config.loadTimeout,
      loadedPlugins: modules.map(cache => ({
        id: cache.metadata.id,
        name: cache.metadata.name,
        version: cache.metadata.version,
        loadTime: cache.loadTime,
      })),
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
  async reloadPlugin(
    discoveryResult: PluginDiscoveryResult,
  ): Promise<PluginLoadResult> {
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
export function createPluginLoader(
  config?: Partial<PluginLoaderConfig>,
): PluginLoader {
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
      Object.values(module).some(
        value =>
          typeof value === 'function' && value.prototype instanceof BasePlugin,
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
      functions: Object.keys(module).filter(
        key => typeof module[key] === 'function',
      ),
      classes: Object.keys(module).filter(
        key =>
          typeof module[key] === 'function' &&
          module[key].prototype &&
          module[key].prototype.constructor === module[key],
      ),
    }
  },

  /**
   * 安全地执行模块代码
   */
  safeExecuteModule(moduleFactory: () => any): {
    success: boolean
    result?: any
    error?: Error
  } {
    try {
      const result = moduleFactory()
      return { success: true, result }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error : new Error('Unknown execution error'),
      }
    }
  },
}
