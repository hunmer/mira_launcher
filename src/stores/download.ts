/**
 * 下载状态管理 Store
 * 基于 Pinia 实现下载任务的全局状态管理
 * 集成现有的批量操作模式和通知系统
 */

import { globalEventBus } from '@/plugins/core/EventBus'
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

/**
 * 下载状态枚举
 */
export type DownloadState =
  | 'pending' // 等待中
  | 'starting' // 启动中
  | 'downloading' // 下载中
  | 'paused' // 已暂停
  | 'completed' // 已完成
  | 'failed' // 已失败
  | 'cancelled' // 已取消
  | 'retrying' // 重试中

/**
 * 下载任务接口
 */
export interface DownloadTask {
  /** 任务ID */
  id: string
  /** 下载URL */
  url: string
  /** 保存路径 */
  savePath: string
  /** 文件名 */
  fileName: string
  /** 文件大小（字节） */
  fileSize: number
  /** 已下载大小（字节） */
  downloadedSize: number
  /** 下载状态 */
  state: DownloadState
  /** 下载速度（字节/秒） */
  speed: number
  /** 进度百分比（0-100） */
  progress: number
  /** 剩余时间（秒） */
  remainingTime: number
  /** 创建时间 */
  createdAt: Date
  /** 开始时间 */
  startedAt?: Date
  /** 完成时间 */
  completedAt?: Date
  /** 错误信息 */
  error?: string
  /** 重试次数 */
  retryCount: number
  /** 最大重试次数 */
  maxRetries: number
  /** 优先级 */
  priority: number
  /** 任务元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 下载统计信息
 */
export interface DownloadStats {
  /** 总任务数 */
  totalTasks: number
  /** 已完成任务数 */
  completedTasks: number
  /** 失败任务数 */
  failedTasks: number
  /** 下载中任务数 */
  activeTasks: number
  /** 总下载大小 */
  totalSize: number
  /** 已下载大小 */
  downloadedSize: number
  /** 总体进度 */
  overallProgress: number
  /** 平均下载速度 */
  averageSpeed: number
  /** 成功率 */
  successRate: number
}

/**
 * 下载历史记录
 */
export interface DownloadHistory {
  /** 记录ID */
  id: string
  /** 下载任务信息 */
  task: DownloadTask
  /** 下载结果 */
  result: 'success' | 'failed' | 'cancelled'
  /** 完成时间 */
  completedAt: Date
  /** 下载时长（秒） */
  duration: number
  /** 平均速度 */
  averageSpeed: number
  /** 错误信息（如果失败） */
  error?: string
}

/**
 * 下载配置
 */
export interface DownloadConfig {
  /** 最大并发下载数 */
  maxConcurrentDownloads: number
  /** 默认下载路径 */
  defaultDownloadPath: string
  /** 自动重试次数 */
  defaultMaxRetries: number
  /** 重试间隔（毫秒） */
  retryInterval: number
  /** 是否自动开始下载 */
  autoStart: boolean
  /** 是否显示通知 */
  showNotifications: boolean
  /** 是否保存历史记录 */
  saveHistory: boolean
  /** 历史记录保留天数 */
  historyRetentionDays: number
}

/**
 * 下载 Store
 */
export const useDownloadStore = defineStore('download', () => {
  // 状态管理
  const tasks = reactive(new Map<string, DownloadTask>())
  const history = reactive<DownloadHistory[]>([])
  const config = reactive<DownloadConfig>({
    maxConcurrentDownloads: 3,
    defaultDownloadPath: '',
    defaultMaxRetries: 3,
    retryInterval: 5000,
    autoStart: true,
    showNotifications: true,
    saveHistory: true,
    historyRetentionDays: 30,
  })

  // 批量操作模式
  const isBatchMode = ref(false)
  const selectedTaskIds = reactive(new Set<string>())
  const batchOperation = ref<'pause' | 'resume' | 'cancel' | 'retry' | null>(
    null,
  )

  // 计算属性
  const taskList = computed(() => Array.from(tasks.values()))

  const activeTasks = computed(() =>
    taskList.value.filter(task =>
      ['starting', 'downloading', 'retrying'].includes(task.state),
    ),
  )

  const pendingTasks = computed(() =>
    taskList.value.filter(task => task.state === 'pending'),
  )

  const completedTasks = computed(() =>
    taskList.value.filter(task => task.state === 'completed'),
  )

  const failedTasks = computed(() =>
    taskList.value.filter(task => task.state === 'failed'),
  )

  const stats = computed<DownloadStats>(() => {
    const total = taskList.value.length
    const completed = completedTasks.value.length
    const failed = failedTasks.value.length
    const active = activeTasks.value.length

    const totalSize = taskList.value.reduce(
      (sum, task) => sum + task.fileSize,
      0,
    )
    const downloadedSize = taskList.value.reduce(
      (sum, task) => sum + task.downloadedSize,
      0,
    )

    const overallProgress =
      totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0

    const activeTasksWithSpeed = activeTasks.value.filter(
      task => task.speed > 0,
    )
    const averageSpeed =
      activeTasksWithSpeed.length > 0
        ? activeTasksWithSpeed.reduce((sum, task) => sum + task.speed, 0) /
          activeTasksWithSpeed.length
        : 0

    const successRate = total > 0 ? (completed / total) * 100 : 0

    return {
      totalTasks: total,
      completedTasks: completed,
      failedTasks: failed,
      activeTasks: active,
      totalSize,
      downloadedSize,
      overallProgress,
      averageSpeed,
      successRate,
    }
  })

  const canStartNewDownload = computed(
    () => activeTasks.value.length < config.maxConcurrentDownloads,
  )

  const selectedTasks = computed(
    () =>
      Array.from(selectedTaskIds)
        .map(id => tasks.get(id))
        .filter(Boolean) as DownloadTask[],
  )

  // Actions

  /**
   * 添加下载任务
   */
  function addTask(
    taskData: Omit<
      DownloadTask,
      | 'id'
      | 'createdAt'
      | 'downloadedSize'
      | 'progress'
      | 'speed'
      | 'remainingTime'
      | 'retryCount'
    >,
  ): string {
    const id = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const task: DownloadTask = {
      id,
      downloadedSize: 0,
      progress: 0,
      speed: 0,
      remainingTime: 0,
      createdAt: new Date(),
      retryCount: 0,
      ...taskData,
    }

    tasks.set(id, task)

    globalEventBus.emit('download:taskAdded', { task })

    // 如果启用自动开始且有空闲下载槽位，立即开始下载
    if (config.autoStart && canStartNewDownload.value) {
      startTask(id)
    }

    return id
  }

  /**
   * 移除任务
   */
  function removeTask(taskId: string): boolean {
    const task = tasks.get(taskId)
    if (!task) {
      return false
    }

    // 如果任务正在进行中，先取消
    if (['starting', 'downloading', 'retrying'].includes(task.state)) {
      cancelTask(taskId)
    }

    tasks.delete(taskId)
    selectedTaskIds.delete(taskId)

    globalEventBus.emit('download:taskRemoved', { taskId })

    return true
  }

  /**
   * 开始下载任务
   */
  function startTask(taskId: string): boolean {
    const task = tasks.get(taskId)
    if (!task || task.state !== 'pending') {
      return false
    }

    if (!canStartNewDownload.value) {
      return false // 超过并发限制
    }

    updateTaskState(taskId, 'starting')
    task.startedAt = new Date()

    globalEventBus.emit('download:taskStarted', { taskId, task })

    return true
  }

  /**
   * 暂停下载任务
   */
  function pauseTask(taskId: string): boolean {
    const task = tasks.get(taskId)
    if (
      !task ||
      !['starting', 'downloading', 'retrying'].includes(task.state)
    ) {
      return false
    }

    updateTaskState(taskId, 'paused')

    globalEventBus.emit('download:taskPaused', { taskId, task })

    // 尝试启动下一个等待中的任务
    startNextPendingTask()

    return true
  }

  /**
   * 恢复下载任务
   */
  function resumeTask(taskId: string): boolean {
    const task = tasks.get(taskId)
    if (!task || task.state !== 'paused') {
      return false
    }

    if (!canStartNewDownload.value) {
      return false // 超过并发限制
    }

    updateTaskState(taskId, 'downloading')

    globalEventBus.emit('download:taskResumed', { taskId, task })

    return true
  }

  /**
   * 取消下载任务
   */
  function cancelTask(taskId: string): boolean {
    const task = tasks.get(taskId)
    if (!task || ['completed', 'cancelled'].includes(task.state)) {
      return false
    }

    updateTaskState(taskId, 'cancelled')

    globalEventBus.emit('download:taskCancelled', { taskId, task })

    // 如果任务原来是活动状态，尝试启动下一个等待中的任务
    if (['starting', 'downloading', 'retrying'].includes(task.state)) {
      startNextPendingTask()
    }

    // 保存到历史记录
    if (config.saveHistory) {
      addToHistory(task, 'cancelled')
    }

    return true
  }

  /**
   * 重试失败的任务
   */
  function retryTask(taskId: string): boolean {
    const task = tasks.get(taskId)
    if (!task || task.state !== 'failed') {
      return false
    }

    if (task.retryCount >= task.maxRetries) {
      return false
    }

    if (!canStartNewDownload.value) {
      return false // 超过并发限制
    }

    task.retryCount++
    delete task.error
    updateTaskState(taskId, 'retrying')

    globalEventBus.emit('download:taskRetrying', { taskId, task })

    return true
  }

  /**
   * 更新任务进度
   */
  function updateTaskProgress(
    taskId: string,
    progress: {
      downloadedSize?: number
      speed?: number
      remainingTime?: number
    },
  ): void {
    const task = tasks.get(taskId)
    if (!task) {
      return
    }

    if (progress.downloadedSize !== undefined) {
      task.downloadedSize = progress.downloadedSize
      task.progress =
        task.fileSize > 0 ? (task.downloadedSize / task.fileSize) * 100 : 0
    }

    if (progress.speed !== undefined) {
      task.speed = progress.speed
    }

    if (progress.remainingTime !== undefined) {
      task.remainingTime = progress.remainingTime
    }

    globalEventBus.emit('download:progressUpdated', { taskId, task, progress })
  }

  /**
   * 标记任务完成
   */
  function completeTask(taskId: string): void {
    const task = tasks.get(taskId)
    if (!task) {
      return
    }

    updateTaskState(taskId, 'completed')
    task.completedAt = new Date()
    task.progress = 100
    task.downloadedSize = task.fileSize

    globalEventBus.emit('download:taskCompleted', { taskId, task })

    // 显示通知
    if (config.showNotifications) {
      globalEventBus.emit('ui:notificationShown', {
        type: 'success',
        title: '下载完成',
        message: `${task.fileName} 下载完成`,
      })
    }

    // 保存到历史记录
    if (config.saveHistory) {
      addToHistory(task, 'success')
    }

    // 启动下一个等待中的任务
    startNextPendingTask()
  }

  /**
   * 标记任务失败
   */
  function failTask(taskId: string, error: string): void {
    const task = tasks.get(taskId)
    if (!task) {
      return
    }

    task.error = error
    updateTaskState(taskId, 'failed')

    globalEventBus.emit('download:taskFailed', { taskId, task, error })

    // 显示通知
    if (config.showNotifications) {
      globalEventBus.emit('ui:notificationShown', {
        type: 'error',
        title: '下载失败',
        message: `${task.fileName} 下载失败: ${error}`,
      })
    }

    // 保存到历史记录
    if (config.saveHistory) {
      addToHistory(task, 'failed')
    }

    // 启动下一个等待中的任务
    startNextPendingTask()
  }

  /**
   * 更新任务状态
   */
  function updateTaskState(taskId: string, state: DownloadState): void {
    const task = tasks.get(taskId)
    if (!task) {
      return
    }

    const oldState = task.state
    task.state = state

    globalEventBus.emit('download:stateChanged', {
      taskId,
      oldState,
      newState: state,
    })
  }

  /**
   * 启动下一个等待中的任务
   */
  function startNextPendingTask(): void {
    if (!canStartNewDownload.value) {
      return
    }

    // 按优先级和创建时间排序
    const nextTask = pendingTasks.value.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority // 优先级高的优先
      }
      return a.createdAt.getTime() - b.createdAt.getTime() // 创建时间早的优先
    })[0]

    if (nextTask) {
      startTask(nextTask.id)
    }
  }

  /**
   * 添加到历史记录
   */
  function addToHistory(
    task: DownloadTask,
    result: 'success' | 'failed' | 'cancelled',
  ): void {
    const historyItem: DownloadHistory = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      task: { ...task },
      result,
      completedAt: new Date(),
      duration: task.startedAt
        ? (Date.now() - task.startedAt.getTime()) / 1000
        : 0,
      averageSpeed:
        task.downloadedSize > 0 && task.startedAt
          ? task.downloadedSize /
            ((Date.now() - task.startedAt.getTime()) / 1000)
          : 0,
    }

    if (task.error) {
      historyItem.error = task.error
    }

    history.unshift(historyItem)

    // 限制历史记录数量
    const maxHistoryItems = config.historyRetentionDays * 50 // 假设每天最多50个下载
    if (history.length > maxHistoryItems) {
      history.splice(maxHistoryItems)
    }

    // 持久化历史记录
    saveHistory()

    globalEventBus.emit('download:historyAdded', { historyItem })
  }

  /**
   * 批量操作方法
   */

  // 进入批量模式
  function enterBatchMode(): void {
    isBatchMode.value = true
    selectedTaskIds.clear()
  }

  // 退出批量模式
  function exitBatchMode(): void {
    isBatchMode.value = false
    selectedTaskIds.clear()
    batchOperation.value = null
  }

  // 选择/取消选择任务
  function toggleTaskSelection(taskId: string): void {
    if (selectedTaskIds.has(taskId)) {
      selectedTaskIds.delete(taskId)
    } else {
      selectedTaskIds.add(taskId)
    }
  }

  // 全选/全不选
  function toggleSelectAll(): void {
    if (selectedTaskIds.size === taskList.value.length) {
      selectedTaskIds.clear()
    } else {
      selectedTaskIds.clear()
      taskList.value.forEach(task => selectedTaskIds.add(task.id))
    }
  }

  // 批量暂停
  function batchPause(): void {
    selectedTasks.value.forEach(task => {
      if (['starting', 'downloading', 'retrying'].includes(task.state)) {
        pauseTask(task.id)
      }
    })
    exitBatchMode()
  }

  // 批量恢复
  function batchResume(): void {
    selectedTasks.value.forEach(task => {
      if (task.state === 'paused') {
        resumeTask(task.id)
      }
    })
    exitBatchMode()
  }

  // 批量取消
  function batchCancel(): void {
    selectedTasks.value.forEach(task => {
      if (!['completed', 'cancelled'].includes(task.state)) {
        cancelTask(task.id)
      }
    })
    exitBatchMode()
  }

  // 批量重试
  function batchRetry(): void {
    selectedTasks.value.forEach(task => {
      if (task.state === 'failed') {
        retryTask(task.id)
      }
    })
    exitBatchMode()
  }

  // 批量删除
  function batchRemove(): void {
    selectedTasks.value.forEach(task => {
      removeTask(task.id)
    })
    exitBatchMode()
  }

  /**
   * 历史记录管理
   */

  // 获取历史记录
  function getHistory(filter?: {
    result?: 'success' | 'failed' | 'cancelled'
    dateRange?: { start: Date; end: Date }
    keyword?: string
  }): DownloadHistory[] {
    let filtered = history.slice()

    if (filter) {
      if (filter.result) {
        filtered = filtered.filter(item => item.result === filter.result)
      }

      if (filter.dateRange) {
        filtered = filtered.filter(
          item =>
            item.completedAt >= filter.dateRange!.start &&
            item.completedAt <= filter.dateRange!.end,
        )
      }

      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase()
        filtered = filtered.filter(
          item =>
            item.task.fileName.toLowerCase().includes(keyword) ||
            item.task.url.toLowerCase().includes(keyword),
        )
      }
    }

    return filtered
  }

  // 清理历史记录
  function clearHistory(before?: Date): void {
    if (before) {
      const index = history.findIndex(item => item.completedAt < before)
      if (index >= 0) {
        history.splice(index)
      }
    } else {
      history.splice(0)
    }

    saveHistory()
    globalEventBus.emit('download:historyCleared', { before })
  }

  // 导出历史记录
  function exportHistory(): string {
    const exportData = {
      exportedAt: new Date(),
      version: '1.0',
      history: history.slice(),
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 配置管理
   */

  // 更新配置
  function updateConfig(newConfig: Partial<DownloadConfig>): void {
    Object.assign(config, newConfig)
    saveConfig()
    globalEventBus.emit('download:configUpdated', { config })
  }

  // 重置配置
  function resetConfig(): void {
    Object.assign(config, {
      maxConcurrentDownloads: 3,
      defaultDownloadPath: '',
      defaultMaxRetries: 3,
      retryInterval: 5000,
      autoStart: true,
      showNotifications: true,
      saveHistory: true,
      historyRetentionDays: 30,
    })
    saveConfig()
  }

  /**
   * 持久化方法
   */

  // 保存配置到本地存储
  function saveConfig(): void {
    try {
      localStorage.setItem('download_config', JSON.stringify(config))
    } catch (error) {
      console.warn('Failed to save download config:', error)
    }
  }

  // 从本地存储加载配置
  function loadConfig(): void {
    try {
      const saved = localStorage.getItem('download_config')
      if (saved) {
        const savedConfig = JSON.parse(saved)
        Object.assign(config, savedConfig)
      }
    } catch (error) {
      console.warn('Failed to load download config:', error)
    }
  }

  // 保存历史记录到本地存储
  function saveHistory(): void {
    try {
      localStorage.setItem('download_history', JSON.stringify(history))
    } catch (error) {
      console.warn('Failed to save download history:', error)
    }
  }

  // 从本地存储加载历史记录
  function loadHistory(): void {
    try {
      const saved = localStorage.getItem('download_history')
      if (saved) {
        const savedHistory = JSON.parse(saved)
        history.splice(
          0,
          history.length,
          ...savedHistory.map((item: any) => ({
            ...item,
            completedAt: new Date(item.completedAt),
            task: {
              ...item.task,
              createdAt: new Date(item.task.createdAt),
              startedAt: item.task.startedAt
                ? new Date(item.task.startedAt)
                : undefined,
              completedAt: item.task.completedAt
                ? new Date(item.task.completedAt)
                : undefined,
            },
          })),
        )
      }
    } catch (error) {
      console.warn('Failed to load download history:', error)
    }
  }

  // 清理过期历史记录
  function cleanupExpiredHistory(): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - config.historyRetentionDays)

    clearHistory(cutoffDate)
  }

  // 初始化
  function initialize(): void {
    loadConfig()
    loadHistory()
    cleanupExpiredHistory()

    // 设置定期清理
    setInterval(cleanupExpiredHistory, 24 * 60 * 60 * 1000) // 每天清理一次
  }

  // 获取任务
  function getTask(taskId: string): DownloadTask | undefined {
    return tasks.get(taskId)
  }

  // 获取所有任务
  function getAllTasks(): DownloadTask[] {
    return taskList.value
  }

  // 清除所有已完成/失败/取消的任务
  function clearCompletedTasks(): void {
    const toRemove: string[] = []

    tasks.forEach((task, id) => {
      if (['completed', 'failed', 'cancelled'].includes(task.state)) {
        toRemove.push(id)
      }
    })

    toRemove.forEach(id => removeTask(id))

    globalEventBus.emit('download:completedTasksCleared', {
      count: toRemove.length,
    })
  }

  return {
    // 状态
    tasks: taskList,
    history,
    config,
    stats,

    // 批量操作状态
    isBatchMode,
    selectedTaskIds,
    selectedTasks,
    batchOperation,

    // 计算属性
    activeTasks,
    pendingTasks,
    completedTasks,
    failedTasks,
    canStartNewDownload,

    // 任务管理方法
    addTask,
    removeTask,
    startTask,
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    updateTaskProgress,
    updateTaskState,
    completeTask,
    failTask,
    getTask,
    getAllTasks,
    clearCompletedTasks,

    // 批量操作方法
    enterBatchMode,
    exitBatchMode,
    toggleTaskSelection,
    toggleSelectAll,
    batchPause,
    batchResume,
    batchCancel,
    batchRetry,
    batchRemove,

    // 历史记录方法
    getHistory,
    clearHistory,
    exportHistory,

    // 配置方法
    updateConfig,
    resetConfig,

    // 初始化方法
    initialize,
  }
})

export default useDownloadStore
