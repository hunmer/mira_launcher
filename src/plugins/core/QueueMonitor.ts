/**
 * 队列监控器
 * 统一监控所有队列的性能指标和健康状态
 * 提供实时性能监控、告警和报告功能
 */

import { reactive, ref } from 'vue'
import { globalEventBus } from './EventBus'

/**
 * 监控指标类型
 */
export interface QueueMetrics {
    /** 队列ID */
    queueId: string
    /** 队列名称 */
    queueName: string
    /** 队列类型 */
    queueType: string
    /** 当前队列大小 */
    currentSize: number
    /** 最大队列大小 */
    maxSize: number
    /** 处理中的任务数 */
    processingTasks: number
    /** 已完成的任务数 */
    completedTasks: number
    /** 失败的任务数 */
    failedTasks: number
    /** 平均处理时间（毫秒） */
    averageProcessingTime: number
    /** 吞吐量（任务/秒） */
    throughput: number
    /** 成功率 */
    successRate: number
    /** 错误率 */
    errorRate: number
    /** 队列利用率 */
    utilization: number
    /** 最后更新时间 */
    lastUpdated: Date
    /** 队列健康状态 */
    healthStatus: HealthStatus
    /** 资源使用情况 */
    resourceUsage: ResourceUsage
}

/**
 * 健康状态
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

/**
 * 资源使用情况
 */
export interface ResourceUsage {
    /** CPU使用率 */
    cpuUsage: number
    /** 内存使用量（MB） */
    memoryUsage: number
    /** 网络IO（KB/s） */
    networkIO: number
    /** 磁盘IO（KB/s） */
    diskIO: number
}

/**
 * 监控阈值配置
 */
export interface MonitoringThresholds {
    /** 队列大小阈值 */
    queueSize: {
        warning: number
        critical: number
    }
    /** 处理时间阈值（毫秒） */
    processingTime: {
        warning: number
        critical: number
    }
    /** 错误率阈值 */
    errorRate: {
        warning: number
        critical: number
    }
    /** 吞吐量阈值（任务/秒） */
    throughput: {
        min: number
        warning: number
    }
    /** 资源使用阈值 */
    resource: {
        cpu: { warning: number; critical: number }
        memory: { warning: number; critical: number }
        network: { warning: number; critical: number }
        disk: { warning: number; critical: number }
    }
}

/**
 * 监控告警
 */
export interface MonitoringAlert {
    /** 告警ID */
    id: string
    /** 队列ID */
    queueId: string
    /** 告警类型 */
    type: AlertType
    /** 告警级别 */
    level: AlertLevel
    /** 告警消息 */
    message: string
    /** 当前值 */
    currentValue: number
    /** 阈值 */
    threshold: number
    /** 告警时间 */
    timestamp: Date
    /** 是否已确认 */
    acknowledged: boolean
    /** 确认时间 */
    acknowledgedAt?: Date
    /** 确认用户 */
    acknowledgedBy?: string
}

/**
 * 告警类型
 */
export type AlertType =
    | 'queue_size_exceeded'
    | 'processing_time_exceeded'
    | 'error_rate_high'
    | 'throughput_low'
    | 'cpu_usage_high'
    | 'memory_usage_high'
    | 'network_io_high'
    | 'disk_io_high'
    | 'queue_unhealthy'

/**
 * 告警级别
 */
export type AlertLevel = 'info' | 'warning' | 'critical'

/**
 * 监控报告
 */
export interface MonitoringReport {
    /** 报告ID */
    id: string
    /** 报告类型 */
    type: ReportType
    /** 生成时间 */
    generatedAt: Date
    /** 报告时间范围 */
    timeRange: {
        start: Date
        end: Date
    }
    /** 队列指标汇总 */
    summary: {
        totalQueues: number
        totalTasks: number
        totalCompletedTasks: number
        totalFailedTasks: number
        averageSuccessRate: number
        averageProcessingTime: number
        totalThroughput: number
    }
    /** 详细指标 */
    metrics: QueueMetrics[]
    /** 告警列表 */
    alerts: MonitoringAlert[]
    /** 趋势分析 */
    trends: {
        queueSizeTrend: TrendDirection
        processingTimeTrend: TrendDirection
        throughputTrend: TrendDirection
        errorRateTrend: TrendDirection
    }
    /** 建议 */
    recommendations: string[]
}

/**
 * 报告类型
 */
export type ReportType = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly'

/**
 * 趋势方向
 */
export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile'

/**
 * 监控配置
 */
export interface MonitoringConfig {
    /** 是否启用监控 */
    enabled: boolean
    /** 采集间隔（毫秒） */
    collectionInterval: number
    /** 数据保留时间（毫秒） */
    dataRetentionTime: number
    /** 最大历史记录数 */
    maxHistoryRecords: number
    /** 阈值配置 */
    thresholds: MonitoringThresholds
    /** 是否启用告警 */
    enableAlerts: boolean
    /** 告警去重时间（毫秒） */
    alertDedupTime: number
    /** 是否启用自动报告 */
    enableAutoReports: boolean
    /** 报告生成间隔（毫秒） */
    reportInterval: number
}

/**
 * 队列监控器
 */
export class QueueMonitor {
  private metrics = reactive(new Map<string, QueueMetrics>())
  private alerts = reactive(new Map<string, MonitoringAlert>())
  private history = reactive<Array<{ timestamp: Date; metrics: Map<string, QueueMetrics> }>>([])

  private config: MonitoringConfig
  private collectionTimer: number | null = null
  private reportTimer: number | null = null
  private isDestroyed = ref(false)
  private alertIdCounter = 0

  public readonly id: string

  constructor(id: string, config?: Partial<MonitoringConfig>) {
    this.id = id
    this.config = {
      enabled: true,
      collectionInterval: 5000, // 5秒
      dataRetentionTime: 24 * 60 * 60 * 1000, // 24小时
      maxHistoryRecords: 1000,
      thresholds: {
        queueSize: { warning: 100, critical: 500 },
        processingTime: { warning: 5000, critical: 10000 },
        errorRate: { warning: 0.05, critical: 0.1 },
        throughput: { min: 1, warning: 0.5 },
        resource: {
          cpu: { warning: 70, critical: 90 },
          memory: { warning: 80, critical: 95 },
          network: { warning: 80, critical: 95 },
          disk: { warning: 80, critical: 95 },
        },
      },
      enableAlerts: true,
      alertDedupTime: 5 * 60 * 1000, // 5分钟
      enableAutoReports: true,
      reportInterval: 60 * 60 * 1000, // 1小时
      ...config,
    }

    this.initialize()
  }

  /**
     * 初始化监控器
     */
  private initialize(): void {
    this.setupEventListeners()

    if (this.config.enabled) {
      this.startCollection()
    }

    if (this.config.enableAutoReports) {
      this.startReportGeneration()
    }

    globalEventBus.emit('monitor:initialized', {
      monitorId: this.id,
      config: this.config,
    })
  }

  /**
     * 设置事件监听器
     */
  private setupEventListeners(): void {
    // 监听队列事件
    globalEventBus.on('queue:taskAdded', (event) => {
      const data = event.data as any
      this.updateQueueMetrics(data.queueId, { currentSize: 1 })
    })

    globalEventBus.on('queue:taskStarted', (event) => {
      const data = event.data as any
      this.updateQueueMetrics(data.queueId, { processingTasks: 1 })
    })

    globalEventBus.on('queue:taskCompleted', (event) => {
      const data = event.data as any
      this.updateQueueMetrics(data.queueId, {
        completedTasks: 1,
        processingTasks: -1,
        currentSize: -1,
      })
    })

    globalEventBus.on('queue:taskFailed', (event) => {
      const data = event.data as any
      this.updateQueueMetrics(data.queueId, {
        failedTasks: 1,
        processingTasks: -1,
        currentSize: -1,
      })
    })

    // 监听调度器事件
    globalEventBus.on('scheduler:metricsUpdated', (event) => {
      const data = event.data as any
      this.updateSchedulerMetrics(data.schedulerId, data.metrics)
    })
  }

  /**
     * 更新队列指标
     */
  private updateQueueMetrics(queueId: string, updates: Partial<QueueMetrics>): void {
    const currentMetrics = this.metrics.get(queueId)

    if (!currentMetrics) {
      // 创建新的指标记录
      const newMetrics: QueueMetrics = {
        queueId,
        queueName: updates.queueName || queueId,
        queueType: updates.queueType || 'unknown',
        currentSize: 0,
        maxSize: 1000,
        processingTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageProcessingTime: 0,
        throughput: 0,
        successRate: 0,
        errorRate: 0,
        utilization: 0,
        lastUpdated: new Date(),
        healthStatus: 'unknown',
        resourceUsage: {
          cpuUsage: 0,
          memoryUsage: 0,
          networkIO: 0,
          diskIO: 0,
        },
        ...updates,
      }

      this.metrics.set(queueId, newMetrics)
    } else {
      // 更新现有指标
      Object.assign(currentMetrics, {
        ...updates,
        currentSize: Math.max(0, currentMetrics.currentSize + (updates.currentSize || 0)),
        processingTasks: Math.max(0, currentMetrics.processingTasks + (updates.processingTasks || 0)),
        completedTasks: currentMetrics.completedTasks + (updates.completedTasks || 0),
        failedTasks: currentMetrics.failedTasks + (updates.failedTasks || 0),
        lastUpdated: new Date(),
      })

      // 重新计算衍生指标
      this.recalculateDerivedMetrics(currentMetrics)
    }

    this.checkThresholds(queueId)
  }

  /**
     * 更新调度器指标
     */
  private updateSchedulerMetrics(schedulerId: string, metrics: any): void {
    this.updateQueueMetrics(schedulerId, {
      queueName: metrics.name || schedulerId,
      queueType: 'scheduler',
      averageProcessingTime: metrics.averageExecutionTime,
      throughput: metrics.tasksPerSecond,
      resourceUsage: metrics.resourceUsage,
    })
  }

  /**
     * 重新计算衍生指标
     */
  private recalculateDerivedMetrics(metrics: QueueMetrics): void {
    const totalTasks = metrics.completedTasks + metrics.failedTasks

    if (totalTasks > 0) {
      metrics.successRate = metrics.completedTasks / totalTasks
      metrics.errorRate = metrics.failedTasks / totalTasks
    } else {
      metrics.successRate = 0
      metrics.errorRate = 0
    }

    metrics.utilization = metrics.currentSize / metrics.maxSize
    metrics.healthStatus = this.calculateHealthStatus(metrics)
  }

  /**
     * 计算健康状态
     */
  private calculateHealthStatus(metrics: QueueMetrics): HealthStatus {
    const checks = [
      metrics.errorRate < this.config.thresholds.errorRate.critical,
      metrics.utilization < 0.9,
      metrics.averageProcessingTime < this.config.thresholds.processingTime.critical,
      metrics.resourceUsage.cpuUsage < this.config.thresholds.resource.cpu.critical,
      metrics.resourceUsage.memoryUsage < this.config.thresholds.resource.memory.critical,
    ]

    const criticalChecks = checks.filter(Boolean).length

    if (criticalChecks === checks.length) {
      return 'healthy'
    } else if (criticalChecks >= checks.length * 0.7) {
      return 'warning'
    } else {
      return 'critical'
    }
  }

  /**
     * 检查阈值
     */
  private checkThresholds(queueId: string): void {
    if (!this.config.enableAlerts) {
      return
    }

    const metrics = this.metrics.get(queueId)
    if (!metrics) {
      return
    }

    // 检查各种阈值
    this.checkQueueSizeThreshold(metrics)
    this.checkProcessingTimeThreshold(metrics)
    this.checkErrorRateThreshold(metrics)
    this.checkThroughputThreshold(metrics)
    this.checkResourceThresholds(metrics)
  }

  /**
     * 检查队列大小阈值
     */
  private checkQueueSizeThreshold(metrics: QueueMetrics): void {
    const thresholds = this.config.thresholds.queueSize

    if (metrics.currentSize >= thresholds.critical) {
      this.createAlert(metrics.queueId, 'queue_size_exceeded', 'critical',
        '队列大小达到临界值', metrics.currentSize, thresholds.critical)
    } else if (metrics.currentSize >= thresholds.warning) {
      this.createAlert(metrics.queueId, 'queue_size_exceeded', 'warning',
        '队列大小达到警告值', metrics.currentSize, thresholds.warning)
    }
  }

  /**
     * 检查处理时间阈值
     */
  private checkProcessingTimeThreshold(metrics: QueueMetrics): void {
    const thresholds = this.config.thresholds.processingTime

    if (metrics.averageProcessingTime >= thresholds.critical) {
      this.createAlert(metrics.queueId, 'processing_time_exceeded', 'critical',
        '平均处理时间过长', metrics.averageProcessingTime, thresholds.critical)
    } else if (metrics.averageProcessingTime >= thresholds.warning) {
      this.createAlert(metrics.queueId, 'processing_time_exceeded', 'warning',
        '平均处理时间偏长', metrics.averageProcessingTime, thresholds.warning)
    }
  }

  /**
     * 检查错误率阈值
     */
  private checkErrorRateThreshold(metrics: QueueMetrics): void {
    const thresholds = this.config.thresholds.errorRate

    if (metrics.errorRate >= thresholds.critical) {
      this.createAlert(metrics.queueId, 'error_rate_high', 'critical',
        '错误率过高', metrics.errorRate, thresholds.critical)
    } else if (metrics.errorRate >= thresholds.warning) {
      this.createAlert(metrics.queueId, 'error_rate_high', 'warning',
        '错误率偏高', metrics.errorRate, thresholds.warning)
    }
  }

  /**
     * 检查吞吐量阈值
     */
  private checkThroughputThreshold(metrics: QueueMetrics): void {
    const thresholds = this.config.thresholds.throughput

    if (metrics.throughput < thresholds.warning) {
      this.createAlert(metrics.queueId, 'throughput_low', 'warning',
        '吞吐量偏低', metrics.throughput, thresholds.warning)
    }
  }

  /**
     * 检查资源阈值
     */
  private checkResourceThresholds(metrics: QueueMetrics): void {
    const thresholds = this.config.thresholds.resource
    const resource = metrics.resourceUsage

    // CPU使用率
    if (resource.cpuUsage >= thresholds.cpu.critical) {
      this.createAlert(metrics.queueId, 'cpu_usage_high', 'critical',
        'CPU使用率过高', resource.cpuUsage, thresholds.cpu.critical)
    } else if (resource.cpuUsage >= thresholds.cpu.warning) {
      this.createAlert(metrics.queueId, 'cpu_usage_high', 'warning',
        'CPU使用率偏高', resource.cpuUsage, thresholds.cpu.warning)
    }

    // 内存使用
    if (resource.memoryUsage >= thresholds.memory.critical) {
      this.createAlert(metrics.queueId, 'memory_usage_high', 'critical',
        '内存使用过高', resource.memoryUsage, thresholds.memory.critical)
    } else if (resource.memoryUsage >= thresholds.memory.warning) {
      this.createAlert(metrics.queueId, 'memory_usage_high', 'warning',
        '内存使用偏高', resource.memoryUsage, thresholds.memory.warning)
    }
  }

  /**
     * 创建告警
     */
  private createAlert(
    queueId: string,
    type: AlertType,
    level: AlertLevel,
    message: string,
    currentValue: number,
    threshold: number,
  ): void {
    // 检查是否需要去重
    const existingAlert = Array.from(this.alerts.values()).find(alert =>
      alert.queueId === queueId &&
            alert.type === type &&
            alert.level === level &&
            !alert.acknowledged &&
            Date.now() - alert.timestamp.getTime() < this.config.alertDedupTime,
    )

    if (existingAlert) {
      return // 已存在相同告警，跳过
    }

    const alert: MonitoringAlert = {
      id: `alert_${this.alertIdCounter++}_${Date.now()}`,
      queueId,
      type,
      level,
      message,
      currentValue,
      threshold,
      timestamp: new Date(),
      acknowledged: false,
    }

    this.alerts.set(alert.id, alert)

    globalEventBus.emit('monitor:alertTriggered', {
      monitorId: this.id,
      alert,
    })
  }

  /**
     * 开始数据收集
     */
  private startCollection(): void {
    this.collectionTimer = window.setInterval(() => {
      this.collectMetrics()
    }, this.config.collectionInterval)
  }

  /**
     * 收集指标数据
     */
  private collectMetrics(): void {
    // 收集资源使用情况
    this.collectResourceUsage()

    // 保存历史记录
    this.saveHistoryRecord()

    // 清理过期数据
    this.cleanupExpiredData()

    globalEventBus.emit('monitor:metricsCollected', {
      monitorId: this.id,
      timestamp: new Date(),
      metricsCount: this.metrics.size,
    })
  }

  /**
     * 收集资源使用情况
     */
  private collectResourceUsage(): void {
    // 浏览器环境下的资源使用估算
    const performanceInfo = (performance as any).memory || {}

    for (const [queueId, metrics] of this.metrics) {
      // 简化的资源使用估算
      metrics.resourceUsage = {
        cpuUsage: Math.random() * 100, // 实际应用中需要真实的CPU监控
        memoryUsage: performanceInfo.usedJSHeapSize ?
          (performanceInfo.usedJSHeapSize / 1024 / 1024) : 0,
        networkIO: Math.random() * 100, // 实际应用中需要网络监控
        diskIO: Math.random() * 100, // 实际应用中需要磁盘监控
      }
    }
  }

  /**
     * 保存历史记录
     */
  private saveHistoryRecord(): void {
    const record = {
      timestamp: new Date(),
      metrics: new Map(this.metrics),
    }

    this.history.push(record)

    // 限制历史记录数量
    if (this.history.length > this.config.maxHistoryRecords) {
      this.history.splice(0, this.history.length - this.config.maxHistoryRecords)
    }
  }

  /**
     * 清理过期数据
     */
  private cleanupExpiredData(): void {
    const now = Date.now()
    const retentionTime = this.config.dataRetentionTime

    // 清理过期历史记录
    this.history.splice(0,
      this.history.findIndex(record =>
        now - record.timestamp.getTime() < retentionTime,
      ),
    )

    // 清理已确认的告警
    for (const [alertId, alert] of this.alerts) {
      if (alert.acknowledged && alert.acknowledgedAt &&
                now - alert.acknowledgedAt.getTime() > retentionTime) {
        this.alerts.delete(alertId)
      }
    }
  }

  /**
     * 开始报告生成
     */
  private startReportGeneration(): void {
    this.reportTimer = window.setInterval(() => {
      this.generateReport('hourly')
    }, this.config.reportInterval)
  }

  /**
     * 生成监控报告
     */
  generateReport(type: ReportType = 'realtime'): MonitoringReport {
    const now = new Date()
    const timeRange = this.getReportTimeRange(type, now)

    const report: MonitoringReport = {
      id: `report_${type}_${now.getTime()}`,
      type,
      generatedAt: now,
      timeRange,
      summary: this.generateSummary(),
      metrics: Array.from(this.metrics.values()),
      alerts: Array.from(this.alerts.values()),
      trends: this.analyzeTrends(),
      recommendations: this.generateRecommendations(),
    }

    globalEventBus.emit('monitor:reportGenerated', {
      monitorId: this.id,
      report,
    })

    return report
  }

  /**
     * 获取报告时间范围
     */
  private getReportTimeRange(type: ReportType, endTime: Date): { start: Date; end: Date } {
    const end = new Date(endTime)
    const start = new Date(endTime)

    switch (type) {
    case 'hourly':
      start.setHours(start.getHours() - 1)
      break
    case 'daily':
      start.setDate(start.getDate() - 1)
      break
    case 'weekly':
      start.setDate(start.getDate() - 7)
      break
    case 'monthly':
      start.setMonth(start.getMonth() - 1)
      break
    default: // realtime
      start.setMinutes(start.getMinutes() - 5)
      break
    }

    return { start, end }
  }

  /**
     * 生成汇总信息
     */
  private generateSummary() {
    const metrics = Array.from(this.metrics.values())

    return {
      totalQueues: metrics.length,
      totalTasks: metrics.reduce((sum, m) => sum + m.completedTasks + m.failedTasks, 0),
      totalCompletedTasks: metrics.reduce((sum, m) => sum + m.completedTasks, 0),
      totalFailedTasks: metrics.reduce((sum, m) => sum + m.failedTasks, 0),
      averageSuccessRate: metrics.length > 0 ?
        metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length : 0,
      averageProcessingTime: metrics.length > 0 ?
        metrics.reduce((sum, m) => sum + m.averageProcessingTime, 0) / metrics.length : 0,
      totalThroughput: metrics.reduce((sum, m) => sum + m.throughput, 0),
    }
  }

  /**
     * 分析趋势
     */
  private analyzeTrends(): MonitoringReport['trends'] {
    // 简化的趋势分析，实际应用中需要更复杂的算法
    return {
      queueSizeTrend: 'stable',
      processingTimeTrend: 'stable',
      throughputTrend: 'stable',
      errorRateTrend: 'stable',
    }
  }

  /**
     * 生成建议
     */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const metrics = Array.from(this.metrics.values())

    // 基于指标生成建议
    const highErrorRateQueues = metrics.filter(m => m.errorRate > 0.05)
    if (highErrorRateQueues.length > 0) {
      recommendations.push('检测到部分队列错误率较高，建议检查任务逻辑和错误处理机制')
    }

    const highUtilizationQueues = metrics.filter(m => m.utilization > 0.8)
    if (highUtilizationQueues.length > 0) {
      recommendations.push('检测到部分队列利用率较高，建议增加队列容量或优化处理逻辑')
    }

    const slowProcessingQueues = metrics.filter(m =>
      m.averageProcessingTime > this.config.thresholds.processingTime.warning)
    if (slowProcessingQueues.length > 0) {
      recommendations.push('检测到部分队列处理时间偏长，建议优化任务执行逻辑')
    }

    return recommendations
  }

  /**
     * 确认告警
     */
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean {
    const alert = this.alerts.get(alertId)
    if (!alert || alert.acknowledged) {
      return false
    }

    alert.acknowledged = true
    alert.acknowledgedAt = new Date()
    if (acknowledgedBy) {
      alert.acknowledgedBy = acknowledgedBy
    }

    globalEventBus.emit('monitor:alertAcknowledged', {
      monitorId: this.id,
      alertId,
      acknowledgedBy,
    })

    return true
  }

  /**
     * 获取队列指标
     */
  getQueueMetrics(queueId: string): QueueMetrics | null {
    return this.metrics.get(queueId) || null
  }

  /**
     * 获取所有指标
     */
  getAllMetrics(): Map<string, QueueMetrics> {
    return new Map(this.metrics)
  }

  /**
     * 获取告警
     */
  getAlerts(filter?: {
        queueId?: string
        type?: AlertType
        level?: AlertLevel
        acknowledged?: boolean
    }): MonitoringAlert[] {
    let alerts = Array.from(this.alerts.values())

    if (filter) {
      if (filter.queueId) {
        alerts = alerts.filter(a => a.queueId === filter.queueId)
      }
      if (filter.type) {
        alerts = alerts.filter(a => a.type === filter.type)
      }
      if (filter.level) {
        alerts = alerts.filter(a => a.level === filter.level)
      }
      if (filter.acknowledged !== undefined) {
        alerts = alerts.filter(a => a.acknowledged === filter.acknowledged)
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
     * 获取历史记录
     */
  getHistory(timeRange?: { start: Date; end: Date }): Array<{ timestamp: Date; metrics: Map<string, QueueMetrics> }> {
    let history = this.history

    if (timeRange) {
      history = history.filter(record =>
        record.timestamp >= timeRange.start && record.timestamp <= timeRange.end,
      )
    }

    return history.slice() // 返回副本
  }

  /**
     * 获取配置
     */
  getConfig(): MonitoringConfig {
    return { ...this.config }
  }

  /**
     * 更新配置
     */
  updateConfig(config: Partial<MonitoringConfig>): void {
    const oldConfig = { ...this.config }
    this.config = { ...this.config, ...config }

    // 重启定时器（如果间隔发生变化）
    if (oldConfig.collectionInterval !== this.config.collectionInterval) {
      this.stopCollection()
      if (this.config.enabled) {
        this.startCollection()
      }
    }

    if (oldConfig.reportInterval !== this.config.reportInterval) {
      this.stopReportGeneration()
      if (this.config.enableAutoReports) {
        this.startReportGeneration()
      }
    }

    globalEventBus.emit('monitor:configUpdated', {
      monitorId: this.id,
      config: this.config,
    })
  }

  /**
     * 停止数据收集
     */
  private stopCollection(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer)
      this.collectionTimer = null
    }
  }

  /**
     * 停止报告生成
     */
  private stopReportGeneration(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer)
      this.reportTimer = null
    }
  }

  /**
     * 销毁监控器
     */
  destroy(): void {
    if (this.isDestroyed.value) {
      return
    }

    this.isDestroyed.value = true
    this.stopCollection()
    this.stopReportGeneration()

    globalEventBus.emit('monitor:destroyed', {
      monitorId: this.id,
    })
  }
}

export default QueueMonitor
