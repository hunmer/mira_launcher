/**
 * Tauri 专用插件加载器
 * 用于在 Tauri 环境中安全地加载插件
 */

import { readTextFile } from '@tauri-apps/plugin-fs'
import { BasePlugin } from '@/plugins/core/BasePlugin'
import type { PluginMetadata } from '@/types/plugin'
import type { PluginDiscoveryResult } from './Discovery'

export interface TauriPluginLoadResult {
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
 * Tauri 环境下的插件加载器
 */
export class TauriPluginLoader {
  /**
   * 在 Tauri 环境中加载插件
   */
  async loadPlugin(
    discoveryResult: PluginDiscoveryResult,
  ): Promise<TauriPluginLoadResult> {
    const { metadata, entryPath } = discoveryResult
    const startTime = performance.now()

    try {
      console.log(`[TauriPluginLoader] Loading plugin from: ${entryPath}`)

      // 读取插件文件内容
      const pluginCode = await readTextFile(entryPath)
      
      // 创建一个安全的执行环境
      const module = await this.executePluginCode(pluginCode, metadata.id)
      
      // 提取插件类
      const pluginClass = this.extractPluginClass(module, metadata)
      
      const loadTime = performance.now() - startTime
      
      console.log(
        `[TauriPluginLoader] Successfully loaded plugin: ${metadata.id} (${loadTime.toFixed(2)}ms)`,
      )

      const result: TauriPluginLoadResult = {
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
        `[TauriPluginLoader] Failed to load plugin ${metadata.id}:`,
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
   * 安全执行插件代码
   */
  private async executePluginCode(code: string, pluginId: string): Promise<any> {
    try {
      // 创建一个沙箱环境来执行插件代码
      // 注意：这是一个简化的沙箱，实际使用中可能需要更严格的安全措施
      
      // 将插件代码转换为模块
      const moduleCode = this.transformCodeToModule(code)
      
      // 创建一个 blob URL 来执行代码
      const blob = new Blob([moduleCode], { type: 'application/javascript' })
      const url = URL.createObjectURL(blob)
      
      try {
        const module = await import(/* @vite-ignore */ url)
        URL.revokeObjectURL(url) // 清理 URL
        return module
      } catch (importError) {
        URL.revokeObjectURL(url)
        throw importError
      }
    } catch (error) {
      console.error(`[TauriPluginLoader] Failed to execute plugin code for ${pluginId}:`, error)
      throw error
    }
  }

  /**
   * 将插件代码转换为 ES 模块格式
   */
  private transformCodeToModule(code: string): string {
    // 如果代码已经是 ES 模块格式，直接返回
    if (code.includes('export') || code.includes('import')) {
      return code
    }

    // 否则，包装成模块格式
    return `
      ${code}
      
      // 自动导出检测
      if (typeof module !== 'undefined' && module.exports) {
        // CommonJS 格式
        export default module.exports;
        if (typeof module.exports === 'object') {
          // 导出所有属性
          for (const key in module.exports) {
            if (key !== 'default') {
              window['__plugin_export_' + key] = module.exports[key];
            }
          }
        }
      } else {
        // 尝试检测全局变量作为导出
        const globalKeys = Object.keys(window).filter(key => 
          key.includes('Plugin') || key.includes('plugin')
        );
        if (globalKeys.length > 0) {
          export default window[globalKeys[0]];
        }
      }
    `
  }

  /**
   * 从模块中提取插件类
   */
  private extractPluginClass(
    module: any,
    metadata: PluginMetadata,
  ): (new () => BasePlugin) | undefined {
    console.log(
      `[TauriPluginLoader] Extracting plugin class for ${metadata.id}. Module:`,
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
      `[TauriPluginLoader] Found ${uniqueCandidates.length} plugin class candidates`,
    )

    for (const candidate of uniqueCandidates) {
      if (this.isValidPluginClass(candidate)) {
        console.log(
          `[TauriPluginLoader] Valid plugin class found: ${candidate.name}`,
        )
        return candidate as new () => BasePlugin
      }
    }

    console.log(
      `[TauriPluginLoader] No valid plugin class found in module for ${metadata.id}`,
    )
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
      let extendsBasePlugin = false
      try {
        extendsBasePlugin = candidate.prototype instanceof BasePlugin
      } catch (e) {
        // BasePlugin may not be available in the plugin's context
        console.log(
          `[TauriPluginLoader] BasePlugin check failed for ${candidate.name}, continuing with duck typing`,
        )
      }

      // 如果继承自 BasePlugin，直接认为有效
      if (extendsBasePlugin) {
        return true
      }

      // 使用鸭子类型检测
      const hasPrototypeMethods =
        typeof candidate.prototype.getMetadata === 'function' ||
        typeof candidate.prototype.onLoad === 'function' ||
        typeof candidate.prototype.onActivate === 'function'

      if (hasPrototypeMethods) {
        return true
      }

      // 尝试创建测试实例（仅在开发环境）
      const isDev = import.meta.env.DEV
      if (isDev) {
        try {
          const testInstance = new candidate()
          
          const hasRequiredProperties =
            typeof testInstance.id === 'string' &&
            typeof testInstance.name === 'string' &&
            typeof testInstance.version === 'string'

          const hasRequiredMethods =
            typeof testInstance.getMetadata === 'function' ||
            typeof testInstance.onLoad === 'function' ||
            typeof testInstance.onActivate === 'function'

          return hasRequiredProperties || hasRequiredMethods
        } catch (instanceError) {
          console.warn(
            `[TauriPluginLoader] Could not create test instance of ${candidate.name}:`,
            instanceError,
          )
          return false
        }
      }

      return typeof candidate === 'function' && candidate.name
    } catch (error) {
      console.warn('[TauriPluginLoader] Error checking plugin class:', error)
      return false
    }
  }
}

/**
 * 创建 Tauri 插件加载器实例
 */
export function createTauriPluginLoader(): TauriPluginLoader {
  return new TauriPluginLoader()
}
