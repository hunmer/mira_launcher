/**
 * 重试处理器
 * 实现可配置的重试策略，支持指数退避、线性增长等算法
 * 与现有 EventBus 和错误处理机制集成
 */

import type { Task } from '@/types/plugin'
import { reactive, ref } from 'vue'
import { globalEventBus } from './EventBus'

/**
 * 重试策略类型
 */
export type RetryStrategy =
  | 'fixed' // 固定间隔
  | 'linear' // 线性增长
  | 'exponential' // 指数退避
  | 'custom' // 自定义策略

/**
 * 重试配置接口
 */
export interface RetryConfig {
  /** 重试策略 */
  strategy: RetryStrategy
  /** 最大重试次数 */
  maxRetries: number
  /** 基础延迟时间（毫秒） */
  baseDelay: number
  /** 最大延迟时间（毫秒） */
  maxDelay: number
  /** 增长因子（用于指数退避和线性增长） */
  multiplier: number
  /** 抖动因子（0-1，增加随机性） */
  jitter: number
  /** 重试条件函数 */
  shouldRetry?: (error: Error, attempt: number) => boolean
  /** 自定义延迟计算函数 */
  customDelayCalculator?: (attempt: number, baseDelay: number) => number
}

/**
 * 重试统计信息
 */
export interface RetryStats {
  /** 总重试次数 */
  totalRetries: number
  /** 成功重试次数 */
  successfulRetries: number
  /** 最终失败的任务数 */
  finalFailures: number
  /** 平均重试次数 */
  averageRetries: number
  /** 各重试次数的分布 */
  retryDistribution: Map<number, number>
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * 重试记录
 */
interface RetryRecord {
  /** 任务ID */
  taskId: string
  /** 当前重试次数 */
  currentAttempt: number
  /** 原始任务 */
  originalTask: Task
  /** 重试配置 */
  config: RetryConfig
  /** 开始时间 */
  startTime: Date
  /** 错误历史 */
  errorHistory: Array<{
    attempt: number
    error: Error
    timestamp: Date
  }>
  /** 下次重试时间 */
  nextRetryTime?: Date
}

/**
 * 重试处理器类
 */
export class RetryHandler {
  private retryRecords = new Map<string, RetryRecord>()
  private stats = reactive<RetryStats>({
    totalRetries: 0,
    successfulRetries: 0,
    finalFailures: 0,
    averageRetries: 0,
    retryDistribution: new Map(),
    lastUpdated: new Date(),
  })

  private pendingRetries = new Map<string, number>()
  private isDestroyed = ref(false)

  public readonly id: string
  private defaultConfig: RetryConfig

  constructor(id: string, defaultConfig?: Partial<RetryConfig>) {
    this.id = id
    this.defaultConfig = {
      strategy: 'exponential',
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      multiplier: 2,
      jitter: 0.1,
      shouldRetry: (error: Error, attempt: number) => {
        // 默认重试策略：非用户错误且未达到最大重试次数
        return (
          !this.isUserError(error) && attempt < this.defaultConfig.maxRetries
        )
      },
      ...defaultConfig,
    }

    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听任务失败事件
    globalEventBus.on('queue:taskFailed', event => {
      const data = event.data as any
      if (data.task && data.error) {
        this.handleTaskFailure(data.task, data.error)
      }
    })

    // 监听任务成功事件，清理重试记录
    globalEventBus.on('queue:taskCompleted', event => {
      const data = event.data as any
      if (data.taskId) {
        this.handleTaskSuccess(data.taskId)
      }
    })
  }

  /**
   * 处理任务失败
   */
  private async handleTaskFailure(task: Task, error: Error): Promise<void> {
    const taskId = task.id
    let record = this.retryRecords.get(taskId)

    if (!record) {
      // 创建新的重试记录
      const config = this.mergeConfig(task.metadata?.['retryConfig'])
      record = {
        taskId,
        currentAttempt: 0,
        originalTask: task,
        config,
        startTime: new Date(),
        errorHistory: [],
      }
      this.retryRecords.set(taskId, record)
    }

    record.currentAttempt++
    record.errorHistory.push({
      attempt: record.currentAttempt,
      error,
      timestamp: new Date(),
    })

    // 检查是否应该重试
    if (this.shouldRetryTask(record, error)) {
      await this.scheduleRetry(record)
    } else {
      // 重试次数耗尽或不应重试，标记为最终失败
      await this.handleFinalFailure(record, error)
    }

    this.updateStats()
  }

  /**
   * 处理任务成功
   */
  private handleTaskSuccess(taskId: string): void {
    const record = this.retryRecords.get(taskId)
    if (record && record.currentAttempt > 0) {
      // 这是一个重试成功的任务
      this.stats.successfulRetries++

      globalEventBus.emit('retry:taskSucceededAfterRetry', {
        retryHandlerId: this.id,
        taskId,
        totalAttempts: record.currentAttempt,
        totalTime: Date.now() - record.startTime.getTime(),
      })
    }

    // 清理重试记录和待处理的重试
    this.cleanupRetryRecord(taskId)
  }

  /**
   * 判断是否应该重试任务
   */
  private shouldRetryTask(record: RetryRecord, error: Error): boolean {
    const { config, currentAttempt } = record

    // 检查最大重试次数
    if (currentAttempt >= config.maxRetries) {
      return false
    }

    // 调用自定义重试条件函数
    if (config.shouldRetry) {
      return config.shouldRetry(error, currentAttempt)
    }

    // 默认策略：非用户错误且未达到最大重试次数
    return !this.isUserError(error)
  }

  /**
   * 判断是否为用户错误（通常不应重试）
   */
  private isUserError(error: Error): boolean {
    const userErrorPatterns = [
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
      /bad request/i,
      /validation/i,
      /invalid/i,
    ]

    return userErrorPatterns.some(
      pattern => pattern.test(error.message) || pattern.test(error.name),
    )
  }

  /**
   * 计算重试延迟
   */
  private calculateRetryDelay(record: RetryRecord): number {
    const { config, currentAttempt } = record
    let delay: number

    switch (config.strategy) {
    case 'fixed':
      delay = config.baseDelay
      break

    case 'linear':
      delay = config.baseDelay * currentAttempt * config.multiplier
      break

    case 'exponential':
      delay =
          config.baseDelay * Math.pow(config.multiplier, currentAttempt - 1)
      break

    case 'custom':
      if (config.customDelayCalculator) {
        delay = config.customDelayCalculator(currentAttempt, config.baseDelay)
      } else {
        delay = config.baseDelay
      }
      break

    default:
      delay = config.baseDelay
      break
    }

    // 应用最大延迟限制
    delay = Math.min(delay, config.maxDelay)

    // 添加抖动
    if (config.jitter > 0) {
      const jitterAmount = delay * config.jitter
      const jitterOffset = (Math.random() - 0.5) * 2 * jitterAmount
      delay += jitterOffset
    }

    return Math.max(delay, 0)
  }

  /**
   * 调度重试任务
   */
  private async scheduleRetry(record: RetryRecord): Promise<void> {
    const delay = this.calculateRetryDelay(record)
    const nextRetryTime = new Date(Date.now() + delay)
    record.nextRetryTime = nextRetryTime

    this.stats.totalRetries++

    globalEventBus.emit('retry:taskScheduled', {
      retryHandlerId: this.id,
      taskId: record.taskId,
      attempt: record.currentAttempt,
      delay,
      nextRetryTime,
      strategy: record.config.strategy,
    })

    // 清理之前的重试定时器
    const existingTimeout = this.pendingRetries.get(record.taskId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // 设置新的重试定时器
    const timeoutId = setTimeout(async () => {
      if (!this.isDestroyed.value && this.retryRecords.has(record.taskId)) {
        await this.executeRetry(record)
      }
    }, delay)

    this.pendingRetries.set(record.taskId, timeoutId)
  }

  /**
   * 执行重试
   */
  private async executeRetry(record: RetryRecord): Promise<void> {
    try {
      globalEventBus.emit('retry:taskStarted', {
        retryHandlerId: this.id,
        taskId: record.taskId,
        attempt: record.currentAttempt,
        strategy: record.config.strategy,
      })

      // 创建重试任务的副本，更新元数据
      const retryTask: Task = {
        ...record.originalTask,
        metadata: {
          ...record.originalTask.metadata,
          isRetry: true,
          retryAttempt: record.currentAttempt,
          retryHandlerId: this.id,
        },
      }

      // 执行任务（这里假设有外部机制来执行任务）
      // 实际实现中可能需要与 TaskScheduler 或 TaskExecutor 集成
      const result = await retryTask.execute()

      // 任务成功，通过事件系统通知
      globalEventBus.emit('queue:taskCompleted', {
        taskId: record.taskId,
        result,
        task: retryTask,
      })
    } catch (error) {
      // 重试失败，通过事件系统通知
      globalEventBus.emit('queue:taskFailed', {
        taskId: record.taskId,
        error: error as Error,
        task: record.originalTask,
      })
    } finally {
      // 清理待处理的重试
      this.pendingRetries.delete(record.taskId)
    }
  }

  /**
   * 处理最终失败
   */
  private async handleFinalFailure(
    record: RetryRecord,
    finalError: Error,
  ): Promise<void> {
    this.stats.finalFailures++

    // 更新重试分布统计
    const attempts = record.currentAttempt
    const currentCount = this.stats.retryDistribution.get(attempts) || 0
    this.stats.retryDistribution.set(attempts, currentCount + 1)

    globalEventBus.emit('retry:taskFinallyFailed', {
      retryHandlerId: this.id,
      taskId: record.taskId,
      totalAttempts: record.currentAttempt,
      finalError,
      errorHistory: record.errorHistory,
      totalTime: Date.now() - record.startTime.getTime(),
    })

    // 发送到死信队列
    globalEventBus.emit('deadLetter:taskAdded', {
      task: record.originalTask,
      reason: 'max_retries_exceeded',
      errorHistory: record.errorHistory,
      finalError,
    })

    // 清理重试记录
    this.cleanupRetryRecord(record.taskId)
  }

  /**
   * 清理重试记录
   */
  private cleanupRetryRecord(taskId: string): void {
    // 清理待处理的重试
    const timeoutId = this.pendingRetries.get(taskId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.pendingRetries.delete(taskId)
    }

    // 清理重试记录
    this.retryRecords.delete(taskId)
  }

  /**
   * 合并重试配置
   */
  private mergeConfig(taskConfig?: Partial<RetryConfig>): RetryConfig {
    return { ...this.defaultConfig, ...taskConfig }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    // 计算平均重试次数
    let totalAttempts = 0
    let totalTasks = 0

    for (const [attempts, count] of this.stats.retryDistribution) {
      totalAttempts += attempts * count
      totalTasks += count
    }

    this.stats.averageRetries = totalTasks > 0 ? totalAttempts / totalTasks : 0
    this.stats.lastUpdated = new Date()
  }

  /**
   * 手动重试任务
   */
  async manualRetry(
    taskId: string,
    customConfig?: Partial<RetryConfig>,
  ): Promise<boolean> {
    const record = this.retryRecords.get(taskId)
    if (!record) {
      return false
    }

    // 更新配置
    if (customConfig) {
      record.config = { ...record.config, ...customConfig }
    }

    // 重置重试次数（可选）
    if (customConfig?.maxRetries !== undefined) {
      record.currentAttempt = 0
    }

    await this.scheduleRetry(record)
    return true
  }

  /**
   * 取消重试
   */
  cancelRetry(taskId: string): boolean {
    const record = this.retryRecords.get(taskId)
    if (!record) {
      return false
    }

    globalEventBus.emit('retry:taskCancelled', {
      retryHandlerId: this.id,
      taskId,
      attempt: record.currentAttempt,
    })

    this.cleanupRetryRecord(taskId)
    return true
  }

  /**
   * 获取重试记录
   */
  getRetryRecord(taskId: string): RetryRecord | null {
    return this.retryRecords.get(taskId) || null
  }

  /**
   * 获取所有重试记录
   */
  getAllRetryRecords(): Map<string, RetryRecord> {
    return new Map(this.retryRecords)
  }

  /**
   * 获取统计信息
   */
  getStats(): RetryStats {
    return {
      ...this.stats,
      retryDistribution: new Map(this.stats.retryDistribution),
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats.totalRetries = 0
    this.stats.successfulRetries = 0
    this.stats.finalFailures = 0
    this.stats.averageRetries = 0
    this.stats.retryDistribution.clear()
    this.stats.lastUpdated = new Date()

    globalEventBus.emit('retry:statsReset', {
      retryHandlerId: this.id,
    })
  }

  /**
   * 获取配置信息
   */
  getConfig(): RetryConfig {
    return { ...this.defaultConfig }
  }

  /**
   * 更新默认配置
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config }

    globalEventBus.emit('retry:configUpdated', {
      retryHandlerId: this.id,
      config: this.defaultConfig,
    })
  }

  /**
   * 销毁重试处理器
   */
  destroy(): void {
    if (this.isDestroyed.value) {
      return
    }

    this.isDestroyed.value = true

    // 清理所有待处理的重试
    for (const [taskId] of this.retryRecords) {
      this.cleanupRetryRecord(taskId)
    }

    this.retryRecords.clear()

    globalEventBus.emit('retry:handlerDestroyed', {
      retryHandlerId: this.id,
    })
  }
}

export default RetryHandler
