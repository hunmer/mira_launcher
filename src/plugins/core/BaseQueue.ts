/**
 * 基础队列抽象类
 * 封装第三方 'queue' 模块，提供统一的任务队列接口
 * 集成现有的 EventBus 和性能监控系统
 */

import type {
  ITaskQueue,
  QueueConfig,
  QueueStats,
  QueueType,
  Task,
} from '@/types/plugin'
import Queue from 'queue'
import { reactive } from 'vue'
import { globalEventBus } from './EventBus'

/**
 * 队列事件数据接口
 */
export interface QueueEventData {
    queueId: string
    task?: Task
    stats?: QueueStats
    error?: Error
}

/**
 * 基础队列抽象类
 */
export abstract class BaseQueue implements ITaskQueue {
  protected queue: Queue
  protected tasks = reactive(new Map<string, Task>())
  protected stats = reactive({
    totalTasks: 0,
    pendingTasks: 0,
    runningTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageExecutionTime: 0,
    throughput: 0,
  })

  private executionTimes: number[] = []
  private startTime: number = Date.now()

  public readonly id: string
  public readonly type: QueueType

  constructor(
    id: string,
    type: QueueType,
    config: QueueConfig = {},
  ) {
    this.id = id
    this.type = type

    // 创建第三方 queue 实例
    // 初始化第三方队列，封装其功能
    const queueOptions: any = {
      concurrency: config.concurrency || 1,
      autostart: config.autostart || false,
      timeout: config.timeout || 10000,
    }

    // 只有在明确需要收集结果时才设置 results 数组
    if (config.results) {
      queueOptions.results = []
    }

    this.queue = new Queue(queueOptions)

    this.setupEventListeners()
  }

  /**
     * 设置事件监听器
     */
  private setupEventListeners(): void {
    this.queue.addEventListener('start', (e: any) => {
      const task = this.findTaskByJob(e.detail.job)
      if (task) {
        task.state = 'running'
        task.startedAt = new Date()
        this.updateStats()

        globalEventBus.emit('queue:taskStarted', {
          queueId: this.id,
          task,
        })
      }
    })

    this.queue.addEventListener('success', (e: any) => {
      const task = this.findTaskByJob(e.detail.job)
      if (task) {
        task.state = 'completed'
        task.completedAt = new Date()
        task.result = e.detail.result

        // 记录执行时间
        if (task.startedAt) {
          const executionTime = task.completedAt.getTime() - task.startedAt.getTime()
          this.executionTimes.push(executionTime)

          // 保持最近100次执行时间用于平均值计算
          if (this.executionTimes.length > 100) {
            this.executionTimes.shift()
          }
        }

        this.updateStats()

        // 执行成功回调
        if (task.onSuccess) {
          task.onSuccess(task.result)
        }

        globalEventBus.emit('queue:taskCompleted', {
          queueId: this.id,
          task,
        })
      }
    })

    this.queue.addEventListener('error', (e: any) => {
      const task = this.findTaskByJob(e.detail.job)
      if (task) {
        task.state = 'failed'
        task.completedAt = new Date()
        task.error = e.detail.err

        this.updateStats()

        // 执行错误回调
        if (task.onError && task.error) {
          task.onError(task.error)
        }

        globalEventBus.emit('queue:taskFailed', {
          queueId: this.id,
          task,
          error: task.error,
        })
      }
    })

    this.queue.addEventListener('timeout', (e: any) => {
      const task = this.findTaskByJob(e.detail.job)
      if (task) {
        task.state = 'failed'
        task.completedAt = new Date()
        task.error = new Error('Task timeout')

        this.updateStats()

        globalEventBus.emit('queue:taskFailed', {
          queueId: this.id,
          task,
          error: task.error,
        })
      }
    })

    this.queue.addEventListener('end', () => {
      globalEventBus.emit('queue:stateChanged', {
        queueId: this.id,
        stats: this.getStats(),
      })
    })
  }

  /**
     * 根据 job 查找对应的任务
     */
  private findTaskByJob(job: Function): Task | undefined {
    for (const task of this.tasks.values()) {
      if ((task as any).__job === job) {
        return task
      }
    }
    return undefined
  }

  /**
     * 更新统计信息
     */
  private updateStats(): void {
    let pending = 0
    let running = 0
    let completed = 0
    let failed = 0

    for (const task of this.tasks.values()) {
      switch (task.state) {
      case 'pending':
        pending++
        break
      case 'running':
        running++
        break
      case 'completed':
        completed++
        break
      case 'failed':
        failed++
        break
      }
    }

    this.stats.pendingTasks = pending
    this.stats.runningTasks = running
    this.stats.completedTasks = completed
    this.stats.failedTasks = failed

    // 计算平均执行时间
    if (this.executionTimes.length > 0) {
      this.stats.averageExecutionTime =
                this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length
    }

    // 计算吞吐量
    const totalTime = (Date.now() - this.startTime) / 1000 // 转换为秒
    if (totalTime > 0) {
      this.stats.throughput = this.stats.completedTasks / totalTime
    }
  }

  /**
     * 添加任务到队列
     */
  async push(task: Task): Promise<string> {
    // 设置默认值
    task.state = 'pending'
    task.createdAt = new Date()

    this.tasks.set(task.id, task)
    this.stats.totalTasks++

    // 创建包装后的执行函数
    const wrappedExecute = async () => {
      return await task.execute()
    }

    // 设置任务超时
    if (task.timeout) {
      wrappedExecute.timeout = task.timeout
    }

    // 保存引用以便后续查找
    (task as any).__job = wrappedExecute

    // 根据队列类型添加任务
    this.addTaskToQueue(wrappedExecute, task)

    globalEventBus.emit('queue:taskAdded', {
      queueId: this.id,
      task,
    })

    return task.id
  }

    /**
     * 抽象方法：根据队列类型添加任务
     */
    protected abstract addTaskToQueue(job: Function, task: Task): void

    /**
     * 启动队列处理
     */
    async start(): Promise<void> {
      return new Promise((resolve, reject) => {
        this.queue.start((err: any) => {
          if (err) {
            globalEventBus.emit('queue:error', {
              queueId: this.id,
              error: err,
            })
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }

    /**
     * 停止队列处理
     */
    async stop(): Promise<void> {
      this.queue.stop()

      // 将所有等待中的任务标记为取消
      for (const task of this.tasks.values()) {
        if (task.state === 'pending') {
          task.state = 'cancelled'
        }
      }

      this.updateStats()
    }

    /**
     * 获取队列统计信息
     */
    getStats(): QueueStats {
      return { ...this.stats }
    }

    /**
     * 获取队列长度
     */
    get length(): number {
      return this.queue.length
    }

    /**
     * 队列是否正在运行
     */
    get isRunning(): boolean {
      return this.queue.length > 0
    }

    /**
     * 获取任务详情
     */
    getTask(taskId: string): Task | undefined {
      return this.tasks.get(taskId)
    }

    /**
     * 获取所有任务
     */
    getAllTasks(): Task[] {
      return Array.from(this.tasks.values())
    }

    /**
     * 取消特定任务
     */
    cancelTask(taskId: string): boolean {
      const task = this.tasks.get(taskId)
      if (task && task.state === 'pending') {
        task.state = 'cancelled'
        this.updateStats()

        globalEventBus.emit('queue:taskCancelled', {
          queueId: this.id,
          task,
        })

        return true
      }
      return false
    }

    /**
     * 清空队列
     */
    clear(): void {
      this.queue.end()
      this.tasks.clear()
      this.stats.totalTasks = 0
      this.updateStats()
    }

    /**
     * 销毁队列
     */
    destroy(): void {
      this.stop()
      this.clear()
    }
}
