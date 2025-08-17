/**
 * 调度器性能监控扩展
 * 扩展现有的 PerformanceMonitor 来支持调度器相关指标
 */

import { reactive, ref } from 'vue'
import { globalEventBus } from './EventBus'

/**
 * 调度器性能指标
 */
export interface SchedulerPerformanceMetrics {
  /** 调度器ID */
  schedulerId: string
  /** 总调度次数 */
  totalSchedules: number
  /** 平均调度延迟 */
  averageScheduleLatency: number
  /** 任务完成率 */
  completionRate: number
  /** 错误率 */
  errorRate: number
  /** 吞吐量趋势 */
  throughputTrend: number[]
  /** 资源利用率 */
  resourceUtilization: number
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * 全局调度器性能统计
 */
export interface GlobalSchedulerStats {
  /** 活跃调度器数量 */
  activeSchedulers: number
  /** 总任务数 */
  totalTasks: number
  /** 系统吞吐量 */
  systemThroughput: number
  /** 平均响应时间 */
  averageResponseTime: number
  /** 系统负载 */
  systemLoad: number
  /** 内存使用情况 */
  memoryUsage: {
    heap: number
    external: number
    total: number
  }
}

/**
 * 调度器性能监控管理器
 */
export class SchedulerPerformanceMonitor {
  private metrics = reactive(new Map<string, SchedulerPerformanceMetrics>())
  private globalStats = reactive<GlobalSchedulerStats>({
    activeSchedulers: 0,
    totalTasks: 0,
    systemThroughput: 0,
    averageResponseTime: 0,
    systemLoad: 0,
    memoryUsage: {
      heap: 0,
      external: 0,
      total: 0,
    },
  })

  private collectionInterval: number | null = null
  private isRunning = ref(false)
  private readonly collectionIntervalMs: number

  constructor(collectionIntervalMs: number = 5000) {
    this.collectionIntervalMs = collectionIntervalMs
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听调度器事件
    globalEventBus.on('scheduler:initialized', event => {
      const data = event.data as any
      this.registerScheduler(data.schedulerId)
    })

    globalEventBus.on('scheduler:destroyed', event => {
      const data = event.data as any
      this.unregisterScheduler(data.schedulerId)
    })

    globalEventBus.on('scheduler:taskScheduled', event => {
      const data = event.data as any
      this.recordTaskSchedule(data.schedulerId)
    })

    globalEventBus.on('scheduler:taskCompleted', event => {
      const data = event.data as any
      this.recordTaskCompletion(data.schedulerId, data.responseTime)
    })

    globalEventBus.on('scheduler:taskFailed', event => {
      const data = event.data as any
      this.recordTaskFailure(data.schedulerId)
    })

    // 监听并发控制器事件
    globalEventBus.on('concurrency:adjusted', event => {
      const data = event.data as any
      this.recordConcurrencyAdjustment(data.controllerId, data.newConcurrency)
    })
  }

  /**
   * 启动性能监控
   */
  start(): void {
    if (this.isRunning.value) {
      return
    }

    this.isRunning.value = true
    this.collectionInterval = window.setInterval(() => {
      this.collectMetrics()
    }, this.collectionIntervalMs)

    globalEventBus.emit('scheduler:performanceMonitorStarted', {
      interval: this.collectionIntervalMs,
    })
  }

  /**
   * 停止性能监控
   */
  stop(): void {
    if (!this.isRunning.value) {
      return
    }

    this.isRunning.value = false

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval)
      this.collectionInterval = null
    }

    globalEventBus.emit('scheduler:performanceMonitorStopped', {})
  }

  /**
   * 注册调度器
   */
  private registerScheduler(schedulerId: string): void {
    if (!this.metrics.has(schedulerId)) {
      this.metrics.set(schedulerId, {
        schedulerId,
        totalSchedules: 0,
        averageScheduleLatency: 0,
        completionRate: 0,
        errorRate: 0,
        throughputTrend: [],
        resourceUtilization: 0,
        lastUpdated: new Date(),
      })

      this.globalStats.activeSchedulers++
    }
  }

  /**
   * 注销调度器
   */
  private unregisterScheduler(schedulerId: string): void {
    if (this.metrics.delete(schedulerId)) {
      this.globalStats.activeSchedulers--
    }
  }

  /**
   * 记录任务调度
   */
  private recordTaskSchedule(schedulerId: string): void {
    const metric = this.metrics.get(schedulerId)
    if (metric) {
      metric.totalSchedules++
      metric.lastUpdated = new Date()
      this.globalStats.totalTasks++
    }
  }

  /**
   * 记录任务完成
   */
  private recordTaskCompletion(
    schedulerId: string,
    responseTime: number,
  ): void {
    const metric = this.metrics.get(schedulerId)
    if (metric) {
      // 更新完成率（简化计算）
      const totalAttempts = metric.totalSchedules
      const completedTasks =
        Math.floor((totalAttempts * metric.completionRate) / 100) + 1
      metric.completionRate = (completedTasks / totalAttempts) * 100

      metric.lastUpdated = new Date()
    }
  }

  /**
   * 记录任务失败
   */
  private recordTaskFailure(schedulerId: string): void {
    const metric = this.metrics.get(schedulerId)
    if (metric) {
      // 更新错误率（简化计算）
      const totalAttempts = metric.totalSchedules
      const failedTasks =
        Math.floor((totalAttempts * metric.errorRate) / 100) + 1
      metric.errorRate = (failedTasks / totalAttempts) * 100

      metric.lastUpdated = new Date()
    }
  }

  /**
   * 记录并发调整
   */
  private recordConcurrencyAdjustment(
    controllerId: string,
    newConcurrency: number,
  ): void {
    // 在实际应用中，这里可以记录并发调整对性能的影响
    console.log(`并发控制器 ${controllerId} 调整并发数到 ${newConcurrency}`)
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    this.updateGlobalStats()
    this.updateMemoryUsage()
    this.calculateSystemLoad()

    // 触发性能指标更新事件
    globalEventBus.emit('scheduler:metricsUpdated', {
      globalStats: this.globalStats,
      schedulerMetrics: Object.fromEntries(this.metrics),
    })
  }

  /**
   * 更新全局统计信息
   */
  private updateGlobalStats(): void {
    let totalThroughput = 0
    let totalResponseTime = 0
    let validMetrics = 0

    for (const metric of this.metrics.values()) {
      if (metric.throughputTrend.length > 0) {
        const lastThroughput =
          metric.throughputTrend[metric.throughputTrend.length - 1]
        if (lastThroughput !== undefined) {
          totalThroughput += lastThroughput
          validMetrics++
        }
      }

      // 响应时间需要从调度器获取实际数据
      totalResponseTime += metric.averageScheduleLatency
    }

    if (validMetrics > 0) {
      this.globalStats.systemThroughput = totalThroughput / validMetrics
      this.globalStats.averageResponseTime = totalResponseTime / validMetrics
    }
  }

  /**
   * 更新内存使用情况
   */
  private updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.globalStats.memoryUsage = {
        heap: memory.usedJSHeapSize / 1024 / 1024, // MB
        external: memory.totalJSHeapSize / 1024 / 1024, // MB
        total: memory.jsHeapSizeLimit / 1024 / 1024, // MB
      }
    }
  }

  /**
   * 计算系统负载
   */
  private calculateSystemLoad(): void {
    // 基于活跃调度器数量和内存使用情况计算系统负载
    const schedulerLoad = this.globalStats.activeSchedulers / 10 // 假设最多支持10个调度器
    const memoryLoad =
      this.globalStats.memoryUsage.heap / this.globalStats.memoryUsage.total

    this.globalStats.systemLoad =
      Math.min((schedulerLoad + memoryLoad) / 2, 1) * 100
  }

  /**
   * 获取调度器指标
   */
  getSchedulerMetrics(schedulerId: string): SchedulerPerformanceMetrics | null {
    return this.metrics.get(schedulerId) || null
  }

  /**
   * 获取所有调度器指标
   */
  getAllSchedulerMetrics(): Map<string, SchedulerPerformanceMetrics> {
    return new Map(this.metrics)
  }

  /**
   * 获取全局统计信息
   */
  getGlobalStats(): GlobalSchedulerStats {
    return { ...this.globalStats }
  }

  /**
   * 重置指标
   */
  resetMetrics(schedulerId?: string): void {
    if (schedulerId) {
      const metric = this.metrics.get(schedulerId)
      if (metric) {
        metric.totalSchedules = 0
        metric.averageScheduleLatency = 0
        metric.completionRate = 0
        metric.errorRate = 0
        metric.throughputTrend = []
        metric.resourceUtilization = 0
        metric.lastUpdated = new Date()
      }
    } else {
      // 重置所有指标
      for (const metric of this.metrics.values()) {
        metric.totalSchedules = 0
        metric.averageScheduleLatency = 0
        metric.completionRate = 0
        metric.errorRate = 0
        metric.throughputTrend = []
        metric.resourceUtilization = 0
        metric.lastUpdated = new Date()
      }

      // 重置全局统计
      this.globalStats.totalTasks = 0
      this.globalStats.systemThroughput = 0
      this.globalStats.averageResponseTime = 0
      this.globalStats.systemLoad = 0
    }

    globalEventBus.emit('scheduler:metricsReset', {
      schedulerId: schedulerId || 'all',
    })
  }

  /**
   * 导出性能报告
   */
  generatePerformanceReport(): {
    timestamp: Date
    globalStats: GlobalSchedulerStats
    schedulerMetrics: Record<string, SchedulerPerformanceMetrics>
    summary: {
      topPerformers: string[]
      bottlenecks: string[]
      recommendations: string[]
    }
    } {
    const metrics = Object.fromEntries(this.metrics)

    // 分析性能表现
    const topPerformers = Object.keys(metrics)
      .filter(id => metrics[id] && metrics[id]!.completionRate > 90)
      .sort((a, b) => {
        const metricA = metrics[a]
        const metricB = metrics[b]
        return (metricB?.completionRate || 0) - (metricA?.completionRate || 0)
      })
      .slice(0, 3)

    const bottlenecks = Object.keys(metrics)
      .filter(id => {
        const metric = metrics[id]
        return metric && (metric.errorRate > 10 || metric.completionRate < 70)
      })
      .sort((a, b) => {
        const metricA = metrics[a]
        const metricB = metrics[b]
        return (metricB?.errorRate || 0) - (metricA?.errorRate || 0)
      })

    const recommendations = []
    if (this.globalStats.systemLoad > 80) {
      recommendations.push(
        '系统负载较高，建议增加调度器并发数或优化任务执行逻辑',
      )
    }
    if (
      this.globalStats.memoryUsage.heap / this.globalStats.memoryUsage.total >
      0.8
    ) {
      recommendations.push('内存使用率较高，建议优化内存管理或增加系统内存')
    }
    if (bottlenecks.length > 0) {
      recommendations.push(
        `发现性能瓶颈：${bottlenecks.join(', ')}，建议检查任务执行逻辑`,
      )
    }

    return {
      timestamp: new Date(),
      globalStats: this.getGlobalStats(),
      schedulerMetrics: metrics,
      summary: {
        topPerformers,
        bottlenecks,
        recommendations,
      },
    }
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    this.stop()
    this.metrics.clear()

    globalEventBus.emit('scheduler:performanceMonitorDestroyed', {})
  }
}

// 创建全局实例
export const globalSchedulerMonitor = new SchedulerPerformanceMonitor()

// 在开发环境中自动启动监控
if (import.meta.env.DEV) {
  globalSchedulerMonitor.start()
}

export default SchedulerPerformanceMonitor
