/**
 * 死信队列处理器
 * 收集重试失败的任务，提供持久化存储和重处理功能
 * 与现有错误处理和事件系统集成
 */

import type { Task } from '@/types/plugin'
import { reactive, ref } from 'vue'
import { globalEventBus } from './EventBus'

/**
 * 死信任务信息
 */
export interface DeadLetterTask {
  /** 原始任务 */
  task: Task
  /** 失败原因 */
  reason: DeadLetterReason
  /** 错误历史 */
  errorHistory: Array<{
    attempt: number
    error: Error
    timestamp: Date
  }>
  /** 最终错误 */
  finalError: Error
  /** 添加到死信队列的时间 */
  addedAt: Date
  /** 失败分类 */
  category: ErrorCategory
  /** 是否可重处理 */
  canReprocess: boolean
  /** 重处理次数 */
  reprocessCount: number
  /** 最后重处理时间 */
  lastReprocessAt?: Date
}

/**
 * 死信原因
 */
export type DeadLetterReason =
  | 'max_retries_exceeded' // 超过最大重试次数
  | 'timeout' // 超时
  | 'system_error' // 系统错误
  | 'user_error' // 用户错误
  | 'resource_exhausted' // 资源耗尽
  | 'validation_failed' // 验证失败
  | 'dependency_failed' // 依赖失败
  | 'manual_termination' // 手动终止

/**
 * 错误分类
 */
export type ErrorCategory =
  | 'temporary' // 临时性错误，可能重试成功
  | 'permanent' // 永久性错误，重试无意义
  | 'unknown' // 未知错误类型

/**
 * 死信队列统计信息
 */
export interface DeadLetterStats {
  /** 总任务数 */
  totalTasks: number
  /** 按原因分组的统计 */
  reasonStats: Map<DeadLetterReason, number>
  /** 按分类分组的统计 */
  categoryStats: Map<ErrorCategory, number>
  /** 可重处理的任务数 */
  reprocessableTasks: number
  /** 重处理成功率 */
  reprocessSuccessRate: number
  /** 平均在队列中的时间 */
  averageQueueTime: number
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * 死信队列配置
 */
export interface DeadLetterConfig {
  /** 最大队列大小 */
  maxQueueSize: number
  /** 自动清理时间（毫秒） */
  autoCleanupAge: number
  /** 是否启用持久化 */
  enablePersistence: boolean
  /** 持久化键名 */
  persistenceKey: string
  /** 是否启用自动分析 */
  enableAutoAnalysis: boolean
  /** 分析间隔（毫秒） */
  analysisInterval: number
}

/**
 * 死信队列处理器
 */
export class DeadLetterQueue {
  private tasks = reactive(new Map<string, DeadLetterTask>())
  private stats = reactive<DeadLetterStats>({
    totalTasks: 0,
    reasonStats: new Map(),
    categoryStats: new Map(),
    reprocessableTasks: 0,
    reprocessSuccessRate: 0,
    averageQueueTime: 0,
    lastUpdated: new Date(),
  })

  private config: DeadLetterConfig
  private cleanupInterval: number | null = null
  private analysisInterval: number | null = null
  private isDestroyed = ref(false)

  public readonly id: string

  constructor(id: string, config?: Partial<DeadLetterConfig>) {
    this.id = id
    this.config = {
      maxQueueSize: 1000,
      autoCleanupAge: 7 * 24 * 60 * 60 * 1000, // 7天
      enablePersistence: true,
      persistenceKey: `deadLetterQueue_${id}`,
      enableAutoAnalysis: true,
      analysisInterval: 30 * 60 * 1000, // 30分钟
      ...config,
    }

    this.initialize()
  }

  /**
   * 初始化死信队列
   */
  private initialize(): void {
    this.setupEventListeners()
    this.loadPersistedTasks()
    this.startCleanupTimer()

    if (this.config.enableAutoAnalysis) {
      this.startAnalysisTimer()
    }

    globalEventBus.emit('deadLetter:queueInitialized', {
      queueId: this.id,
      config: this.config,
    })
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听死信任务添加事件
    globalEventBus.on('deadLetter:taskAdded', event => {
      const data = event.data as any
      this.addTask(data.task, data.reason, data.errorHistory, data.finalError)
    })

    // 监听重试成功事件
    globalEventBus.on('retry:taskSucceededAfterRetry', event => {
      const data = event.data as any
      this.handleReprocessSuccess(data.taskId)
    })
  }

  /**
   * 添加任务到死信队列
   */
  addTask(
    task: Task,
    reason: DeadLetterReason,
    errorHistory: Array<{ attempt: number; error: Error; timestamp: Date }>,
    finalError: Error,
  ): void {
    // 检查队列大小限制
    if (this.tasks.size >= this.config.maxQueueSize) {
      this.removeOldestTask()
    }

    const category = this.categorizeError(finalError, reason)
    const canReprocess = this.determineReprocessability(reason, category)

    const deadLetterTask: DeadLetterTask = {
      task,
      reason,
      errorHistory,
      finalError,
      addedAt: new Date(),
      category,
      canReprocess,
      reprocessCount: 0,
    }

    this.tasks.set(task.id, deadLetterTask)
    this.updateStats()
    this.persistTasks()

    globalEventBus.emit('deadLetter:taskAdded', {
      queueId: this.id,
      taskId: task.id,
      reason,
      category,
      canReprocess,
    })
  }

  /**
   * 错误分类
   */
  private categorizeError(
    error: Error,
    reason: DeadLetterReason,
  ): ErrorCategory {
    // 基于错误信息和原因判断错误类型
    const temporaryPatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /rate limit/i,
      /service unavailable/i,
      /internal server error/i,
    ]

    const permanentPatterns = [
      /not found/i,
      /unauthorized/i,
      /forbidden/i,
      /bad request/i,
      /validation/i,
      /invalid/i,
    ]

    const errorMessage = error.message.toLowerCase()

    if (reason === 'user_error' || reason === 'validation_failed') {
      return 'permanent'
    }

    if (reason === 'timeout' || reason === 'resource_exhausted') {
      return 'temporary'
    }

    // 基于错误消息模式匹配
    if (temporaryPatterns.some(pattern => pattern.test(errorMessage))) {
      return 'temporary'
    }

    if (permanentPatterns.some(pattern => pattern.test(errorMessage))) {
      return 'permanent'
    }

    return 'unknown'
  }

  /**
   * 判断任务是否可重处理
   */
  private determineReprocessability(
    reason: DeadLetterReason,
    category: ErrorCategory,
  ): boolean {
    // 永久性错误通常不可重处理
    if (category === 'permanent') {
      return false
    }

    // 基于失败原因判断
    const nonReprocessableReasons: DeadLetterReason[] = [
      'user_error',
      'validation_failed',
      'manual_termination',
    ]

    return !nonReprocessableReasons.includes(reason)
  }

  /**
   * 移除最旧的任务
   */
  private removeOldestTask(): void {
    let oldestTaskId: string | null = null
    let oldestTime = Date.now()

    for (const [taskId, task] of this.tasks) {
      if (task.addedAt.getTime() < oldestTime) {
        oldestTime = task.addedAt.getTime()
        oldestTaskId = taskId
      }
    }

    if (oldestTaskId) {
      this.tasks.delete(oldestTaskId)
    }
  }

  /**
   * 重处理任务
   */
  async reprocessTask(taskId: string): Promise<boolean> {
    const deadLetterTask = this.tasks.get(taskId)
    if (!deadLetterTask || !deadLetterTask.canReprocess) {
      return false
    }

    deadLetterTask.reprocessCount++
    deadLetterTask.lastReprocessAt = new Date()

    try {
      // 重新提交任务到队列系统
      globalEventBus.emit('queue:taskAdded', {
        task: {
          ...deadLetterTask.task,
          metadata: {
            ...deadLetterTask.task.metadata,
            isReprocessed: true,
            reprocessCount: deadLetterTask.reprocessCount,
            originalFailureReason: deadLetterTask.reason,
          },
        },
      })

      globalEventBus.emit('deadLetter:taskReprocessed', {
        queueId: this.id,
        taskId,
        reprocessCount: deadLetterTask.reprocessCount,
      })

      return true
    } catch (error) {
      globalEventBus.emit('deadLetter:reprocessFailed', {
        queueId: this.id,
        taskId,
        error: error as Error,
      })

      return false
    }
  }

  /**
   * 批量重处理任务
   */
  async reprocessByCategory(category: ErrorCategory): Promise<number> {
    let reprocessedCount = 0

    for (const [taskId, task] of this.tasks) {
      if (task.category === category && task.canReprocess) {
        const success = await this.reprocessTask(taskId)
        if (success) {
          reprocessedCount++
        }
      }
    }

    globalEventBus.emit('deadLetter:batchReprocessed', {
      queueId: this.id,
      category,
      count: reprocessedCount,
    })

    return reprocessedCount
  }

  /**
   * 处理重处理成功
   */
  private handleReprocessSuccess(taskId: string): void {
    const deadLetterTask = this.tasks.get(taskId)
    if (deadLetterTask) {
      // 从死信队列中移除成功重处理的任务
      this.tasks.delete(taskId)
      this.updateStats()
      this.persistTasks()

      globalEventBus.emit('deadLetter:taskRecovered', {
        queueId: this.id,
        taskId,
        reprocessCount: deadLetterTask.reprocessCount,
      })
    }
  }

  /**
   * 清理过期任务
   */
  private cleanupExpiredTasks(): void {
    const now = Date.now()
    const expiredTasks: string[] = []

    for (const [taskId, task] of this.tasks) {
      if (now - task.addedAt.getTime() > this.config.autoCleanupAge) {
        expiredTasks.push(taskId)
      }
    }

    for (const taskId of expiredTasks) {
      this.tasks.delete(taskId)
    }

    if (expiredTasks.length > 0) {
      this.updateStats()
      this.persistTasks()

      globalEventBus.emit('deadLetter:tasksExpired', {
        queueId: this.id,
        count: expiredTasks.length,
      })
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = window.setInterval(
      () => {
        this.cleanupExpiredTasks()
      },
      60 * 60 * 1000,
    ) // 每小时检查一次
  }

  /**
   * 启动分析定时器
   */
  private startAnalysisTimer(): void {
    this.analysisInterval = window.setInterval(() => {
      this.performAnalysis()
    }, this.config.analysisInterval)
  }

  /**
   * 执行错误分析
   */
  private performAnalysis(): void {
    const analysis = this.analyzeErrorPatterns()

    globalEventBus.emit('deadLetter:analysisCompleted', {
      queueId: this.id,
      analysis,
      timestamp: new Date(),
    })
  }

  /**
   * 分析错误模式
   */
  private analyzeErrorPatterns(): {
    commonErrors: Array<{ error: string; count: number }>
    errorTrends: Array<{
      category: ErrorCategory
      trend: 'increasing' | 'decreasing' | 'stable'
    }>
    recommendations: string[]
    } {
    const errorCounts = new Map<string, number>()
    const categoryTrends = new Map<ErrorCategory, number[]>()

    // 统计错误类型
    for (const task of this.tasks.values()) {
      const errorType = task.finalError.name || 'UnknownError'
      errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1)
    }

    // 获取最常见的错误
    const commonErrors = Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }))

    // 简化的趋势分析（实际应用中需要历史数据）
    const errorTrends: Array<{
      category: ErrorCategory
      trend: 'increasing' | 'decreasing' | 'stable'
    }> = Array.from(this.stats.categoryStats.entries()).map(
      ([category, count]) => {
        const trend: 'increasing' | 'decreasing' | 'stable' =
          count > 10 ? 'increasing' : count < 5 ? 'decreasing' : 'stable'
        return { category, trend }
      },
    )

    // 生成建议
    const recommendations = this.generateRecommendations(
      commonErrors,
      errorTrends,
    )

    return {
      commonErrors,
      errorTrends,
      recommendations,
    }
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    commonErrors: Array<{ error: string; count: number }>,
    errorTrends: Array<{
      category: ErrorCategory
      trend: 'increasing' | 'decreasing' | 'stable'
    }>,
  ): string[] {
    const recommendations: string[] = []

    // 基于常见错误生成建议
    for (const { error, count } of commonErrors) {
      if (count > 10) {
        if (error.toLowerCase().includes('timeout')) {
          recommendations.push('考虑增加任务超时时间或优化任务执行逻辑')
        } else if (error.toLowerCase().includes('network')) {
          recommendations.push('检查网络连接稳定性，考虑增加网络重试机制')
        } else if (error.toLowerCase().includes('memory')) {
          recommendations.push('优化内存使用，考虑增加系统内存或优化算法')
        }
      }
    }

    // 基于趋势生成建议
    const increasingCategories = errorTrends.filter(
      t => t.trend === 'increasing',
    )
    if (increasingCategories.length > 0) {
      recommendations.push('检测到错误率上升趋势，建议进行系统健康检查')
    }

    if (this.stats.reprocessSuccessRate < 0.5) {
      recommendations.push('重处理成功率较低，建议改进错误分类和重试策略')
    }

    return recommendations
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.totalTasks = this.tasks.size

    // 重置统计
    this.stats.reasonStats.clear()
    this.stats.categoryStats.clear()
    let reprocessableCount = 0
    let totalQueueTime = 0

    // 重新计算统计
    for (const task of this.tasks.values()) {
      // 按原因统计
      const reasonCount = this.stats.reasonStats.get(task.reason) || 0
      this.stats.reasonStats.set(task.reason, reasonCount + 1)

      // 按分类统计
      const categoryCount = this.stats.categoryStats.get(task.category) || 0
      this.stats.categoryStats.set(task.category, categoryCount + 1)

      // 可重处理任务计数
      if (task.canReprocess) {
        reprocessableCount++
      }

      // 平均队列时间
      totalQueueTime += Date.now() - task.addedAt.getTime()
    }

    this.stats.reprocessableTasks = reprocessableCount
    this.stats.averageQueueTime =
      this.tasks.size > 0 ? totalQueueTime / this.tasks.size : 0
    this.stats.lastUpdated = new Date()
  }

  /**
   * 持久化任务
   */
  private persistTasks(): void {
    if (!this.config.enablePersistence) {
      return
    }

    try {
      const data = Array.from(this.tasks.entries()).map(([id, task]) => ({
        id,
        task: {
          ...task,
          addedAt: task.addedAt.toISOString(),
          lastReprocessAt: task.lastReprocessAt?.toISOString(),
          errorHistory: task.errorHistory.map(e => ({
            ...e,
            timestamp: e.timestamp.toISOString(),
            error: {
              name: e.error.name,
              message: e.error.message,
              stack: e.error.stack,
            },
          })),
          finalError: {
            name: task.finalError.name,
            message: task.finalError.message,
            stack: task.finalError.stack,
          },
        },
      }))

      localStorage.setItem(this.config.persistenceKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist dead letter tasks:', error)
    }
  }

  /**
   * 加载持久化的任务
   */
  private loadPersistedTasks(): void {
    if (!this.config.enablePersistence) {
      return
    }

    try {
      const data = localStorage.getItem(this.config.persistenceKey)
      if (!data) {
        return
      }

      const persistedTasks = JSON.parse(data)
      for (const { id, task } of persistedTasks) {
        // 重建错误对象和日期对象
        const reconstitutedTask: DeadLetterTask = {
          ...task,
          addedAt: new Date(task.addedAt),
          lastReprocessAt: task.lastReprocessAt
            ? new Date(task.lastReprocessAt)
            : undefined,
          errorHistory: task.errorHistory.map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp),
            error: new Error(e.error.message),
          })),
          finalError: new Error(task.finalError.message),
        }

        this.tasks.set(id, reconstitutedTask)
      }

      this.updateStats()
    } catch (error) {
      console.warn('Failed to load persisted dead letter tasks:', error)
    }
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): DeadLetterTask | null {
    return this.tasks.get(taskId) || null
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): Map<string, DeadLetterTask> {
    return new Map(this.tasks)
  }

  /**
   * 按条件筛选任务
   */
  filterTasks(filter: {
    reason?: DeadLetterReason
    category?: ErrorCategory
    canReprocess?: boolean
    addedAfter?: Date
    addedBefore?: Date
  }): DeadLetterTask[] {
    const results: DeadLetterTask[] = []

    for (const task of this.tasks.values()) {
      if (filter.reason && task.reason !== filter.reason) continue
      if (filter.category && task.category !== filter.category) continue
      if (
        filter.canReprocess !== undefined &&
        task.canReprocess !== filter.canReprocess
      )
        continue
      if (filter.addedAfter && task.addedAt < filter.addedAfter) continue
      if (filter.addedBefore && task.addedAt > filter.addedBefore) continue

      results.push(task)
    }

    return results
  }

  /**
   * 清空队列
   */
  clear(): void {
    const taskCount = this.tasks.size
    this.tasks.clear()
    this.updateStats()
    this.persistTasks()

    globalEventBus.emit('deadLetter:queueCleared', {
      queueId: this.id,
      removedCount: taskCount,
    })
  }

  /**
   * 获取统计信息
   */
  getStats(): DeadLetterStats {
    return {
      ...this.stats,
      reasonStats: new Map(this.stats.reasonStats),
      categoryStats: new Map(this.stats.categoryStats),
    }
  }

  /**
   * 获取配置
   */
  getConfig(): DeadLetterConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<DeadLetterConfig>): void {
    this.config = { ...this.config, ...config }

    globalEventBus.emit('deadLetter:configUpdated', {
      queueId: this.id,
      config: this.config,
    })
  }

  /**
   * 销毁死信队列
   */
  destroy(): void {
    if (this.isDestroyed.value) {
      return
    }

    this.isDestroyed.value = true

    // 清理定时器
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
      this.analysisInterval = null
    }

    // 最后一次持久化
    this.persistTasks()

    globalEventBus.emit('deadLetter:queueDestroyed', {
      queueId: this.id,
    })
  }
}

export default DeadLetterQueue
