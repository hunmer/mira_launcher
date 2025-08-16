import type { App } from 'vue'

/**
 * 插件性能监控数据
 */
interface PluginPerformanceData {
  pluginId: string
  loadTime: number
  activationTime: number
  memoryUsage: number
  renderCount: number
  errorCount: number
  lastUpdate: Date
}

/**
 * 性能监控配置
 */
interface PerformanceConfig {
  enablePluginMonitoring: boolean
  memoryThreshold: number // MB
  loadTimeThreshold: number // ms
  renderCountThreshold: number
  enableAlerts: boolean
  logInterval: number // ms
}

/**
 * 性能监控管理器
 */
class PerformanceMonitor {
  private config: PerformanceConfig = {
    enablePluginMonitoring: true,
    memoryThreshold: 50, // 50MB
    loadTimeThreshold: 1000, // 1秒
    renderCountThreshold: 100,
    enableAlerts: true,
    logInterval: 10000, // 10秒
  }

  private pluginMetrics = new Map<string, PluginPerformanceData>()
  private generalMetrics = {
    totalComponents: 0,
    totalPlugins: 0,
    memoryPeakUsage: 0,
    startTime: Date.now(),
  }

  private monitoringInterval: number | null = null

  /**
   * 记录组件渲染
   */
  recordComponentRender() {
    this.generalMetrics.totalComponents++
  }

  /**
   * 初始化性能监控
   */
  init(config?: Partial<PerformanceConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }

    if (import.meta.env.DEV) {
      this.startMonitoring()
      console.log('[Performance Monitor] Initialized for development environment')
    }
  }

  /**
   * 开始监控
   */
  private startMonitoring() {
    // 定期检查性能指标
    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics()
      this.checkThresholds()
    }, this.config.logInterval)

    // 监听内存警告
    this.setupMemoryWarnings()
  }

  /**
   * 设置内存警告
   */
  private setupMemoryWarnings() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory
        const usedMB = memory.usedJSHeapSize / 1024 / 1024

        if (usedMB > this.generalMetrics.memoryPeakUsage) {
          this.generalMetrics.memoryPeakUsage = usedMB
        }

        if (usedMB > this.config.memoryThreshold && this.config.enableAlerts) {
          console.warn(`[Performance] High memory usage detected: ${usedMB.toFixed(2)}MB`)
          this.dispatchPerformanceEvent('memory-warning', { usage: usedMB })
        }
      }

      // 每分钟检查一次内存
      setInterval(checkMemory, 60000)
    }
  }

  /**
   * 收集性能指标
   */
  private collectMetrics() {
    // 收集总体指标
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const currentUsage = memory.usedJSHeapSize / 1024 / 1024

      // console.log('[Performance] Memory Usage:', {
      //   current: `${currentUsage.toFixed(2)} MB`,
      //   peak: `${this.generalMetrics.memoryPeakUsage.toFixed(2)} MB`,
      //   total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      //   limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      // })
    }

    // 收集插件指标
    if (this.config.enablePluginMonitoring) {
      this.collectPluginMetrics()
    }
  }

  /**
   * 收集插件性能指标
   */
  private collectPluginMetrics() {
    // console.log('[Performance] Plugin Metrics:', {
    //   totalPlugins: this.generalMetrics.totalPlugins,
    //   activePlugins: this.pluginMetrics.size,
    //   metrics: Array.from(this.pluginMetrics.values()).map(metric => ({
    //     pluginId: metric.pluginId,
    //     loadTime: `${metric.loadTime}ms`,
    //     memory: `${metric.memoryUsage.toFixed(2)}MB`,
    //     renders: metric.renderCount,
    //     errors: metric.errorCount,
    //   })),
    // })
  }

  /**
   * 检查阈值
   */
  private checkThresholds() {
    for (const [pluginId, metric] of this.pluginMetrics) {
      // 检查加载时间
      if (metric.loadTime > this.config.loadTimeThreshold) {
        this.alertSlowPlugin(pluginId, 'load-time', metric.loadTime)
      }

      // 检查内存使用
      if (metric.memoryUsage > this.config.memoryThreshold) {
        this.alertSlowPlugin(pluginId, 'memory', metric.memoryUsage)
      }

      // 检查渲染次数
      if (metric.renderCount > this.config.renderCountThreshold) {
        this.alertSlowPlugin(pluginId, 'render-count', metric.renderCount)
      }
    }
  }

  /**
   * 警告慢插件
   */
  private alertSlowPlugin(pluginId: string, type: string, value: number) {
    if (!this.config.enableAlerts) return

    const message = `Plugin ${pluginId} performance issue: ${type} = ${value}`
    console.warn(`[Performance] ${message}`)

    this.dispatchPerformanceEvent('plugin-performance-warning', {
      pluginId,
      type,
      value,
      timestamp: Date.now(),
    })
  }

  /**
   * 发送性能事件
   */
  private dispatchPerformanceEvent(type: string, data: any) {
    const event = new CustomEvent('performance-event', {
      detail: { type, data, timestamp: Date.now() },
    })
    window.dispatchEvent(event)
  }

  /**
   * 记录插件加载开始
   */
  startPluginLoad(pluginId: string) {
    const startTime = performance.now()

    // 创建或更新插件指标
    const existing = this.pluginMetrics.get(pluginId)
    const metric: PluginPerformanceData = existing || {
      pluginId,
      loadTime: 0,
      activationTime: 0,
      memoryUsage: 0,
      renderCount: 0,
      errorCount: 0,
      lastUpdate: new Date(),
    }

      // 存储加载开始时间
      ; (metric as any).loadStartTime = startTime
    this.pluginMetrics.set(pluginId, metric)

    console.log(`[Performance] Plugin load started: ${pluginId}`)
  }

  /**
   * 记录插件加载完成
   */
  endPluginLoad(pluginId: string, success: boolean = true) {
    const endTime = performance.now()
    const metric = this.pluginMetrics.get(pluginId)

    if (metric && (metric as any).loadStartTime) {
      metric.loadTime = endTime - (metric as any).loadStartTime
      metric.lastUpdate = new Date()

      if (!success) {
        metric.errorCount++
      }

      delete (metric as any).loadStartTime
      this.pluginMetrics.set(pluginId, metric)

      console.log(`[Performance] Plugin load ${success ? 'completed' : 'failed'}: ${pluginId} (${metric.loadTime.toFixed(2)}ms)`)
    }
  }

  /**
   * 记录插件激活
   */
  recordPluginActivation(pluginId: string) {
    const startTime = performance.now()

    const metric = this.pluginMetrics.get(pluginId)
    if (metric) {
      (metric as any).activationStartTime = startTime
    }

    // 更新总插件数
    this.generalMetrics.totalPlugins++
  }

  /**
   * 记录插件激活完成
   */
  recordPluginActivationEnd(pluginId: string) {
    const endTime = performance.now()
    const metric = this.pluginMetrics.get(pluginId)

    if (metric && (metric as any).activationStartTime) {
      metric.activationTime = endTime - (metric as any).activationStartTime
      metric.lastUpdate = new Date()

      delete (metric as any).activationStartTime
      this.pluginMetrics.set(pluginId, metric)

      console.log(`[Performance] Plugin activation completed: ${pluginId} (${metric.activationTime.toFixed(2)}ms)`)
    }
  }

  /**
   * 记录插件渲染
   */
  recordPluginRender(pluginId: string) {
    const metric = this.pluginMetrics.get(pluginId)
    if (metric) {
      metric.renderCount++
      metric.lastUpdate = new Date()
      this.pluginMetrics.set(pluginId, metric)
    }
  }

  /**
   * 记录插件错误
   */
  recordPluginError(pluginId: string, error: Error) {
    const metric = this.pluginMetrics.get(pluginId)
    if (metric) {
      metric.errorCount++
      metric.lastUpdate = new Date()
      this.pluginMetrics.set(pluginId, metric)
    }

    console.error(`[Performance] Plugin error in ${pluginId}:`, error)

    this.dispatchPerformanceEvent('plugin-error', {
      pluginId,
      error: error.message,
      stack: error.stack,
    })
  }

  /**
   * 移除插件指标
   */
  removePluginMetrics(pluginId: string) {
    this.pluginMetrics.delete(pluginId)
    this.generalMetrics.totalPlugins = Math.max(0, this.generalMetrics.totalPlugins - 1)
    console.log(`[Performance] Removed metrics for plugin: ${pluginId}`)
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const uptime = Date.now() - this.generalMetrics.startTime

    return {
      uptime,
      general: { ...this.generalMetrics },
      plugins: Array.from(this.pluginMetrics.values()),
      memory: this.getMemoryStats(),
      timestamp: new Date(),
    }
  }

  /**
   * 获取内存统计
   */
  private getMemoryStats() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        peak: Math.round(this.generalMetrics.memoryPeakUsage),
      }
    }
    return null
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...newConfig }
    console.log('[Performance] Config updated:', newConfig)
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    this.pluginMetrics.clear()
    console.log('[Performance] Monitor cleaned up')
  }
}

// 创建全局性能监控实例
const performanceMonitor = new PerformanceMonitor()

/**
 * 性能监控插件
 * 用于开发环境下的性能分析和优化建议
 */
export function setupPerformanceMonitor(app: App) {
  if (import.meta.env.DEV) {
    // 启用 Vue 性能追踪
    app.config.performance = true

    // 初始化性能监控
    performanceMonitor.init()

    // 组件渲染性能监控
    let renderCount = 0

    app.mixin({
      mounted() {
        renderCount++
        performanceMonitor.recordComponentRender()

        if (renderCount % 10 === 0) {
          console.log(`[Performance] Rendered ${renderCount} components`)
        }

        // 检查是否是插件组件
        const pluginId = (this.$el as HTMLElement)?.getAttribute?.('data-plugin-id')
        if (pluginId) {
          performanceMonitor.recordPluginRender(pluginId)
        }
      },
    })

    // 监听路由变化
    window.addEventListener('beforeunload', () => {
      console.log('[Performance] Final stats:', performanceMonitor.getPerformanceReport())
    })

    // 暴露到全局以便调试
    ; (window as any).__performanceMonitor = performanceMonitor

    console.log('[Performance Monitor] Initialized for development environment')
  }
}

/**
 * 内存使用监控
 */
export function monitorMemoryUsage() {
  if (import.meta.env.DEV && 'memory' in performance) {
    const memory = (performance as any).memory

    console.log('[Memory Usage]', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    })
  }
}

/**
 * 包大小分析
 */
export function analyzeBundleSize() {
  if (import.meta.env.PROD) {
    // 生产环境下的包大小报告
    const scripts = document.querySelectorAll('script[src]')
    const links = document.querySelectorAll('link[rel="stylesheet"]')

    console.log('[Bundle Analysis]', {
      scripts: scripts.length,
      stylesheets: links.length,
    })
  }
}

// 导出性能监控实例
export { performanceMonitor }

