/**
 * 下载管理器
 * 基于 TaskScheduler 实现下载任务队列管理，使用浏览器兼容的下载实现
 * 集成现有的事件系统、权限控制和状态管理
 */

import type { DownloadTask } from '@/stores/download'
import { useDownloadStore } from '@/stores/download'
import { reactive, ref } from 'vue'
import { BrowserDownloadHelper, globalDownloadProgressManager } from './DownloadProgress'
import { globalEventBus } from './EventBus'
import { RetryHandler } from './RetryHandler'
import { TaskScheduler } from './TaskScheduler'

/**
 * 下载选项配置
 */
export interface DownloadOptions {
    /** 保存路径 */
    savePath: string
    /** 文件名（可选，不提供则从URL推断） */
    fileName?: string
    /** 优先级（数值越大优先级越高） */
    priority?: number
    /** 最大重试次数 */
    maxRetries?: number
    /** 请求头 */
    headers?: Record<string, string>
    /** 超时时间（毫秒） */
    timeout?: number
    /** 是否覆盖现有文件 */
    override?: boolean
    /** 是否恢复下载 */
    resumeIfFileExists?: boolean
    /** 代理设置 */
    proxy?: string
    /** 任务元数据 */
    metadata?: Record<string, unknown>
}

/**
 * 下载统计信息
 */
export interface DownloadManagerStats {
    /** 总下载任务数 */
    totalTasks: number
    /** 活跃下载数 */
    activeTasks: number
    /** 已完成下载数 */
    completedTasks: number
    /** 失败下载数 */
    failedTasks: number
    /** 总下载字节数 */
    totalBytes: number
    /** 已下载字节数 */
    downloadedBytes: number
    /** 总体进度百分比 */
    overallProgress: number
    /** 平均下载速度（字节/秒） */
    averageSpeed: number
    /** 成功率 */
    successRate: number
}

/**
 * 下载实例信息
 */
interface DownloadInstance {
    /** 任务ID */
    taskId: string
    /** 下载器实例 */
    downloader: BrowserDownloadHelper
    /** 开始时间 */
    startTime: number
    /** 上次进度更新时间 */
    lastProgressTime: number
    /** 上次下载字节数 */
    lastDownloadedBytes: number
    /** 平均速度计算窗口 */
    speedWindow: Array<{ time: number; bytes: number }>
}

/**
 * 下载管理器配置
 */
export interface DownloadManagerConfig {
    /** 最大并发下载数 */
    maxConcurrentDownloads: number
    /** 默认保存路径 */
    defaultSavePath: string
    /** 默认最大重试次数 */
    defaultMaxRetries: number
    /** 默认超时时间（毫秒） */
    defaultTimeout: number
    /** 速度计算窗口大小 */
    speedWindowSize: number
    /** 进度更新间隔（毫秒） */
    progressUpdateInterval: number
    /** 是否启用断点续传 */
    enableResume: boolean
    /** 是否启用重试机制 */
    enableRetry: boolean
}

/**
 * 下载管理器主类
 */
export class DownloadManager {
  private taskScheduler: TaskScheduler
  private retryHandler: RetryHandler
  private downloadStore = useDownloadStore()
  private activeDownloads = reactive(new Map<string, DownloadInstance>())
  private config: DownloadManagerConfig
  private isDestroyed = ref(false)

  public readonly id: string

  constructor(id: string, config?: Partial<DownloadManagerConfig>) {
    this.id = id
    this.config = {
      maxConcurrentDownloads: 3,
      defaultSavePath: '',
      defaultMaxRetries: 3,
      defaultTimeout: 30000,
      speedWindowSize: 10,
      progressUpdateInterval: 1000,
      enableResume: true,
      enableRetry: true,
      ...config,
    }

    this.taskScheduler = new TaskScheduler(`${id}_scheduler`, {
      mode: 'parallel',
      maxConcurrency: this.config.maxConcurrentDownloads,
      rateLimit: { maxTasks: 10, windowMs: 1000 },
    })

    this.retryHandler = new RetryHandler(`${id}_retry`, {
      maxRetries: this.config.defaultMaxRetries,
      strategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 30000,
      multiplier: 2,
      jitter: 0.1,
    })

    this.initialize()
  }

  /**
     * 初始化下载管理器
     */
  private initialize(): void {
    this.setupEventListeners()
    this.downloadStore.initialize()

    // 同步配置
    this.downloadStore.updateConfig({
      maxConcurrentDownloads: this.config.maxConcurrentDownloads,
      defaultMaxRetries: this.config.defaultMaxRetries,
    })

    globalEventBus.emit('download:managerInitialized', {
      managerId: this.id,
      config: this.config,
    })
  }

  /**
     * 设置事件监听器
     */
  private setupEventListeners(): void {
    // 监听下载store事件
    globalEventBus.on('download:taskStarted', (event) => {
      const data = event.data as any
      if (data.task && !this.activeDownloads.has(data.taskId)) {
        this.startDownload(data.taskId, data.task)
      }
    })

    globalEventBus.on('download:taskPaused', (event) => {
      const data = event.data as any
      this.pauseDownload(data.taskId)
    })

    globalEventBus.on('download:taskResumed', (event) => {
      const data = event.data as any
      this.resumeDownload(data.taskId)
    })

    globalEventBus.on('download:taskCancelled', (event) => {
      const data = event.data as any
      this.cancelDownload(data.taskId)
    })

    globalEventBus.on('download:taskRetrying', (event) => {
      const data = event.data as any
      this.retryDownload(data.taskId, data.task)
    })
  }

  /**
     * 创建下载任务
     */
  async createDownload(url: string, options: DownloadOptions): Promise<string> {
    // 验证URL
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid URL provided')
    }

    // 推断文件名
    let fileName = options.fileName
    if (!fileName) {
      fileName = this.extractFileNameFromUrl(url)
    }

    // 创建下载任务
    const taskId = this.downloadStore.addTask({
      url,
      savePath: options.savePath || this.config.defaultSavePath,
      fileName,
      fileSize: 0, // 将在下载开始时获取
      state: 'pending',
      maxRetries: options.maxRetries || this.config.defaultMaxRetries,
      priority: options.priority || 0,
      metadata: {
        ...options.metadata,
        headers: options.headers,
        timeout: options.timeout || this.config.defaultTimeout,
        override: options.override || false,
        resumeIfFileExists: options.resumeIfFileExists !== false,
        proxy: options.proxy,
      },
    })

    globalEventBus.emit('download:downloadCreated', {
      managerId: this.id,
      taskId,
      url,
      options,
    })

    return taskId
  }

  /**
     * 开始下载
     */
  private async startDownload(taskId: string, task: DownloadTask): Promise<void> {
    if (this.activeDownloads.has(taskId)) {
      return // 已经在下载中
    }

    try {
      const metadata = task.metadata || {}
      const downloader = globalDownloadProgressManager.createDownload(
        taskId,
        task.url,
        task.savePath,
        {
          fileName: task.fileName,
          headers: metadata['headers'] as Record<string, string>,
          timeout: metadata['timeout'] as number || this.config.defaultTimeout,
          override: metadata['override'] as boolean || false,
          resumeIfFileExists: metadata['resumeIfFileExists'] as boolean !== false,
          proxy: metadata['proxy'] as string,
        },
      )

      const instance: DownloadInstance = {
        taskId,
        downloader,
        startTime: Date.now(),
        lastProgressTime: Date.now(),
        lastDownloadedBytes: 0,
        speedWindow: [],
      }

      this.activeDownloads.set(taskId, instance)
      this.setupDownloadEvents(instance)

      // 开始下载
      await downloader.start()

    } catch (error) {
      this.handleDownloadError(taskId, error as Error)
    }
  }

  /**
     * 设置下载事件监听
     */
  private setupDownloadEvents(instance: DownloadInstance): void {
    const { taskId, downloader } = instance

    // 下载开始
    downloader.on('start', () => {
      this.downloadStore.updateTaskState(taskId, 'downloading')

      // 获取文件大小
      const task = this.downloadStore.getTask(taskId)
      if (task && downloader.getTotalSize() > 0) {
        task.fileSize = downloader.getTotalSize()
      }
    })

    // 下载进度
    downloader.on('progress', (stats: any) => {
      this.updateProgress(instance, stats)
    })

    // 下载完成
    downloader.on('end', (downloadInfo: any) => {
      this.handleDownloadComplete(taskId, downloadInfo)
    })

    // 下载错误
    downloader.on('error', (error: Error) => {
      this.handleDownloadError(taskId, error)
    })

    // 下载超时
    downloader.on('timeout', () => {
      this.handleDownloadError(taskId, new Error('Download timeout'))
    })

    // 下载暂停
    downloader.on('pause', () => {
      // 暂停事件由用户触发，状态已经更新
    })

    // 下载恢复
    downloader.on('resume', () => {
      this.downloadStore.updateTaskState(taskId, 'downloading')
    })
  }

  /**
     * 更新下载进度
     */
  private updateProgress(instance: DownloadInstance, stats: any): void {
    const { taskId, speedWindow } = instance
    const now = Date.now()

    // 计算速度
    const timeDiff = now - instance.lastProgressTime
    if (timeDiff >= this.config.progressUpdateInterval) {
      const bytesDiff = stats.downloaded - instance.lastDownloadedBytes
      const currentSpeed = timeDiff > 0 ? (bytesDiff / timeDiff) * 1000 : 0

      // 更新速度窗口
      speedWindow.push({ time: now, bytes: stats.downloaded })
      if (speedWindow.length > this.config.speedWindowSize) {
        speedWindow.shift()
      }

      // 计算平均速度
      let averageSpeed = 0
      if (speedWindow.length > 1) {
        const firstPoint = speedWindow[0]
        const lastPoint = speedWindow[speedWindow.length - 1]
        if (firstPoint && lastPoint) {
          const totalTime = (lastPoint.time - firstPoint.time) / 1000
          const totalBytes = lastPoint.bytes - firstPoint.bytes
          averageSpeed = totalTime > 0 ? totalBytes / totalTime : 0
        }
      }

      // 计算剩余时间
      const remainingBytes = stats.total - stats.downloaded
      const remainingTime = averageSpeed > 0 ? remainingBytes / averageSpeed : 0

      // 更新任务进度
      this.downloadStore.updateTaskProgress(taskId, {
        downloadedSize: stats.downloaded,
        speed: averageSpeed,
        remainingTime,
      })

      instance.lastProgressTime = now
      instance.lastDownloadedBytes = stats.downloaded
    }
  }

  /**
     * 处理下载完成
     */
  private handleDownloadComplete(taskId: string, downloadInfo: any): void {
    this.activeDownloads.delete(taskId)
    this.downloadStore.completeTask(taskId)

    globalEventBus.emit('download:downloadCompleted', {
      managerId: this.id,
      taskId,
      downloadInfo,
    })
  }

  /**
     * 处理下载错误
     */
  private handleDownloadError(taskId: string, error: Error): void {
    this.activeDownloads.delete(taskId)

    const task = this.downloadStore.getTask(taskId)
    if (!task) {
      return
    }

    // 检查是否需要重试
    if (this.config.enableRetry && task.retryCount < task.maxRetries) {
      // 直接触发重试
      setTimeout(() => {
        this.downloadStore.retryTask(taskId)
      }, this.config.defaultTimeout / 10)
    } else {
      // 标记为失败
      this.downloadStore.failTask(taskId, error.message)
    }

    globalEventBus.emit('download:downloadFailed', {
      managerId: this.id,
      taskId,
      error,
    })
  }

  /**
     * 暂停下载
     */
  private pauseDownload(taskId: string): void {
    const instance = this.activeDownloads.get(taskId)
    if (instance) {
      instance.downloader.pause()
    }
  }

  /**
     * 恢复下载
     */
  private resumeDownload(taskId: string): void {
    const instance = this.activeDownloads.get(taskId)
    if (instance) {
      instance.downloader.resume()
    } else {
      // 重新开始下载
      const task = this.downloadStore.getTask(taskId)
      if (task) {
        this.startDownload(taskId, task)
      }
    }
  }

  /**
     * 取消下载
     */
  private cancelDownload(taskId: string): void {
    const instance = this.activeDownloads.get(taskId)
    if (instance) {
      instance.downloader.stop()
      this.activeDownloads.delete(taskId)
    }
  }

  /**
     * 重试下载
     */
  private async retryDownload(taskId: string, task: DownloadTask): Promise<void> {
    // 等待一段时间后重新开始下载
    setTimeout(() => {
      this.startDownload(taskId, task)
    }, this.config.defaultTimeout / 10) // 短暂延迟
  }

  /**
     * 批量创建下载任务
     */
  async createBatchDownloads(downloads: Array<{
        url: string
        options: DownloadOptions
    }>): Promise<string[]> {
    const taskIds: string[] = []

    for (const { url, options } of downloads) {
      try {
        const taskId = await this.createDownload(url, options)
        taskIds.push(taskId)
      } catch (error) {
        console.warn(`Failed to create download for ${url}:`, error)
      }
    }

    globalEventBus.emit('download:batchDownloadsCreated', {
      managerId: this.id,
      taskIds,
      count: taskIds.length,
    })

    return taskIds
  }

  /**
     * 获取下载统计信息
     */
  getStats(): DownloadManagerStats {
    const storeStats = this.downloadStore.stats

    return {
      totalTasks: storeStats.totalTasks,
      activeTasks: storeStats.activeTasks,
      completedTasks: storeStats.completedTasks,
      failedTasks: storeStats.failedTasks,
      totalBytes: storeStats.totalSize,
      downloadedBytes: storeStats.downloadedSize,
      overallProgress: storeStats.overallProgress,
      averageSpeed: storeStats.averageSpeed,
      successRate: storeStats.successRate,
    }
  }

  /**
     * 获取活跃下载信息
     */
  getActiveDownloads(): Array<{
        taskId: string
        url: string
        fileName: string
        progress: number
        speed: number
        remainingTime: number
    }> {
    return Array.from(this.activeDownloads.entries()).map(([taskId, instance]) => {
      const task = this.downloadStore.getTask(taskId)
      return {
        taskId,
        url: task?.url || '',
        fileName: task?.fileName || '',
        progress: task?.progress || 0,
        speed: task?.speed || 0,
        remainingTime: task?.remainingTime || 0,
      }
    })
  }

  /**
     * 暂停所有下载
     */
  pauseAll(): void {
    this.activeDownloads.forEach((instance) => {
      instance.downloader.pause()
    })

    globalEventBus.emit('download:allDownloadsPaused', {
      managerId: this.id,
      count: this.activeDownloads.size,
    })
  }

  /**
     * 恢复所有下载
     */
  resumeAll(): void {
    this.activeDownloads.forEach((instance) => {
      instance.downloader.resume()
    })

    globalEventBus.emit('download:allDownloadsResumed', {
      managerId: this.id,
      count: this.activeDownloads.size,
    })
  }

  /**
     * 取消所有下载
     */
  cancelAll(): void {
    this.activeDownloads.forEach((instance) => {
      instance.downloader.stop()
    })
    this.activeDownloads.clear()

    globalEventBus.emit('download:allDownloadsCancelled', {
      managerId: this.id,
    })
  }

  /**
     * 清理已完成的下载任务
     */
  clearCompleted(): void {
    this.downloadStore.clearCompletedTasks()
  }

  /**
     * 更新配置
     */
  updateConfig(config: Partial<DownloadManagerConfig>): void {
    Object.assign(this.config, config)

    // 更新任务调度器配置
    if (config.maxConcurrentDownloads) {
      this.taskScheduler.updateConfig({
        maxConcurrency: config.maxConcurrentDownloads,
      })

      this.downloadStore.updateConfig({
        maxConcurrentDownloads: config.maxConcurrentDownloads,
      })
    }

    // 更新重试处理器配置
    if (config.defaultMaxRetries) {
      this.retryHandler.updateConfig({
        maxRetries: config.defaultMaxRetries,
      })

      this.downloadStore.updateConfig({
        defaultMaxRetries: config.defaultMaxRetries,
      })
    }

    globalEventBus.emit('download:managerConfigUpdated', {
      managerId: this.id,
      config: this.config,
    })
  }

  /**
     * 获取配置
     */
  getConfig(): DownloadManagerConfig {
    return { ...this.config }
  }

  /**
     * 工具方法
     */

  /**
     * 验证URL是否有效
     */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
     * 从URL提取文件名
     */
  private extractFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const fileName = pathname.substring(pathname.lastIndexOf('/') + 1)

      // 如果没有文件名或文件名无效，生成一个默认名称
      if (!fileName || fileName.includes('.') === false) {
        const timestamp = Date.now()
        return `download_${timestamp}`
      }

      return fileName
    } catch {
      const timestamp = Date.now()
      return `download_${timestamp}`
    }
  }

  /**
     * 格式化字节大小
     */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  /**
     * 格式化速度
     */
  static formatSpeed(bytesPerSecond: number): string {
    return `${DownloadManager.formatBytes(bytesPerSecond)}/s`
  }

  /**
     * 格式化剩余时间
     */
  static formatRemainingTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) {
      return '未知'
    }

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}时${minutes}分${secs}秒`
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`
    } else {
      return `${secs}秒`
    }
  }

  /**
     * 销毁下载管理器
     */
  destroy(): void {
    if (this.isDestroyed.value) {
      return
    }

    this.isDestroyed.value = true

    // 取消所有下载
    this.cancelAll()

    // 销毁子组件
    this.taskScheduler.destroy()
    this.retryHandler.destroy()

    globalEventBus.emit('download:managerDestroyed', {
      managerId: this.id,
    })
  }
}

export default DownloadManager
