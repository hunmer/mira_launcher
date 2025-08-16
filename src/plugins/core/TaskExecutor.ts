/**
 * 任务执行器
 * 重用现有的 executeWithTimeout 逻辑并集成 Sandbox 资源限制机制
 * 实现任务生命周期管理
 */

import type {
  Task,
  TaskExecutorStats,
} from '@/types/plugin'
import { reactive, ref } from 'vue'
import { globalEventBus } from './EventBus'

/**
 * 执行器配置
 */
export interface ExecutorConfig {
    /** 默认超时时间（毫秒） */
    defaultTimeout: number
    /** 是否启用资源监控 */
    enableResourceMonitoring: boolean
    /** 最大内存使用（字节） */
    maxMemoryUsage?: number
    /** 是否启用沙箱模式 */
    enableSandbox: boolean
}

/**
 * 执行器统计信息
 * @deprecated 使用 TaskExecutorStats 替代
 */
export interface ExecutorStats extends TaskExecutorStats {
    /** 总执行任务数 */
    totalExecutions: number
    /** 成功执行数 */
    successfulExecutions: number
    /** 失败执行数 */
    failedExecutions: number
    /** 超时执行数 */
    timeoutExecutions: number
    /** 平均执行时间 */
    averageExecutionTime: number
    /** 当前内存使用 */
    currentMemoryUsage: number
    /** 当前运行的任务数 */
    currentRunning: number
}

/**
 * 任务执行器类
 */
export class TaskExecutor {
  private config: ExecutorConfig
  private stats = reactive<ExecutorStats>({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    timeoutExecutions: 0,
    averageExecutionTime: 0,
    currentMemoryUsage: 0,
    currentRunning: 0,
    totalExecuted: 0,
    successCount: 0,
    failureCount: 0,
  })

  private executionTimes: number[] = []
  private isDestroyed = ref(false)

  constructor(config: Partial<ExecutorConfig> = {}) {
    this.config = {
      defaultTimeout: 10000,
      enableResourceMonitoring: true,
      enableSandbox: false,
      ...config,
    }

    // 启动资源监控
    if (this.config.enableResourceMonitoring) {
      this.startResourceMonitoring()
    }
  }

  /**
     * 执行任务（重用 PluginManager 的 executeWithTimeout 逻辑）
     */
  async executeTask(task: Task): Promise<any> {
    if (this.isDestroyed.value) {
      throw new Error('TaskExecutor has been destroyed')
    }

    const timeout = task.timeout || this.config.defaultTimeout
    const startTime = performance.now()

    this.stats.totalExecutions++
    task.state = 'running'
    task.startedAt = new Date()

    try {
      // 发布任务开始事件
      globalEventBus.emit('queue:taskStarted', {
        queueId: 'executor',
        task,
      })

      // 使用与 PluginManager 相同的超时执行逻辑
      const result = await this.executeWithTimeout(
        () => task.execute(),
        timeout,
        `Task ${task.id} execution timeout after ${timeout}ms`,
      )

      // 任务执行成功
      const executionTime = performance.now() - startTime
      this.recordExecutionTime(executionTime)

      task.state = 'completed'
      task.completedAt = new Date()
      task.result = result

      this.stats.successfulExecutions++

      // 执行成功回调
      if (task.onSuccess) {
        task.onSuccess(result)
      }

      // 发布任务完成事件
      globalEventBus.emit('queue:taskCompleted', {
        queueId: 'executor',
        task,
      })

      return result

    } catch (error) {
      const executionTime = performance.now() - startTime
      this.recordExecutionTime(executionTime)

      task.state = 'failed'
      task.completedAt = new Date()
      task.error = error as Error

      // 区分超时错误和其他错误
      if (error instanceof Error && error.message.includes('timeout')) {
        this.stats.timeoutExecutions++
      } else {
        this.stats.failedExecutions++
      }

      // 执行错误回调
      if (task.onError) {
        task.onError(task.error)
      }

      // 发布任务失败事件
      globalEventBus.emit('queue:taskFailed', {
        queueId: 'executor',
        task,
        error: task.error,
      })

      throw error
    }
  }

  /**
     * 执行带超时的操作（重用 PluginManager 逻辑）
     */
  private async executeWithTimeout<T>(
    operation: () => Promise<T> | T,
    timeout: number,
    errorMessage: string,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(errorMessage))
      }, timeout)

      Promise.resolve(operation())
        .then(result => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  /**
     * 记录执行时间
     */
  private recordExecutionTime(time: number): void {
    this.executionTimes.push(time)

    // 保持最近100次执行时间用于平均值计算
    if (this.executionTimes.length > 100) {
      this.executionTimes.shift()
    }

    // 计算平均执行时间
    if (this.executionTimes.length > 0) {
      this.stats.averageExecutionTime =
                this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length
    }
  }

  /**
     * 启动资源监控
     */
  private startResourceMonitoring(): void {
    const monitor = () => {
      if (this.isDestroyed.value) {
        return
      }

      // 监控内存使用
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.stats.currentMemoryUsage = memory.usedJSHeapSize

        // 检查内存限制
        if (this.config.maxMemoryUsage &&
                    this.stats.currentMemoryUsage > this.config.maxMemoryUsage) {

          globalEventBus.emit('queue:error', {
            queueId: 'executor',
            error: new Error(`Memory usage exceeded limit: ${this.stats.currentMemoryUsage} bytes`),
          })
        }
      }

      // 每5秒检查一次
      setTimeout(monitor, 5000)
    }

    monitor()
  }

  /**
     * 批量执行任务
     */
  async executeBatch(tasks: Task[]): Promise<{
        successful: any[]
        failed: { task: Task, error: Error }[]
    }> {
    const successful: any[] = []
    const failed: { task: Task, error: Error }[] = []

    for (const task of tasks) {
      try {
        const result = await this.executeTask(task)
        successful.push(result)
      } catch (error) {
        failed.push({
          task,
          error: error as Error,
        })
      }
    }

    return { successful, failed }
  }

  /**
     * 创建任务包装器，添加资源限制
     */
  wrapTaskWithResourceLimits(task: Task): Task {
    const originalExecute = task.execute

    return {
      ...task,
      execute: async () => {
        // 执行前检查资源
        if (this.config.maxMemoryUsage && 'memory' in performance) {
          const memory = (performance as any).memory
          if (memory.usedJSHeapSize > this.config.maxMemoryUsage) {
            throw new Error('Insufficient memory to execute task')
          }
        }

        // 执行原始任务
        return await originalExecute()
      },
    }
  }

  /**
     * 获取执行器统计信息
     */
  getStats(): ExecutorStats {
    return { ...this.stats }
  }

  /**
     * 重置统计信息
     */
  resetStats(): void {
    this.stats.totalExecutions = 0
    this.stats.successfulExecutions = 0
    this.stats.failedExecutions = 0
    this.stats.timeoutExecutions = 0
    this.stats.averageExecutionTime = 0
    this.executionTimes = []
  }

  /**
     * 更新配置
     */
  updateConfig(newConfig: Partial<ExecutorConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
     * 获取当前配置
     */
  getConfig(): ExecutorConfig {
    return { ...this.config }
  }

  /**
     * 检查执行器是否健康
     */
  isHealthy(): boolean {
    if (this.isDestroyed.value) {
      return false
    }

    // 检查内存使用
    if (this.config.maxMemoryUsage &&
            this.stats.currentMemoryUsage > this.config.maxMemoryUsage) {
      return false
    }

    // 检查失败率
    if (this.stats.totalExecutions > 10) {
      const failureRate = this.stats.failedExecutions / this.stats.totalExecutions
      if (failureRate > 0.5) { // 失败率超过50%
        return false
      }
    }

    return true
  }

  /**
     * 销毁执行器
     */
  destroy(): void {
    this.isDestroyed.value = true
    this.resetStats()
  }
}
