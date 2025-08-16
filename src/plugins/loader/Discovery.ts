import type { PluginMetadata } from '@/types/plugin'
import { appConfigDir, join, resourceDir } from '@tauri-apps/api/path'
import { exists, readDir, readTextFile } from '@tauri-apps/plugin-fs'

/**
 * 插件发现结果
 */
export interface PluginDiscoveryResult {
  /** 插件元数据 */
  metadata: PluginMetadata
  /** 插件目录路径 */
  pluginPath: string
  /** 插件主文件路径 */
  entryPath: string
  /** 是否有效 */
  isValid: boolean
  /** 错误信息 */
  errors: string[]
}

/**
 * 插件发现配置
 */
export interface PluginDiscoveryConfig {
  /** 插件目录路径列表 */
  pluginDirectories: string[]
  /** 是否递归搜索 */
  recursive: boolean
  /** 支持的插件文件扩展名 */
  supportedExtensions: string[]
  /** 最大搜索深度 */
  maxDepth: number
  /** 是否验证插件 */
  validate: boolean
}

/**
 * 插件发现服务
 * 负责扫描文件系统，发现和解析插件
 */
export class PluginDiscovery {
  private config: PluginDiscoveryConfig
  private discoveredPlugins: Map<string, PluginDiscoveryResult> = new Map()

  constructor(config?: Partial<PluginDiscoveryConfig>) {
    this.config = {
      pluginDirectories: ['plugins', 'extensions'],
      recursive: true,
      supportedExtensions: ['.js', '.ts', '.vue'],
      maxDepth: 3,
      validate: true,
      ...config,
    }
  }

  /**
   * 发现所有插件
   */
  async discoverPlugins(): Promise<PluginDiscoveryResult[]> {
    const results: PluginDiscoveryResult[] = []

    try {
      for (const pluginDir of this.config.pluginDirectories) {
        // 尝试多个可能的路径
        const possiblePaths = await this.getPluginDirectoryPaths(pluginDir)

        for (const fullPath of possiblePaths) {
          // 检查目录是否存在
          if (await exists(fullPath)) {
            console.log(`[PluginDiscovery] Scanning plugin directory: ${fullPath}`)
            const dirResults = await this.scanDirectory(fullPath)
            results.push(...dirResults)
            break // 找到第一个存在的路径就退出
          }
        }
      }

      // 缓存结果
      this.discoveredPlugins.clear()
      for (const result of results) {
        this.discoveredPlugins.set(result.metadata.id, result)
      }

      console.log(`[PluginDiscovery] Discovered ${results.length} plugins`)
      return results
    } catch (error) {
      console.error('[PluginDiscovery] Failed to discover plugins:', error)
      return []
    }
  }

  /**
   * 获取插件目录的可能路径列表
   */
  private async getPluginDirectoryPaths(pluginDir: string): Promise<string[]> {
    const paths: string[] = []

    try {
      // 1. 如果是绝对路径，直接使用
      if (this.isAbsolutePath(pluginDir)) {
        paths.push(pluginDir)
        // 如果是绝对路径，也尝试在其下查找 plugins 子目录
        paths.push(await join(pluginDir, 'plugins'))
        return paths
      }

      // 2. 开发环境：项目根目录下的插件目录
      // 尝试使用相对路径（相对于当前工作目录）
      paths.push(pluginDir)

      // 3. 尝试资源目录
      try {
        const resDir = await resourceDir()
        paths.push(await join(resDir, pluginDir))
      } catch (e) {
        console.debug('[PluginDiscovery] Resource dir not available in dev mode')
      }

      // 4. 生产环境：应用配置目录
      try {
        const configDir = await appConfigDir()
        paths.push(await join(configDir, pluginDir))
      } catch (e) {
        console.debug('[PluginDiscovery] App config dir not available')
      }

      console.log(`[PluginDiscovery] Possible paths for ${pluginDir}:`, paths)
      return paths
    } catch (error) {
      console.error(`[PluginDiscovery] Failed to get paths for ${pluginDir}:`, error)
      return [pluginDir] // 降级到相对路径
    }
  }

  /**
   * 检查是否为绝对路径
   */
  private isAbsolutePath(path: string): boolean {
    // Windows: C:\ or D:\ etc.
    // Unix: /
    return /^[A-Za-z]:\\/.test(path) || path.startsWith('/')
  }

  /**
   * 扫描指定目录
   */
  private async scanDirectory(dirPath: string, depth = 0): Promise<PluginDiscoveryResult[]> {
    const results: PluginDiscoveryResult[] = []

    if (depth > this.config.maxDepth) {
      return results
    }

    try {
      const entries = await readDir(dirPath)

      for (const entry of entries) {
        if (entry.isDirectory && this.config.recursive) {
          // 递归扫描子目录
          const entryPath = `${dirPath}/${entry.name}`
          const subResults = await this.scanDirectory(entryPath, depth + 1)
          results.push(...subResults)
        } else if (entry.name === 'plugin.json') {
          // 发现插件描述文件
          const pluginResult = await this.parsePluginDirectory(dirPath)
          if (pluginResult) {
            results.push(pluginResult)
          }
        }
      }
    } catch (error) {
      console.error(`[PluginDiscovery] Failed to scan directory ${dirPath}:`, error)
    }

    return results
  }

  /**
   * 解析插件目录
   */
  private async parsePluginDirectory(pluginPath: string): Promise<PluginDiscoveryResult | null> {
    try {
      // 读取 plugin.json
      const manifestPath = await join(pluginPath, 'plugin.json')
      const manifestContent = await readTextFile(manifestPath)
      const manifest = JSON.parse(manifestContent)

      // 验证基本字段
      const errors: string[] = []
      if (!manifest.id) errors.push('Missing plugin id')
      if (!manifest.name) errors.push('Missing plugin name')
      if (!manifest.version) errors.push('Missing plugin version')
      if (!manifest.entry) errors.push('Missing plugin entry file')

      // 构建插件元数据
      const metadata: PluginMetadata = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        dependencies: manifest.dependencies || [],
        permissions: manifest.permissions || [],
        minAppVersion: manifest.minAppVersion,
      }

      // 确定入口文件路径
      const entryPath = await join(pluginPath, manifest.entry)

      // 检查入口文件是否存在
      if (!(await exists(entryPath))) {
        errors.push(`Entry file not found: ${manifest.entry}`)
      }

      // 验证入口文件扩展名
      const entryExt = manifest.entry.substring(manifest.entry.lastIndexOf('.'))
      if (!this.config.supportedExtensions.includes(entryExt)) {
        errors.push(`Unsupported entry file extension: ${entryExt}`)
      }

      const result: PluginDiscoveryResult = {
        metadata,
        pluginPath,
        entryPath,
        isValid: errors.length === 0,
        errors,
      }

      if (this.config.validate && !result.isValid) {
        console.warn(`[PluginDiscovery] Invalid plugin ${metadata.id}:`, errors)
      }

      return result
    } catch (error) {
      console.error(`[PluginDiscovery] Failed to parse plugin directory ${pluginPath}:`, error)
      return null
    }
  }

  /**
   * 根据ID获取插件发现结果
   */
  getPluginById(pluginId: string): PluginDiscoveryResult | undefined {
    return this.discoveredPlugins.get(pluginId)
  }

  /**
   * 获取所有发现的插件
   */
  getAllDiscoveredPlugins(): PluginDiscoveryResult[] {
    return Array.from(this.discoveredPlugins.values())
  }

  /**
   * 获取有效插件
   */
  getValidPlugins(): PluginDiscoveryResult[] {
    return this.getAllDiscoveredPlugins().filter(plugin => plugin.isValid)
  }

  /**
   * 获取无效插件
   */
  getInvalidPlugins(): PluginDiscoveryResult[] {
    return this.getAllDiscoveredPlugins().filter(plugin => !plugin.isValid)
  }

  /**
   * 按依赖关系排序插件
   */
  sortPluginsByDependencies(plugins?: PluginDiscoveryResult[]): PluginDiscoveryResult[] {
    const pluginsToSort = plugins || this.getValidPlugins()
    const sorted: PluginDiscoveryResult[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (plugin: PluginDiscoveryResult) => {
      if (visiting.has(plugin.metadata.id)) {
        console.warn(`[PluginDiscovery] Circular dependency detected for plugin: ${plugin.metadata.id}`)
        return
      }

      if (visited.has(plugin.metadata.id)) {
        return
      }

      visiting.add(plugin.metadata.id)

      // 先处理依赖
      for (const depId of plugin.metadata.dependencies || []) {
        const depPlugin = pluginsToSort.find(p => p.metadata.id === depId)
        if (depPlugin) {
          visit(depPlugin)
        }
      }

      visiting.delete(plugin.metadata.id)
      visited.add(plugin.metadata.id)
      sorted.push(plugin)
    }

    for (const plugin of pluginsToSort) {
      visit(plugin)
    }

    return sorted
  }

  /**
   * 检查插件依赖关系
   */
  checkDependencies(plugin: PluginDiscoveryResult): {
    satisfied: boolean
    missing: string[]
    circular: string[]
  } {
    const missing: string[] = []
    const circular: string[] = []

    // 检查缺失的依赖
    for (const depId of plugin.metadata.dependencies || []) {
      if (!this.discoveredPlugins.has(depId)) {
        missing.push(depId)
      }
    }

    // 检查循环依赖
    const checkCircular = (pluginId: string, visited: Set<string>) => {
      if (visited.has(pluginId)) {
        circular.push(pluginId)
        return
      }

      const currentPlugin = this.discoveredPlugins.get(pluginId)
      if (!currentPlugin) return

      visited.add(pluginId)
      for (const depId of currentPlugin.metadata.dependencies || []) {
        checkCircular(depId, new Set(visited))
      }
    }

    checkCircular(plugin.metadata.id, new Set())

    return {
      satisfied: missing.length === 0 && circular.length === 0,
      missing,
      circular,
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.discoveredPlugins.clear()
  }

  /**
   * 获取发现统计信息
   */
  getDiscoveryStats() {
    const all = this.getAllDiscoveredPlugins()
    const valid = this.getValidPlugins()
    const invalid = this.getInvalidPlugins()

    return {
      total: all.length,
      valid: valid.length,
      invalid: invalid.length,
      directories: this.config.pluginDirectories,
      errors: invalid.flatMap(p => p.errors),
    }
  }
}

/**
 * 创建默认插件发现实例
 */
export function createPluginDiscovery(config?: Partial<PluginDiscoveryConfig>): PluginDiscovery {
  return new PluginDiscovery(config)
}

/**
 * 全局插件发现实例
 */
export const globalPluginDiscovery = new PluginDiscovery()

/**
 * 插件发现工具函数
 */
export const discoveryUtils = {
  /**
   * 验证插件清单格式
   */
  validateManifest(manifest: any): string[] {
    const errors: string[] = []

    // 必需字段
    const requiredFields = ['id', 'name', 'version', 'entry']
    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    }

    // 版本格式验证
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push('Invalid version format (expected x.y.z)')
    }

    // ID 格式验证
    if (manifest.id && !/^[a-z0-9-_]+$/.test(manifest.id)) {
      errors.push('Invalid plugin ID format (only lowercase letters, numbers, hyphens, and underscores allowed)')
    }

    return errors
  },

  /**
   * 比较版本号
   */
  compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    const maxLength = Math.max(v1Parts.length, v2Parts.length)

    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0

      if (v1Part < v2Part) return -1
      if (v1Part > v2Part) return 1
    }

    return 0
  },

  /**
   * 检查版本兼容性
   */
  isVersionCompatible(required: string, available: string): boolean {
    return this.compareVersions(available, required) >= 0
  },
}
