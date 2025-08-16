import { ref, reactive } from 'vue'
import type { PluginMetadata } from '@/types/plugin'

/**
 * 热重载配置
 */
interface HotReloadConfig {
  enabled: boolean
  watchPaths: string[]
  watchExtensions: string[]
  debounceDelay: number
  preserveState: boolean
  enableLogging: boolean
}

/**
 * 文件变化事件
 */
interface FileChangeEvent {
  path: string
  type: 'added' | 'changed' | 'deleted'
  timestamp: number
}

/**
 * 插件热重载管理器
 * 监听插件文件变化，实现无缝热更新
 */
export class HotReloadManager {
  private config: HotReloadConfig
  private watchers: Map<string, any> = new Map()
  private pluginStates: Map<string, any> = new Map()
  private changeQueue: FileChangeEvent[] = []
  private debounceTimer: number | null = null
  private isReloading = ref(false)
  private reloadStats = reactive({
    totalReloads: 0,
    successfulReloads: 0,
    failedReloads: 0,
    lastReloadTime: null as Date | null,
  })

  constructor(config: Partial<HotReloadConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      watchPaths: config.watchPaths ?? ['src/plugins'],
      watchExtensions: config.watchExtensions ?? ['.ts', '.js', '.vue', '.css'],
      debounceDelay: config.debounceDelay ?? 300,
      preserveState: config.preserveState ?? true,
      enableLogging: config.enableLogging ?? true,
    }

    if (this.config.enabled && import.meta.env.DEV) {
      this.initialize()
    }
  }

  /**
   * 初始化热重载
   */
  private initialize() {
    this.log('Initializing hot reload manager')
    
    // 在开发环境下启用热重载
    if (import.meta.hot) {
      this.setupViteHMR()
    }
    
    // 监听插件目录变化
    this.startWatching()
  }

  /**
   * 设置 Vite HMR
   */
  private setupViteHMR() {
    if (!import.meta.hot) return

    // 监听插件文件变化
    import.meta.hot.on('plugin-file-changed', (data: FileChangeEvent) => {
      this.handleFileChange(data)
    })

    // 监听插件配置变化
    import.meta.hot.on('plugin-config-changed', (data: { pluginId: string; config: any }) => {
      this.handleConfigChange(data.pluginId, data.config)
    })

    this.log('Vite HMR integration enabled')
  }

  /**
   * 开始监听文件变化
   */
  private startWatching() {
    // 这里可以集成文件系统监听器
    // 在实际应用中，通常由构建工具（如 Vite）提供文件变化事件
    this.log('File watching started')
  }

  /**
   * 处理文件变化
   */
  private handleFileChange(event: FileChangeEvent) {
    if (!this.config.enabled) return

    this.log(`File ${event.type}: ${event.path}`)
    
    // 添加到变化队列
    this.changeQueue.push(event)
    
    // 防抖处理
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    
    this.debounceTimer = window.setTimeout(() => {
      this.processChangeQueue()
      this.debounceTimer = null
    }, this.config.debounceDelay)
  }

  /**
   * 处理配置变化
   */
  private handleConfigChange(pluginId: string, newConfig: any) {
    this.log(`Config changed for plugin: ${pluginId}`)
    
    // 触发插件配置重载
    this.reloadPluginConfig(pluginId, newConfig)
  }

  /**
   * 处理变化队列
   */
  private async processChangeQueue() {
    if (this.changeQueue.length === 0) return
    
    this.isReloading.value = true
    this.reloadStats.totalReloads++
    
    try {
      // 按插件分组处理变化
      const pluginChanges = this.groupChangesByPlugin()
      
      for (const [pluginId, changes] of pluginChanges) {
        await this.reloadPlugin(pluginId, changes)
      }
      
      this.reloadStats.successfulReloads++
      this.log('Hot reload completed successfully')
    } catch (error) {
      this.reloadStats.failedReloads++
      console.error('[HotReload] Reload failed:', error)
    } finally {
      this.changeQueue = []
      this.isReloading.value = false
      this.reloadStats.lastReloadTime = new Date()
    }
  }

  /**
   * 按插件分组变化
   */
  private groupChangesByPlugin(): Map<string, FileChangeEvent[]> {
    const pluginChanges = new Map<string, FileChangeEvent[]>()
    
    for (const change of this.changeQueue) {
      const pluginId = this.extractPluginId(change.path)
      if (pluginId) {
        if (!pluginChanges.has(pluginId)) {
          pluginChanges.set(pluginId, [])
        }
        pluginChanges.get(pluginId)!.push(change)
      }
    }
    
    return pluginChanges
  }

  /**
   * 从文件路径提取插件ID
   */
  private extractPluginId(filePath: string): string | null {
    // 假设插件文件路径格式为: src/plugins/{pluginId}/...
    const match = filePath.match(/src\/plugins\/([^\/]+)/)
    return match?.[1] ?? null
  }

  /**
   * 重载插件
   */
  private async reloadPlugin(pluginId: string, changes: FileChangeEvent[]) {
    this.log(`Reloading plugin: ${pluginId}`)
    
    try {
      // 保存插件状态
      if (this.config.preserveState) {
        await this.preservePluginState(pluginId)
      }
      
      // 检查是否需要完全重载
      const needsFullReload = changes.some(change => 
        change.path.includes('metadata.json') || 
        change.path.includes('index.ts') ||
        change.type === 'deleted',
      )
      
      if (needsFullReload) {
        await this.fullReloadPlugin(pluginId)
      } else {
        await this.partialReloadPlugin(pluginId, changes)
      }
      
      // 恢复插件状态
      if (this.config.preserveState) {
        await this.restorePluginState(pluginId)
      }
      
      this.log(`Plugin ${pluginId} reloaded successfully`)
    } catch (error) {
      console.error(`[HotReload] Failed to reload plugin ${pluginId}:`, error)
      throw error
    }
  }

  /**
   * 完全重载插件
   */
  private async fullReloadPlugin(pluginId: string) {
    // 这里需要与 PluginManager 集成
    // 1. 停用插件
    // 2. 卸载插件
    // 3. 重新加载插件
    // 4. 激活插件
    
    this.log(`Performing full reload for plugin: ${pluginId}`)
    
    // 发送重载事件
    this.dispatchReloadEvent(pluginId, 'full')
  }

  /**
   * 部分重载插件
   */
  private async partialReloadPlugin(pluginId: string, changes: FileChangeEvent[]) {
    this.log(`Performing partial reload for plugin: ${pluginId}`)
    
    // 根据变化类型进行部分更新
    for (const change of changes) {
      if (change.path.includes('.vue')) {
        await this.reloadPluginComponent(pluginId, change.path)
      } else if (change.path.includes('.css')) {
        await this.reloadPluginStyles(pluginId, change.path)
      } else if (change.path.includes('.ts') || change.path.includes('.js')) {
        await this.reloadPluginScript(pluginId, change.path)
      }
    }
    
    // 发送重载事件
    this.dispatchReloadEvent(pluginId, 'partial')
  }

  /**
   * 重载插件组件
   */
  private async reloadPluginComponent(pluginId: string, filePath: string) {
    this.log(`Reloading component: ${filePath}`)
    
    // 这里需要与 Vue 的 HMR 系统集成
    if (import.meta.hot) {
      // 通知 Vue HMR 更新组件
      import.meta.hot.send('vue:update', {
        pluginId,
        filePath,
        timestamp: Date.now(),
      })
    }
  }

  /**
   * 重载插件样式
   */
  private async reloadPluginStyles(pluginId: string, filePath: string) {
    this.log(`Reloading styles: ${filePath}`)
    
    // 查找并更新样式标签
    const styleElements = document.querySelectorAll(`style[data-plugin-id="${pluginId}"]`)
    
    for (const element of styleElements) {
      // 重新加载样式内容
      try {
        const response = await fetch(`${filePath}?t=${Date.now()}`)
        const cssContent = await response.text()
        element.textContent = cssContent
      } catch (error) {
        console.error(`Failed to reload styles for ${pluginId}:`, error)
      }
    }
  }

  /**
   * 重载插件脚本
   */
  private async reloadPluginScript(pluginId: string, filePath: string) {
    this.log(`Reloading script: ${filePath}`)
    
    // 这里需要实现模块热替换逻辑
    // 通常依赖构建工具的 HMR 功能
  }

  /**
   * 重载插件配置
   */
  private async reloadPluginConfig(pluginId: string, newConfig: any) {
    this.log(`Reloading config for plugin: ${pluginId}`)
    
    // 发送配置更新事件
    this.dispatchConfigEvent(pluginId, newConfig)
  }

  /**
   * 保存插件状态
   */
  private async preservePluginState(pluginId: string) {
    // 这里需要与插件实例集成，保存当前状态
    this.log(`Preserving state for plugin: ${pluginId}`)
    
    // 示例：保存到内存
    // const pluginInstance = PluginManager.getInstance(pluginId)
    // if (pluginInstance && pluginInstance.getState) {
    //   this.pluginStates.set(pluginId, pluginInstance.getState())
    // }
  }

  /**
   * 恢复插件状态
   */
  private async restorePluginState(pluginId: string) {
    // 从保存的状态恢复插件
    this.log(`Restoring state for plugin: ${pluginId}`)
    
    const savedState = this.pluginStates.get(pluginId)
    if (savedState) {
      // 示例：恢复状态
      // const pluginInstance = PluginManager.getInstance(pluginId)
      // if (pluginInstance && pluginInstance.setState) {
      //   pluginInstance.setState(savedState)
      // }
      
      this.pluginStates.delete(pluginId)
    }
  }

  /**
   * 发送重载事件
   */
  private dispatchReloadEvent(pluginId: string, type: 'full' | 'partial') {
    const event = new CustomEvent('plugin-hot-reload', {
      detail: { pluginId, type, timestamp: Date.now() },
    })
    
    window.dispatchEvent(event)
  }

  /**
   * 发送配置事件
   */
  private dispatchConfigEvent(pluginId: string, config: any) {
    const event = new CustomEvent('plugin-config-reload', {
      detail: { pluginId, config, timestamp: Date.now() },
    })
    
    window.dispatchEvent(event)
  }

  /**
   * 日志输出
   */
  private log(message: string) {
    if (this.config.enableLogging) {
      console.log(`[HotReload] ${message}`)
    }
  }

  /**
   * 获取重载状态
   */
  public getReloadStatus() {
    return {
      isReloading: this.isReloading.value,
      stats: { ...this.reloadStats },
    }
  }

  /**
   * 手动触发插件重载
   */
  public async manualReload(pluginId: string) {
    this.log(`Manual reload triggered for plugin: ${pluginId}`)
    
    try {
      await this.reloadPlugin(pluginId, [])
      return true
    } catch (error) {
      console.error(`Manual reload failed for plugin ${pluginId}:`, error)
      return false
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<HotReloadConfig>) {
    this.config = { ...this.config, ...newConfig }
    this.log('Hot reload config updated')
    
    if (!this.config.enabled) {
      this.cleanup()
    } else if (import.meta.env.DEV) {
      this.initialize()
    }
  }

  /**
   * 清理资源
   */
  public cleanup() {
    this.log('Cleaning up hot reload manager')
    
    // 清理定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    
    // 清理监听器
    this.watchers.clear()
    
    // 清理状态
    this.pluginStates.clear()
    this.changeQueue = []
  }
}

// 导出单例实例
export const hotReloadManager = new HotReloadManager()

// 开发环境下自动启用
if (import.meta.env.DEV) {
  // 将热重载管理器挂载到全局，方便调试
  (window as any).__hotReloadManager = hotReloadManager
}
