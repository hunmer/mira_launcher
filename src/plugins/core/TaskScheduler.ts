/**
 * 任务调度器
 * 基于 BaseQueue 架构实现高级任务调度功能
 * 支持串行/并行执行模式切换、并发限流控制和任务取消功能
 */

import type { QueueConfig, Task, TaskExecutorOptions } from '@/types/plugin'
import { reactive, ref } from 'vue'
import { BaseQueue } from './BaseQueue'
import { globalEventBus } from './EventBus'
import { QueueFactory } from './QueueFactory'
import { TaskExecutor } from './TaskExecutor'

/**
 * 执行模式枚举
 */
export type ExecutionMode = 'serial' | 'parallel' | 'mixed'

/**
 * 调度器配置接口
 */
export interface SchedulerConfig {
  /** 执行模式 */
  mode: ExecutionMode
  /** 最大并发数（parallel 和 mixed 模式下有效） */
  maxConcurrency: number
  /** 限流配置 */
  rateLimit: {
    /** 时间窗口（毫秒） */
    windowMs: number
    /** 最大任务数 */
    maxTasks: number
  }
  /** 是否启用任务取消 */
  enableCancellation: boolean
  /** 队列配置 */
  queueConfig: QueueConfig
}

/**
 * 调度器统计信息
 */
export interface SchedulerStats {
  /** 总调度任务数 */
  totalScheduled: number
  /** 当前运行任务数 */
  currentRunning: number
  /** 已完成任务数 */
  completed: number
  /** 已取消任务数 */
  cancelled: number
  /** 失败任务数 */
  failed: number
  /** 平均响应时间 */
  averageResponseTime: number
  /** 吞吐量（任务/秒） */
  throughput: number
  /** 队列利用率 */
  queueUtilization: number
}

/**
 * 限流跟踪数据
 */
interface RateLimitTracker {
  /** 调用次数 */
  calls: number
  /** 重置时间 */
  resetTime: number
}

/**
 * 任务调度器主类
 */
export class TaskScheduler {
  private config: SchedulerConfig
  private primaryQueue!: BaseQueue // 使用 ! 表示稍后在 initializeScheduler 中初始化
  private executors = new Map<string, TaskExecutor>()
  private runningTasks = new Map<string, AbortController>()
  private rateLimitTracker = new Map<string, RateLimitTracker>()

  private stats = reactive<SchedulerStats>({
    totalScheduled: 0,
    currentRunning: 0,
    completed: 0,
    cancelled: 0,
    failed: 0,
    averageResponseTime: 0,
    throughput: 0,
    queueUtilization: 0,
  })

  private responseTimes: number[] = []
  private startTime = Date.now()
  private isRunning = ref(false)

  public readonly id: string

  constructor(id: string, config?: Partial<SchedulerConfig>) {
    this.id = id
    this.config = {
      mode: 'parallel',
      maxConcurrency: 5,
      rateLimit: {
        windowMs: 60000, // 1分钟
        maxTasks: 100,
      },
      enableCancellation: true,
      queueConfig: {
        concurrency: 1,
        autostart: false,
        timeout: 30000,
      },
      ...config,
    }

    this.initializeScheduler()
    this.setupEventListeners()
  }

  /**
   * 初始化调度器
   */
  private initializeScheduler(): void {
    // 根据执行模式创建主队列
    const queueType =
      this.config.mode === 'serial'
        ? 'fifo'
        : this.config.mode === 'parallel'
          ? 'priority'
          : 'priority'

    this.primaryQueue = QueueFactory.createQueue(
      `${this.id}-primary`,
      queueType,
      {
        ...this.config.queueConfig,
        concurrency:
          this.config.mode === 'serial' ? 1 : this.config.maxConcurrency,
      },
    )

    // 为并行模式创建任务执行器池
    if (this.config.mode !== 'serial') {
      const executorOptions: TaskExecutorOptions = {
        defaultTimeout: this.config.queueConfig.timeout || 30000,
        enableResourceMonitoring: true,
        maxConcurrency: this.config.maxConcurrency,
      }

      for (let i = 0; i < this.config.maxConcurrency; i++) {
        const executor = new TaskExecutor(executorOptions)
        this.executors.set(`executor-${i}`, executor)
      }
    }

    globalEventBus.emit('scheduler:initialized', {
      schedulerId: this.id,
      config: this.config,
    })
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听队列事件
    globalEventBus.on('queue:taskCompleted', event => {
      const data = event.data as any
      if (data.queueId === `${this.id}-primary`) {
        this.handleTaskCompleted(data.taskId, data.result)
      }
    })

    globalEventBus.on('queue:taskFailed', event => {
      const data = event.data as any
      if (data.queueId === `${this.id}-primary`) {
        this.handleTaskFailed(data.taskId, data.error)
      }
    })

    // 定期更新统计信息
    setInterval(() => {
      this.updateStats()
    }, 5000)
  }

  /**
   * 调度任务
   */
  async scheduleTask(task: Task): Promise<string> {
    // 检查限流
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded')
    }

    // 增强任务信息
    const enhancedTask: Task = {
      ...task,
      metadata: {
        ...task.metadata,
        schedulerId: this.id,
        mode: this.config.mode,
        scheduledAt: new Date(),
      },
    }

    // 根据执行模式处理任务
    let taskId: string

    switch (this.config.mode) {
    case 'serial':
      taskId = await this.scheduleSerialTask(enhancedTask)
      break
    case 'parallel':
      taskId = await this.scheduleParallelTask(enhancedTask)
      break
    case 'mixed':
      taskId = await this.scheduleMixedTask(enhancedTask)
      break
    default:
      throw new Error(`Unsupported execution mode: ${this.config.mode}`)
    }

    this.stats.totalScheduled++
    this.updateQueueUtilization()

    globalEventBus.emit('scheduler:taskScheduled', {
      schedulerId: this.id,
      taskId,
      task: enhancedTask,
    })

    return taskId
  }

  /**
   * 串行模式调度任务
   */
  private async scheduleSerialTask(task: Task): Promise<string> {
    // 直接添加到主队列，由于并发数为1，任务将按顺序执行
    return await this.primaryQueue.push(task)
  }

  /**
   * 并行模式调度任务
   */
  private async scheduleParallelTask(task: Task): Promise<string> {
    // 选择负载最轻的执行器
    const availableExecutor = this.selectBestExecutor()

    if (!availableExecutor) {
      // 所有执行器都忙，添加到主队列等待
      return await this.primaryQueue.push(task)
    }

    // 创建可取消的任务包装器
    const abortController = new AbortController()
    const cancelableTask: Task = {
      ...task,
      execute: async () => {
        if (abortController.signal.aborted) {
          throw new Error('Task was cancelled')
        }
        return await task.execute()
      },
    }

    const taskId = `${this.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    if (this.config.enableCancellation) {
      this.runningTasks.set(taskId, abortController)
    }

    this.stats.currentRunning++

    // 异步执行任务
    availableExecutor
      .executeTask(cancelableTask)
      .then(result => {
        this.handleTaskCompleted(taskId, result)
      })
      .catch(error => {
        this.handleTaskFailed(taskId, error)
      })
      .finally(() => {
        this.runningTasks.delete(taskId)
        this.stats.currentRunning--
      })

    return taskId
  }

  /**
   * 混合模式调度任务
   */
  private async scheduleMixedTask(task: Task): Promise<string> {
    // 根据任务优先级决定执行策略
    const priority = task.priority || 0

    if (priority >= 8) {
      // 高优先级任务使用并行模式
      return await this.scheduleParallelTask(task)
    } else if (priority <= 2) {
      // 低优先级任务使用串行模式
      return await this.scheduleSerialTask(task)
    } else {
      // 中等优先级任务根据当前负载决定
      const utilization = this.stats.queueUtilization
      if (utilization < 0.7) {
        return await this.scheduleParallelTask(task)
      } else {
        return await this.scheduleSerialTask(task)
      }
    }
  }

  /**
   * 选择最佳执行器
   */
  private selectBestExecutor(): TaskExecutor | null {
    let bestExecutor: TaskExecutor | null = null
    let minRunningTasks = Infinity

    for (const executor of this.executors.values()) {
      const stats = executor.getStats()
      if (stats.currentRunning < minRunningTasks) {
        minRunningTasks = stats.currentRunning
        bestExecutor = executor
      }
    }

    // 如果所有执行器都达到最大并发，返回 null
    if (minRunningTasks >= this.config.maxConcurrency) {
      return null
    }

    return bestExecutor
  }

  /**
   * 检查限流（重用 Sandbox 的 checkRateLimit 逻辑）
   */
  private checkRateLimit(): boolean {
    const key = `scheduler-${this.id}`
    const now = Date.now()
    const tracking = this.rateLimitTracker.get(key)

    if (!tracking || now > tracking.resetTime) {
      // 重置或初始化
      this.rateLimitTracker.set(key, {
        calls: 1,
        resetTime: now + this.config.rateLimit.windowMs,
      })
      return true
    }

    if (tracking.calls >= this.config.rateLimit.maxTasks) {
      globalEventBus.emit('scheduler:rateLimitExceeded', {
        schedulerId: this.id,
        limit: this.config.rateLimit.maxTasks,
        window: this.config.rateLimit.windowMs,
      })
      return false
    }

    tracking.calls++
    return true
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    if (!this.config.enableCancellation) {
      return false
    }

    const abortController = this.runningTasks.get(taskId)
    if (abortController) {
      abortController.abort()
      this.runningTasks.delete(taskId)
      this.stats.cancelled++
      this.stats.currentRunning--

      globalEventBus.emit('scheduler:taskCancelled', {
        schedulerId: this.id,
        taskId,
      })

      return true
    }

    return false
  }

  /**
   * 批量取消任务
   */
  async cancelAllTasks(): Promise<number> {
    if (!this.config.enableCancellation) {
      return 0
    }

    const cancelledCount = this.runningTasks.size

    for (const [taskId, abortController] of this.runningTasks) {
      abortController.abort()
      globalEventBus.emit('scheduler:taskCancelled', {
        schedulerId: this.id,
        taskId,
      })
    }

    this.runningTasks.clear()
    this.stats.cancelled += cancelledCount
    this.stats.currentRunning = 0

    globalEventBus.emit('scheduler:allTasksCancelled', {
      schedulerId: this.id,
      cancelledCount,
    })

    return cancelledCount
  }

  /**
   * 处理任务完成
   */
  private handleTaskCompleted(taskId: string, result: any): void {
    this.stats.completed++
    const responseTime =
      Date.now() -
      (this.runningTasks.get(taskId)?.signal.aborted ? 0 : Date.now())
    this.responseTimes.push(responseTime)

    // 保持响应时间数组大小在合理范围内
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500)
    }

    globalEventBus.emit('scheduler:taskCompleted', {
      schedulerId: this.id,
      taskId,
      result,
      responseTime,
    })
  }

  /**
   * 处理任务失败
   */
  private handleTaskFailed(taskId: string, error: Error): void {
    this.stats.failed++

    globalEventBus.emit('scheduler:taskFailed', {
      schedulerId: this.id,
      taskId,
      error,
    })
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    // 计算平均响应时间
    if (this.responseTimes.length > 0) {
      this.stats.averageResponseTime =
        this.responseTimes.reduce((a, b) => a + b, 0) /
        this.responseTimes.length
    }

    // 计算吞吐量
    const runtime = (Date.now() - this.startTime) / 1000
    this.stats.throughput = this.stats.completed / runtime

    // 更新队列利用率
    this.updateQueueUtilization()
  }

  /**
   * 更新队列利用率
   */
  private updateQueueUtilization(): void {
    const maxCapacity =
      this.config.mode === 'serial' ? 1 : this.config.maxConcurrency
    this.stats.queueUtilization = this.stats.currentRunning / maxCapacity
  }

  /**
   * 启动调度器
   */
  async start(): Promise<void> {
    if (this.isRunning.value) {
      return
    }

    this.isRunning.value = true
    await this.primaryQueue.start()

    globalEventBus.emit('scheduler:started', {
      schedulerId: this.id,
    })
  }

  /**
   * 停止调度器
   */
  async stop(): Promise<void> {
    if (!this.isRunning.value) {
      return
    }

    this.isRunning.value = false

    // 取消所有运行中的任务
    if (this.config.enableCancellation) {
      await this.cancelAllTasks()
    }

    // 停止主队列
    await this.primaryQueue.stop()

    // 销毁执行器
    for (const executor of this.executors.values()) {
      executor.destroy()
    }
    this.executors.clear()

    globalEventBus.emit('scheduler:stopped', {
      schedulerId: this.id,
    })
  }

  /**
   * 切换执行模式
   */
  async switchMode(mode: ExecutionMode): Promise<void> {
    if (this.config.mode === mode) {
      return
    }

    const wasRunning = this.isRunning.value

    // 停止当前调度器
    if (wasRunning) {
      await this.stop()
    }

    // 更新配置
    this.config.mode = mode

    // 重新初始化
    this.initializeScheduler()

    // 如果之前在运行，重新启动
    if (wasRunning) {
      await this.start()
    }

    globalEventBus.emit('scheduler:modeChanged', {
      schedulerId: this.id,
      newMode: mode,
    })
  }

  /**
   * 获取统计信息
   */
  getStats(): SchedulerStats {
    return { ...this.stats }
  }

  /**
   * 获取配置信息
   */
  getConfig(): SchedulerConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...config }

    globalEventBus.emit('scheduler:configUpdated', {
      schedulerId: this.id,
      config: this.config,
    })
  }

  /**
   * 销毁调度器
   */
  async destroy(): Promise<void> {
    await this.stop()

    // 清理队列
    QueueFactory.destroyQueue(`${this.id}-primary`)

    // 清理限流跟踪
    this.rateLimitTracker.clear()

    globalEventBus.emit('scheduler:destroyed', {
      schedulerId: this.id,
    })
  }
}

export default TaskScheduler
