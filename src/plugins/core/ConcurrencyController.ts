/**
 * 并发控制器
 * 重用 Sandbox 的限流逻辑，实现高级并发控制功能
 */

import { reactive, ref } from 'vue'
import { globalEventBus } from './EventBus'
import { TaskScheduler } from './TaskScheduler'

/**
 * 并发控制策略
 */
export type ConcurrencyStrategy =
  | 'fixed' // 固定并发数
  | 'adaptive' // 自适应调整
  | 'priority' // 基于优先级
  | 'resource' // 基于资源使用率

/**
 * 资源监控配置
 */
export interface ResourceMonitorConfig {
  /** 内存使用阈值（MB） */
  memoryThreshold: number
  /** CPU 使用率阈值（百分比） */
  cpuThreshold: number
  /** 检查间隔（毫秒） */
  checkInterval: number
  /** 是否启用自动调整 */
  enableAutoAdjustment: boolean
}

/**
 * 并发控制配置
 */
export interface ConcurrencyControlConfig {
  /** 并发策略 */
  strategy: ConcurrencyStrategy
  /** 基础并发数 */
  baseConcurrency: number
  /** 最小并发数 */
  minConcurrency: number
  /** 最大并发数 */
  maxConcurrency: number
  /** 资源监控配置 */
  resourceMonitor: ResourceMonitorConfig
  /** 自适应调整参数 */
  adaptiveParams: {
    /** 调整步长 */
    adjustmentStep: number
    /** 调整阈值 */
    adjustmentThreshold: number
    /** 调整冷却时间（毫秒） */
    cooldownPeriod: number
  }
}

/**
 * 并发控制器统计信息
 */
export interface ConcurrencyStats {
  /** 当前并发数 */
  currentConcurrency: number
  /** 平均并发数 */
  averageConcurrency: number
  /** 最大并发数 */
  peakConcurrency: number
  /** 并发利用率 */
  utilizationRate: number
  /** 资源使用情况 */
  resourceUsage: {
    memory: number
    cpu: number
  }
  /** 调整次数 */
  adjustmentCount: number
  /** 最后调整时间 */
  lastAdjustment: Date | null
}

/**
 * 并发控制器
 */
export class ConcurrencyController {
  private config: ConcurrencyControlConfig
  private schedulers = new Map<string, TaskScheduler>()
  private currentConcurrency = ref(0)
  private maxObservedConcurrency = ref(0)
  private adjustmentHistory: number[] = []
  private lastAdjustmentTime = 0

  private stats = reactive<ConcurrencyStats>({
    currentConcurrency: 0,
    averageConcurrency: 0,
    peakConcurrency: 0,
    utilizationRate: 0,
    resourceUsage: {
      memory: 0,
      cpu: 0,
    },
    adjustmentCount: 0,
    lastAdjustment: null,
  })

  private resourceMonitorInterval: number | null = null
  private isDestroyed = ref(false)

  public readonly id: string

  constructor(id: string, config?: Partial<ConcurrencyControlConfig>) {
    this.id = id
    this.config = {
      strategy: 'adaptive',
      baseConcurrency: 5,
      minConcurrency: 1,
      maxConcurrency: 20,
      resourceMonitor: {
        memoryThreshold: 80, // 80%
        cpuThreshold: 70, // 70%
        checkInterval: 5000, // 5秒
        enableAutoAdjustment: true,
      },
      adaptiveParams: {
        adjustmentStep: 1,
        adjustmentThreshold: 0.8,
        cooldownPeriod: 10000, // 10秒
      },
      ...config,
    }

    this.currentConcurrency.value = this.config.baseConcurrency
    this.stats.currentConcurrency = this.config.baseConcurrency

    this.initializeController()
  }

  /**
   * 初始化控制器
   */
  private initializeController(): void {
    // 启动资源监控
    if (this.config.resourceMonitor.enableAutoAdjustment) {
      this.startResourceMonitoring()
    }

    // 设置事件监听器
    this.setupEventListeners()

    globalEventBus.emit('concurrency:initialized', {
      controllerId: this.id,
      config: this.config,
    })
  }

  /**
   * 启动资源监控
   */
  private startResourceMonitoring(): void {
    this.resourceMonitorInterval = window.setInterval(() => {
      this.checkResourceUsage()
    }, this.config.resourceMonitor.checkInterval)
  }

  /**
   * 检查资源使用情况
   */
  private checkResourceUsage(): void {
    const resourceUsage = this.getCurrentResourceUsage()
    this.stats.resourceUsage = resourceUsage

    // 根据策略调整并发数
    switch (this.config.strategy) {
    case 'adaptive':
      this.adaptiveConcurrencyAdjustment(resourceUsage)
      break
    case 'resource':
      this.resourceBasedAdjustment(resourceUsage)
      break
      // fixed 和 priority 策略不需要自动调整
    }
  }

  /**
   * 获取当前资源使用情况
   */
  private getCurrentResourceUsage(): { memory: number; cpu: number } {
    let memoryUsage = 0
    let cpuUsage = 0

    // 从 performance API 获取内存使用情况
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const totalMemory = memory.jsHeapSizeLimit
      const usedMemory = memory.usedJSHeapSize
      memoryUsage = (usedMemory / totalMemory) * 100
    }

    // CPU 使用率需要更复杂的实现，这里简化处理
    // 在实际应用中可以使用 Web Workers 或其他方法
    cpuUsage = this.estimateCpuUsage()

    return { memory: memoryUsage, cpu: cpuUsage }
  }

  /**
   * 估算 CPU 使用率（简化实现）
   */
  private estimateCpuUsage(): number {
    // 基于当前运行任务数和平均执行时间估算
    const activeTasks = this.getActiveTasks()
    const utilizationRate = activeTasks / this.currentConcurrency.value

    // 简化的 CPU 使用率估算（实际应用中需要更精确的方法）
    return Math.min(utilizationRate * 100, 100)
  }

  /**
   * 获取当前活跃任务数
   */
  private getActiveTasks(): number {
    let totalActiveTasks = 0

    for (const scheduler of this.schedulers.values()) {
      const stats = scheduler.getStats()
      totalActiveTasks += stats.currentRunning
    }

    return totalActiveTasks
  }

  /**
   * 自适应并发调整
   */
  private adaptiveConcurrencyAdjustment(resourceUsage: {
    memory: number
    cpu: number
  }): void {
    const now = Date.now()
    const cooldownPeriod = this.config.adaptiveParams.cooldownPeriod

    // 检查冷却时间
    if (now - this.lastAdjustmentTime < cooldownPeriod) {
      return
    }

    const utilizationRate = this.stats.utilizationRate
    const threshold = this.config.adaptiveParams.adjustmentThreshold
    const step = this.config.adaptiveParams.adjustmentStep

    let newConcurrency = this.currentConcurrency.value

    // 如果利用率高且资源允许，增加并发数
    if (utilizationRate > threshold) {
      if (
        resourceUsage.memory < this.config.resourceMonitor.memoryThreshold &&
        resourceUsage.cpu < this.config.resourceMonitor.cpuThreshold
      ) {
        newConcurrency = Math.min(
          this.currentConcurrency.value + step,
          this.config.maxConcurrency,
        )
      }
    }
    // 如果利用率低，减少并发数
    else if (utilizationRate < threshold * 0.5) {
      newConcurrency = Math.max(
        this.currentConcurrency.value - step,
        this.config.minConcurrency,
      )
    }

    if (newConcurrency !== this.currentConcurrency.value) {
      this.adjustConcurrency(newConcurrency)
    }
  }

  /**
   * 基于资源的并发调整
   */
  private resourceBasedAdjustment(resourceUsage: {
    memory: number
    cpu: number
  }): void {
    const memoryThreshold = this.config.resourceMonitor.memoryThreshold
    const cpuThreshold = this.config.resourceMonitor.cpuThreshold

    let newConcurrency = this.currentConcurrency.value

    // 如果资源使用过高，降低并发数
    if (
      resourceUsage.memory > memoryThreshold ||
      resourceUsage.cpu > cpuThreshold
    ) {
      newConcurrency = Math.max(
        Math.ceil(this.currentConcurrency.value * 0.8),
        this.config.minConcurrency,
      )
    }
    // 如果资源使用较低，适当增加并发数
    else if (
      resourceUsage.memory < memoryThreshold * 0.6 &&
      resourceUsage.cpu < cpuThreshold * 0.6
    ) {
      newConcurrency = Math.min(
        this.currentConcurrency.value + 1,
        this.config.maxConcurrency,
      )
    }

    if (newConcurrency !== this.currentConcurrency.value) {
      this.adjustConcurrency(newConcurrency)
    }
  }

  /**
   * 调整并发数
   */
  private adjustConcurrency(newConcurrency: number): void {
    const oldConcurrency = this.currentConcurrency.value
    this.currentConcurrency.value = newConcurrency
    this.stats.currentConcurrency = newConcurrency

    // 更新峰值
    if (newConcurrency > this.maxObservedConcurrency.value) {
      this.maxObservedConcurrency.value = newConcurrency
      this.stats.peakConcurrency = newConcurrency
    }

    // 记录调整历史
    this.adjustmentHistory.push(newConcurrency)
    if (this.adjustmentHistory.length > 100) {
      this.adjustmentHistory = this.adjustmentHistory.slice(-50)
    }

    // 更新统计信息
    this.stats.adjustmentCount++
    this.stats.lastAdjustment = new Date()
    this.lastAdjustmentTime = Date.now()

    // 更新所有调度器的并发配置
    this.updateSchedulersConcurrency(newConcurrency)

    globalEventBus.emit('concurrency:adjusted', {
      controllerId: this.id,
      oldConcurrency,
      newConcurrency,
      reason: this.config.strategy,
    })
  }

  /**
   * 更新调度器并发配置
   */
  private updateSchedulersConcurrency(newConcurrency: number): void {
    for (const scheduler of this.schedulers.values()) {
      const config = scheduler.getConfig()
      scheduler.updateConfig({
        ...config,
        maxConcurrency: newConcurrency,
      })
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听调度器事件来更新统计信息
    globalEventBus.on('scheduler:taskCompleted', () => {
      this.updateUtilizationStats()
    })

    globalEventBus.on('scheduler:taskFailed', () => {
      this.updateUtilizationStats()
    })

    // 定期更新平均并发数
    setInterval(() => {
      this.updateAverageConcurrency()
    }, 10000) // 每10秒更新一次
  }

  /**
   * 更新利用率统计
   */
  private updateUtilizationStats(): void {
    const activeTasks = this.getActiveTasks()
    this.stats.utilizationRate = activeTasks / this.currentConcurrency.value
  }

  /**
   * 更新平均并发数
   */
  private updateAverageConcurrency(): void {
    if (this.adjustmentHistory.length > 0) {
      const sum = this.adjustmentHistory.reduce((a, b) => a + b, 0)
      this.stats.averageConcurrency = sum / this.adjustmentHistory.length
    }
  }

  /**
   * 注册调度器
   */
  registerScheduler(scheduler: TaskScheduler): void {
    this.schedulers.set(scheduler.id, scheduler)

    // 应用当前并发配置
    const config = scheduler.getConfig()
    scheduler.updateConfig({
      ...config,
      maxConcurrency: this.currentConcurrency.value,
    })

    globalEventBus.emit('concurrency:schedulerRegistered', {
      controllerId: this.id,
      schedulerId: scheduler.id,
    })
  }

  /**
   * 注销调度器
   */
  unregisterScheduler(schedulerId: string): void {
    if (this.schedulers.delete(schedulerId)) {
      globalEventBus.emit('concurrency:schedulerUnregistered', {
        controllerId: this.id,
        schedulerId,
      })
    }
  }

  /**
   * 手动设置并发数
   */
  setConcurrency(concurrency: number): void {
    const clampedConcurrency = Math.max(
      this.config.minConcurrency,
      Math.min(concurrency, this.config.maxConcurrency),
    )

    this.adjustConcurrency(clampedConcurrency)
  }

  /**
   * 获取当前并发数
   */
  getCurrentConcurrency(): number {
    return this.currentConcurrency.value
  }

  /**
   * 获取统计信息
   */
  getStats(): ConcurrencyStats {
    return { ...this.stats }
  }

  /**
   * 获取配置信息
   */
  getConfig(): ConcurrencyControlConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ConcurrencyControlConfig>): void {
    this.config = { ...this.config, ...config }

    // 重新启动资源监控
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval)
      this.resourceMonitorInterval = null
    }

    if (this.config.resourceMonitor.enableAutoAdjustment) {
      this.startResourceMonitoring()
    }

    globalEventBus.emit('concurrency:configUpdated', {
      controllerId: this.id,
      config: this.config,
    })
  }

  /**
   * 销毁控制器
   */
  destroy(): void {
    if (this.isDestroyed.value) {
      return
    }

    this.isDestroyed.value = true

    // 停止资源监控
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval)
      this.resourceMonitorInterval = null
    }

    // 清理调度器引用
    this.schedulers.clear()

    globalEventBus.emit('concurrency:destroyed', {
      controllerId: this.id,
    })
  }
}

export default ConcurrencyController
