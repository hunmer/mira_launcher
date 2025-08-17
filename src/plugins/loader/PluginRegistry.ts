import type { PluginMetadata, PluginState } from '@/types/plugin'
import type { BasePlugin } from '@/plugins/core/BasePlugin'
import type { PluginValidationResult } from './Validation'
import type { PluginLoadResult } from './PluginLoader'

/**
 * 注册的插件信息
 */
export interface RegisteredPlugin {
  /** 插件唯一标识 */
  id: string
  /** 插件元数据 */
  metadata: PluginMetadata
  /** 插件实例 */
  instance: BasePlugin | null
  /** 插件类构造函数 */
  pluginClass: new (...args: any[]) => BasePlugin
  /** 当前状态 */
  state: PluginState
  /** 注册时间 */
  registeredAt: Date
  /** 最后激活时间 */
  lastActivatedAt: Date | null
  /** 最后停用时间 */
  lastDeactivatedAt: Date | null
  /** 验证结果 */
  validationResult: PluginValidationResult | null
  /** 错误信息 */
  error: string | null
  /** 依赖的插件ID列表 */
  dependencies: string[]
  /** 依赖此插件的插件ID列表 */
  dependents: string[]
  /** 加载统计 */
  stats: PluginStats
}

/**
 * 插件统计信息
 */
export interface PluginStats {
  /** 激活次数 */
  activationCount: number
  /** 总运行时间（毫秒） */
  totalRuntime: number
  /** 平均加载时间（毫秒） */
  avgLoadTime: number
  /** 错误次数 */
  errorCount: number
  /** 最后错误时间 */
  lastErrorAt: Date | null
  /** 最后错误信息 */
  lastError: string | null
}

/**
 * 注册表事件
 */
export interface RegistryEvents {
  /** 插件注册 */
  'plugin:registered': { plugin: RegisteredPlugin }
  /** 插件注销 */
  'plugin:unregistered': { pluginId: string }
  /** 插件状态变更 */
  'plugin:state-changed': {
    pluginId: string
    oldState: PluginState
    newState: PluginState
  }
  /** 插件错误 */
  'plugin:error': { pluginId: string; error: string }
  /** 依赖关系变更 */
  'dependency:changed': {
    pluginId: string
    dependencies: string[]
    dependents: string[]
  }
}

/**
 * 注册表配置
 */
export interface RegistryConfig {
  /** 最大插件数量 */
  maxPlugins: number
  /** 启用依赖检查 */
  enableDependencyCheck: boolean
  /** 启用状态持久化 */
  enableStatePersistence: boolean
  /** 状态持久化键 */
  persistenceKey: string
  /** 自动清理间隔（毫秒） */
  cleanupInterval: number
  /** 启用统计收集 */
  enableStats: boolean
}

/**
 * 插件注册表
 * 负责管理所有已注册插件的状态和生命周期
 */
export class PluginRegistry {
  private plugins: Map<string, RegisteredPlugin> = new Map()
  private dependencyGraph: Map<string, Set<string>> = new Map()
  private reverseDependencyGraph: Map<string, Set<string>> = new Map()
  private eventListeners: Map<keyof RegistryEvents, Function[]> = new Map()
  private config: RegistryConfig
  private cleanupTimer: number | null = null

  constructor(config?: Partial<RegistryConfig>) {
    this.config = {
      maxPlugins: 100,
      enableDependencyCheck: true,
      enableStatePersistence: true,
      persistenceKey: 'mira-plugin-registry',
      cleanupInterval: 5 * 60 * 1000, // 5分钟
      enableStats: true,
      ...config,
    }

    this.initializeEventSystem()
    this.startCleanupTimer()

    // 尝试从持久化存储恢复状态
    if (this.config.enableStatePersistence) {
      this.loadPersistedState()
    }
  }

  /**
   * 初始化事件系统
   */
  private initializeEventSystem(): void {
    const eventTypes: (keyof RegistryEvents)[] = [
      'plugin:registered',
      'plugin:unregistered',
      'plugin:state-changed',
      'plugin:error',
      'dependency:changed',
    ]

    for (const eventType of eventTypes) {
      this.eventListeners.set(eventType, [])
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = window.setInterval(() => {
      this.cleanupRegistry()
    }, this.config.cleanupInterval)
  }

  /**
   * 注册插件
   */
  async register(
    loadResult: PluginLoadResult,
    validationResult: PluginValidationResult,
  ): Promise<void> {
    const { pluginId, metadata, pluginClass } = loadResult

    // 检查插件类是否有效
    if (!pluginClass) {
      throw new Error(
        `Cannot register plugin ${pluginId}: Plugin class is not available`,
      )
    }

    // 检查插件数量限制
    if (this.plugins.size >= this.config.maxPlugins) {
      throw new Error(
        `Cannot register plugin ${pluginId}: Maximum plugin limit (${this.config.maxPlugins}) reached`,
      )
    }

    // 检查插件是否已注册
    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is already registered`)
    }

    // 验证依赖关系
    if (this.config.enableDependencyCheck) {
      const dependencyErrors = await this.validateDependencies(
        metadata.dependencies || [],
      )
      if (dependencyErrors.length > 0) {
        throw new Error(
          `Dependency validation failed: ${dependencyErrors.join(', ')}`,
        )
      }
    }

    const now = new Date()
    const registeredPlugin: RegisteredPlugin = {
      id: pluginId,
      metadata,
      instance: null,
      pluginClass,
      state: 'registered',
      registeredAt: now,
      lastActivatedAt: null,
      lastDeactivatedAt: null,
      validationResult,
      error: null,
      dependencies: metadata.dependencies || [],
      dependents: [],
      stats: {
        activationCount: 0,
        totalRuntime: 0,
        avgLoadTime: loadResult.loadTime || 0,
        errorCount: 0,
        lastErrorAt: null,
        lastError: null,
      },
    }

    // 注册插件
    this.plugins.set(pluginId, registeredPlugin)

    // 更新依赖关系图
    this.updateDependencyGraph(pluginId, registeredPlugin.dependencies)

    // 触发注册事件
    this.emit('plugin:registered', { plugin: registeredPlugin })

    // 持久化状态
    if (this.config.enableStatePersistence) {
      this.persistState()
    }

    console.log(`[PluginRegistry] Plugin registered: ${pluginId}`)
  }

  /**
   * 注销插件
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not registered`)
    }

    // 检查是否有其他插件依赖此插件
    if (plugin.dependents.length > 0) {
      throw new Error(
        `Cannot unregister plugin ${pluginId}: It is required by ${plugin.dependents.join(', ')}`,
      )
    }

    // 如果插件已激活，先停用
    if (plugin.state === 'active') {
      await this.deactivatePlugin(pluginId)
    }

    // 从依赖图中移除
    this.removeDependencyNode(pluginId)

    // 从注册表移除
    this.plugins.delete(pluginId)

    // 触发注销事件
    this.emit('plugin:unregistered', { pluginId })

    // 持久化状态
    if (this.config.enableStatePersistence) {
      this.persistState()
    }

    console.log(`[PluginRegistry] Plugin unregistered: ${pluginId}`)
  }

  /**
   * 获取插件信息
   */
  getPlugin(pluginId: string): RegisteredPlugin | null {
    return this.plugins.get(pluginId) || null
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): RegisteredPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 按状态获取插件
   */
  getPluginsByState(state: PluginState): RegisteredPlugin[] {
    return this.getAllPlugins().filter(plugin => plugin.state === state)
  }

  /**
   * 获取插件数量
   */
  getPluginCount(): number {
    return this.plugins.size
  }

  /**
   * 检查插件是否已注册
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  /**
   * 更新插件状态
   */
  updatePluginState(
    pluginId: string,
    newState: PluginState,
    error?: string,
  ): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not registered`)
    }

    const oldState = plugin.state
    plugin.state = newState
    plugin.error = error || null

    // 更新时间戳
    const now = new Date()
    if (newState === 'active') {
      plugin.lastActivatedAt = now
      plugin.stats.activationCount++
    } else if (newState === 'inactive' && oldState === 'active') {
      plugin.lastDeactivatedAt = now

      // 计算运行时间
      if (plugin.lastActivatedAt) {
        const runtime = now.getTime() - plugin.lastActivatedAt.getTime()
        plugin.stats.totalRuntime += runtime
      }
    }

    // 更新错误统计
    if (error) {
      plugin.stats.errorCount++
      plugin.stats.lastErrorAt = now
      plugin.stats.lastError = error
      this.emit('plugin:error', { pluginId, error })
    }

    // 触发状态变更事件
    this.emit('plugin:state-changed', { pluginId, oldState, newState })

    // 持久化状态
    if (this.config.enableStatePersistence) {
      this.persistState()
    }

    console.log(
      `[PluginRegistry] Plugin ${pluginId} state changed: ${oldState} -> ${newState}`,
    )
  }

  /**
   * 设置插件实例
   */
  setPluginInstance(pluginId: string, instance: BasePlugin): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not registered`)
    }

    plugin.instance = instance
    console.log(`[PluginRegistry] Plugin instance set: ${pluginId}`)
  }

  /**
   * 获取插件依赖顺序
   */
  getDependencyOrder(pluginIds: string[]): string[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const result: string[] = []

    const visit = (pluginId: string): void => {
      if (visited.has(pluginId)) {
        return
      }

      if (visiting.has(pluginId)) {
        throw new Error(
          `Circular dependency detected involving plugin: ${pluginId}`,
        )
      }

      visiting.add(pluginId)

      const plugin = this.plugins.get(pluginId)
      if (plugin) {
        // 首先访问所有依赖
        for (const dep of plugin.dependencies) {
          if (pluginIds.includes(dep)) {
            visit(dep)
          }
        }
      }

      visiting.delete(pluginId)
      visited.add(pluginId)
      result.push(pluginId)
    }

    for (const pluginId of pluginIds) {
      visit(pluginId)
    }

    return result
  }

  /**
   * 验证依赖关系
   */
  private async validateDependencies(
    dependencies: string[],
  ): Promise<string[]> {
    const errors: string[] = []

    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        errors.push(`Dependency ${dep} is not registered`)
      }
    }

    return errors
  }

  /**
   * 更新依赖关系图
   */
  private updateDependencyGraph(
    pluginId: string,
    dependencies: string[],
  ): void {
    // 更新正向依赖图
    this.dependencyGraph.set(pluginId, new Set(dependencies))

    // 更新反向依赖图
    for (const dep of dependencies) {
      if (!this.reverseDependencyGraph.has(dep)) {
        this.reverseDependencyGraph.set(dep, new Set())
      }
      this.reverseDependencyGraph.get(dep)!.add(pluginId)

      // 更新被依赖插件的 dependents 列表
      const depPlugin = this.plugins.get(dep)
      if (depPlugin && !depPlugin.dependents.includes(pluginId)) {
        depPlugin.dependents.push(pluginId)
      }
    }

    // 触发依赖关系变更事件
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      this.emit('dependency:changed', {
        pluginId,
        dependencies: plugin.dependencies,
        dependents: plugin.dependents,
      })
    }
  }

  /**
   * 从依赖图中移除节点
   */
  private removeDependencyNode(pluginId: string): void {
    // 从正向依赖图移除
    const dependencies = this.dependencyGraph.get(pluginId) || new Set()
    this.dependencyGraph.delete(pluginId)

    // 从反向依赖图中移除对此插件的引用
    for (const dep of dependencies) {
      const dependents = this.reverseDependencyGraph.get(dep)
      if (dependents) {
        dependents.delete(pluginId)

        // 更新被依赖插件的 dependents 列表
        const depPlugin = this.plugins.get(dep)
        if (depPlugin) {
          depPlugin.dependents = depPlugin.dependents.filter(
            id => id !== pluginId,
          )
        }
      }
    }

    // 移除反向依赖记录
    this.reverseDependencyGraph.delete(pluginId)
  }

  /**
   * 激活插件（内部方法）
   */
  private async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not registered`)
    }

    if (plugin.state === 'active') {
      return // 已经激活
    }

    // 首先激活所有依赖
    for (const dep of plugin.dependencies) {
      await this.activatePlugin(dep)
    }

    // 激活当前插件
    if (plugin.instance) {
      await plugin.instance.onActivate()
      this.updatePluginState(pluginId, 'active')
    }
  }

  /**
   * 停用插件（内部方法）
   */
  private async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not registered`)
    }

    if (plugin.state !== 'active') {
      return // 已经停用
    }

    // 首先停用所有依赖此插件的插件
    for (const dependent of plugin.dependents) {
      await this.deactivatePlugin(dependent)
    }

    // 停用当前插件
    if (plugin.instance) {
      await plugin.instance.onDeactivate()
      this.updatePluginState(pluginId, 'inactive')
    }
  }

  /**
   * 清理注册表
   */
  private cleanupRegistry(): void {
    if (!this.config.enableStats) {
      return
    }

    const now = new Date()
    const threshold = 24 * 60 * 60 * 1000 // 24小时

    for (const [pluginId, plugin] of this.plugins) {
      // 清理过期的错误信息
      if (
        plugin.stats.lastErrorAt &&
        now.getTime() - plugin.stats.lastErrorAt.getTime() > threshold
      ) {
        plugin.stats.lastError = null
        plugin.stats.lastErrorAt = null
      }

      // 重置统计计数器（如果超过一定阈值）
      if (plugin.stats.activationCount > 10000) {
        plugin.stats.activationCount = Math.floor(
          plugin.stats.activationCount / 10,
        )
      }
    }

    console.log('[PluginRegistry] Registry cleanup completed')
  }

  /**
   * 持久化状态
   */
  private persistState(): void {
    try {
      const state = {
        plugins: Array.from(this.plugins.entries()).map(([id, plugin]) => ({
          id,
          metadata: plugin.metadata,
          state: plugin.state,
          registeredAt: plugin.registeredAt.toISOString(),
          lastActivatedAt: plugin.lastActivatedAt?.toISOString(),
          lastDeactivatedAt: plugin.lastDeactivatedAt?.toISOString(),
          error: plugin.error,
          dependencies: plugin.dependencies,
          dependents: plugin.dependents,
          stats: {
            ...plugin.stats,
            lastErrorAt: plugin.stats.lastErrorAt?.toISOString(),
          },
        })),
        lastUpdated: new Date().toISOString(),
      }

      localStorage.setItem(this.config.persistenceKey, JSON.stringify(state))
    } catch (error) {
      console.warn('[PluginRegistry] Failed to persist state:', error)
    }
  }

  /**
   * 加载持久化状态
   */
  private loadPersistedState(): void {
    try {
      const stored = localStorage.getItem(this.config.persistenceKey)
      if (!stored) {
        return
      }

      const state = JSON.parse(stored)
      console.log(
        `[PluginRegistry] Loaded persisted state with ${state.plugins?.length || 0} plugins`,
      )
    } catch (error) {
      console.warn('[PluginRegistry] Failed to load persisted state:', error)
    }
  }

  /**
   * 事件监听
   */
  on<T extends keyof RegistryEvents>(
    event: T,
    listener: (data: RegistryEvents[T]) => void,
  ): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件监听
   */
  off<T extends keyof RegistryEvents>(
    event: T,
    listener: (data: RegistryEvents[T]) => void,
  ): void {
    const listeners = this.eventListeners.get(event) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 触发事件
   */
  private emit<T extends keyof RegistryEvents>(
    event: T,
    data: RegistryEvents[T],
  ): void {
    const listeners = this.eventListeners.get(event) || []
    for (const listener of listeners) {
      try {
        listener(data)
      } catch (error) {
        console.error(
          `[PluginRegistry] Event listener error for ${event}:`,
          error,
        )
      }
    }
  }

  /**
   * 获取插件统计信息
   */
  getStats(): {
    totalPlugins: number
    activePlugins: number
    inactivePlugins: number
    errorPlugins: number
    totalActivations: number
    totalRuntime: number
    avgLoadTime: number
    } {
    const plugins = this.getAllPlugins()

    return {
      totalPlugins: plugins.length,
      activePlugins: plugins.filter(p => p.state === 'active').length,
      inactivePlugins: plugins.filter(p => p.state === 'inactive').length,
      errorPlugins: plugins.filter(p => p.state === 'error').length,
      totalActivations: plugins.reduce(
        (sum, p) => sum + p.stats.activationCount,
        0,
      ),
      totalRuntime: plugins.reduce((sum, p) => sum + p.stats.totalRuntime, 0),
      avgLoadTime:
        plugins.length > 0
          ? plugins.reduce((sum, p) => sum + p.stats.avgLoadTime, 0) /
            plugins.length
          : 0,
    }
  }

  /**
   * 搜索插件
   */
  searchPlugins(query: string): RegisteredPlugin[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllPlugins().filter(
      plugin =>
        plugin.id.toLowerCase().includes(lowerQuery) ||
        plugin.metadata.name.toLowerCase().includes(lowerQuery) ||
        plugin.metadata.description?.toLowerCase().includes(lowerQuery) ||
        plugin.metadata.keywords?.some(keyword =>
          keyword.toLowerCase().includes(lowerQuery),
        ),
    )
  }

  /**
   * 获取依赖关系图
   */
  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>()
    for (const [pluginId, deps] of this.dependencyGraph) {
      graph.set(pluginId, Array.from(deps))
    }
    return graph
  }

  /**
   * 检查循环依赖
   */
  hasCircularDependency(): boolean {
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (pluginId: string): boolean => {
      if (visited.has(pluginId)) {
        return false
      }

      if (visiting.has(pluginId)) {
        return true // 发现循环
      }

      visiting.add(pluginId)

      const dependencies = this.dependencyGraph.get(pluginId) || new Set()
      for (const dep of dependencies) {
        if (visit(dep)) {
          return true
        }
      }

      visiting.delete(pluginId)
      visited.add(pluginId)
      return false
    }

    for (const pluginId of this.plugins.keys()) {
      if (visit(pluginId)) {
        return true
      }
    }

    return false
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.plugins.clear()
    this.dependencyGraph.clear()
    this.reverseDependencyGraph.clear()

    if (this.config.enableStatePersistence) {
      localStorage.removeItem(this.config.persistenceKey)
    }

    console.log('[PluginRegistry] Registry cleared')
  }

  /**
   * 销毁注册表
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.clear()
    this.eventListeners.clear()

    console.log('[PluginRegistry] Registry destroyed')
  }

  /**
   * 获取配置
   */
  getConfig(): RegistryConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RegistryConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // 重启清理定时器
    if (newConfig.cleanupInterval !== undefined) {
      this.startCleanupTimer()
    }

    console.log('[PluginRegistry] Configuration updated')
  }
}

/**
 * 创建插件注册表实例
 */
export function createPluginRegistry(
  config?: Partial<RegistryConfig>,
): PluginRegistry {
  return new PluginRegistry(config)
}

/**
 * 全局插件注册表实例
 */
export const globalPluginRegistry = new PluginRegistry()
