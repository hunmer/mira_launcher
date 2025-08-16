/**
 * 队列工厂和具体实现
 * 实现 FIFO、优先级、延迟、循环四种队列类型
 */

import type { QueueConfig, QueueType, Task } from '@/types/plugin'
import { BaseQueue } from './BaseQueue'

/**
 * FIFO 队列实现
 */
export class FIFOQueue extends BaseQueue {
  constructor(id: string, config: QueueConfig = {}) {
    super(id, 'fifo', config)
  }

  protected addTaskToQueue(job: Function, task: Task): void {
    // FIFO 队列直接按顺序添加
    this.queue.push(job as any)
  }
}

/**
 * 优先级队列实现
 */
export class PriorityQueue extends BaseQueue {
  constructor(id: string, config: QueueConfig = {}) {
    super(id, 'priority', config)
  }

  protected addTaskToQueue(job: Function, task: Task): void {
    // 根据优先级插入到正确位置
    const queueArray = this.queue as any
    const priority = task.priority || 0

    // 找到插入位置（优先级高的在前面）
    let insertIndex = queueArray.length
    for (let i = 0; i < queueArray.length; i++) {
      const existingTask = this.findTaskByIndex(i)
      if (existingTask && (existingTask.priority || 0) < priority) {
        insertIndex = i
        break
      }
    }

    // 使用 splice 在指定位置插入
    queueArray.splice(insertIndex, 0, job as any)
  }

  private findTaskByIndex(index: number): Task | undefined {
    const tasks = Array.from(this.tasks.values())
    return tasks[index]
  }
}

/**
 * 延迟队列实现
 */
export class DelayedQueue extends BaseQueue {
  private delayedTasks = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(id: string, config: QueueConfig = {}) {
    super(id, 'delayed', config)
  }

  protected addTaskToQueue(job: Function, task: Task): void {
    const delay = (task.metadata?.['delay'] as number) || 0

    if (delay > 0) {
      // 延迟添加到队列
      const timeoutId = setTimeout(() => {
        this.queue.push(job as any)
        this.delayedTasks.delete(task.id)
      }, delay)

      this.delayedTasks.set(task.id, timeoutId)
    } else {
      // 立即添加
      this.queue.push(job as any)
    }
  }

  override cancelTask(taskId: string): boolean {
    // 取消延迟任务
    const timeoutId = this.delayedTasks.get(taskId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.delayedTasks.delete(taskId)
    }

    return super.cancelTask(taskId)
  }

  override destroy(): void {
    // 清理所有延迟任务
    for (const timeoutId of this.delayedTasks.values()) {
      clearTimeout(timeoutId)
    }
    this.delayedTasks.clear()

    super.destroy()
  }
}

/**
 * 循环队列实现
 */
export class CircularQueue extends BaseQueue {
  private maxSize: number
  private currentIndex = 0

  constructor(id: string, config: QueueConfig & { maxSize?: number } = {}) {
    super(id, 'circular', config)
    this.maxSize = config.maxSize || 100
  }

  protected addTaskToQueue(job: Function, task: Task): void {
    const queueArray = this.queue as any

    if (queueArray.length >= this.maxSize) {
      // 队列已满，移除最老的任务
      const removedJob = queueArray.shift()

      // 找到并标记被移除的任务
      const removedTask = this.findTaskByJobInCircular(removedJob)
      if (removedTask) {
        removedTask.state = 'cancelled'
        this.updateStatsInCircular()
      }
    }

    // 添加新任务
    this.queue.push(job as any)
  }

  /**
     * 获取队列使用率
     */
  getUtilization(): number {
    return this.queue.length / this.maxSize
  }

  /**
     * 设置最大队列大小
     */
  setMaxSize(newSize: number): void {
    this.maxSize = newSize

    // 如果当前队列超过新大小，移除多余的任务
    const queueArray = this.queue as any
    while (queueArray.length > newSize) {
      const removedJob = queueArray.shift()
      const removedTask = this.findTaskByJobInCircular(removedJob)
      if (removedTask) {
        removedTask.state = 'cancelled'
      }
    }

    this.updateStatsInCircular()
  }

  private findTaskByJobInCircular(job: Function): Task | undefined {
    for (const task of this.tasks.values()) {
      if ((task as any).__job === job) {
        return task
      }
    }
    return undefined
  }

  private updateStatsInCircular(): void {
    // 重新计算统计信息的方法需要从父类访问
    // 这里调用父类的私有方法（通过类型断言）
    (this as any).updateStats()
  }
}

/**
 * 队列工厂类
 */
export class QueueFactory {
  private static queues = new Map<string, BaseQueue>()

  /**
     * 创建队列
     */
  static createQueue(
    id: string,
    type: QueueType,
    config: QueueConfig = {},
  ): BaseQueue {
    // 如果队列已存在，先销毁
    const existingQueue = this.queues.get(id)
    if (existingQueue) {
      existingQueue.destroy()
    }

    let queue: BaseQueue

    switch (type) {
    case 'fifo':
      queue = new FIFOQueue(id, config)
      break
    case 'priority':
      queue = new PriorityQueue(id, config)
      break
    case 'delayed':
      queue = new DelayedQueue(id, config)
      break
    case 'circular':
      queue = new CircularQueue(id, config)
      break
    default:
      throw new Error(`Unsupported queue type: ${type}`)
    }

    this.queues.set(id, queue)
    return queue
  }

  /**
     * 获取队列
     */
  static getQueue(id: string): BaseQueue | undefined {
    return this.queues.get(id)
  }

  /**
     * 销毁队列
     */
  static destroyQueue(id: string): boolean {
    const queue = this.queues.get(id)
    if (queue) {
      queue.destroy()
      this.queues.delete(id)
      return true
    }
    return false
  }

  /**
     * 获取所有队列
     */
  static getAllQueues(): BaseQueue[] {
    return Array.from(this.queues.values())
  }

  /**
     * 销毁所有队列
     */
  static destroyAllQueues(): void {
    for (const queue of this.queues.values()) {
      queue.destroy()
    }
    this.queues.clear()
  }

  /**
     * 获取队列统计信息
     */
  static getGlobalStats() {
    const stats = {
      totalQueues: this.queues.size,
      totalTasks: 0,
      totalPendingTasks: 0,
      totalRunningTasks: 0,
      totalCompletedTasks: 0,
      totalFailedTasks: 0,
      averageExecutionTime: 0,
      totalThroughput: 0,
    }

    let totalExecutionTime = 0
    let taskCountForAverage = 0

    for (const queue of this.queues.values()) {
      const queueStats = queue.getStats()
      stats.totalTasks += queueStats.totalTasks
      stats.totalPendingTasks += queueStats.pendingTasks
      stats.totalRunningTasks += queueStats.runningTasks
      stats.totalCompletedTasks += queueStats.completedTasks
      stats.totalFailedTasks += queueStats.failedTasks
      stats.totalThroughput += queueStats.throughput

      if (queueStats.completedTasks > 0) {
        totalExecutionTime += queueStats.averageExecutionTime * queueStats.completedTasks
        taskCountForAverage += queueStats.completedTasks
      }
    }

    // 计算全局平均执行时间
    if (taskCountForAverage > 0) {
      stats.averageExecutionTime = totalExecutionTime / taskCountForAverage
    }

    return stats
  }
}
