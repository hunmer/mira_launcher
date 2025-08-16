import { ref, reactive } from 'vue'
import type { NotificationAPI, NotificationOptions } from '../../types/plugin'

/**
 * 通知類型
 */
export type NotificationType = 'info' | 'success' | 'warn' | 'error'

/**
 * 通知項目
 */
export interface NotificationItem {
  /** 通知 ID */
  id: string
  /** 通知類型 */
  type: NotificationType
  /** 通知標題 */
  title?: string
  /** 通知內容 */
  message: string
  /** 通知選項 */
  options: NotificationOptions
  /** 創建時間 */
  createdAt: Date
  /** 來源插件 ID */
  pluginId: string
  /** 是否已顯示 */
  shown: boolean
  /** 是否已關閉 */
  closed: boolean
  /** 定時器 ID */
  timerId?: number
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  /** 默認持續時間（毫秒） */
  defaultDuration: number
  /** 最大通知數量 */
  maxNotifications: number
  /** 通知位置 */
  position: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center'
  /** 是否啟用音效 */
  enableSound: boolean
  /** 是否啟用動畫 */
  enableAnimation: boolean
  /** 是否自動清理已關閉的通知 */
  autoCleanup: boolean
  /** 清理間隔（毫秒） */
  cleanupInterval: number
}

/**
 * 通知事件
 */
export interface NotificationEvents {
  'notification:show': { notification: NotificationItem }
  'notification:close': { notification: NotificationItem }
  'notification:click': { notification: NotificationItem }
  'notification:timeout': { notification: NotificationItem }
  'notification:clear': { pluginId?: string }
  'notification:limit-exceeded': { pluginId: string; count: number; limit: number }
}

/**
 * 通知統計
 */
export interface NotificationStats {
  /** 總通知數 */
  total: number
  /** 按類型分組 */
  byType: Record<NotificationType, number>
  /** 按插件分組 */
  byPlugin: Record<string, {
    total: number
    byType: Record<NotificationType, number>
  }>
  /** 當前活躍通知數 */
  active: number
}

/**
 * 插件通知 API 實現
 */
export class PluginNotificationAPI implements NotificationAPI {
  private config: NotificationConfig
  private notifications = reactive(new Map<string, NotificationItem>())
  private eventListeners = reactive(new Map<keyof NotificationEvents, Function[]>())
  private cleanupTimer: number | null = null
  private notificationCounter = 0

  constructor(config?: Partial<NotificationConfig>) {
    this.config = {
      defaultDuration: 5000, // 5秒
      maxNotifications: 50,
      position: 'top-right',
      enableSound: false,
      enableAnimation: true,
      autoCleanup: true,
      cleanupInterval: 30000, // 30秒
      ...config,
    }

    this.initializeEventSystem()
    
    if (this.config.autoCleanup) {
      this.startCleanupTimer()
    }
  }

  /**
   * 初始化事件系統
   */
  private initializeEventSystem(): void {
    const eventTypes: (keyof NotificationEvents)[] = [
      'notification:show',
      'notification:close',
      'notification:click',
      'notification:timeout',
      'notification:clear',
      'notification:limit-exceeded',
    ]

    for (const eventType of eventTypes) {
      this.eventListeners.set(eventType, [])
    }
  }

  /**
   * 啟動清理定時器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = window.setInterval(() => {
      this.cleanupClosedNotifications()
    }, this.config.cleanupInterval)
  }

  /**
   * 生成通知 ID
   */
  private generateId(): string {
    return `notification-${++this.notificationCounter}-${Date.now()}`
  }

  /**
   * 檢查通知限制
   */
  private checkLimit(pluginId: string): boolean {
    const pluginNotifications = Array.from(this.notifications.values())
      .filter(n => n.pluginId === pluginId && !n.closed)

    if (pluginNotifications.length >= this.config.maxNotifications) {
      this.emit('notification:limit-exceeded', {
        pluginId,
        count: pluginNotifications.length,
        limit: this.config.maxNotifications,
      })
      return false
    }

    return true
  }

  /**
   * 創建通知項目
   */
  private createNotification(
    type: NotificationType,
    message: string,
    title?: string,
    options?: NotificationOptions,
    pluginId: string = 'system',
  ): NotificationItem {
    const id = this.generateId()
    const finalOptions: NotificationOptions = {
      duration: this.config.defaultDuration,
      closable: true,
      ...options,
    }

    const notification: NotificationItem = {
      id,
      type,
      message,
      options: finalOptions,
      createdAt: new Date(),
      pluginId,
      shown: false,
      closed: false,
      ...(title && { title }),
    }

    return notification
  }

  /**
   * 顯示通知
   */
  private showNotification(notification: NotificationItem): void {
    if (!this.checkLimit(notification.pluginId)) {
      return
    }

    // 添加到通知列表
    this.notifications.set(notification.id, notification)
    notification.shown = true

    // 觸發顯示事件
    this.emit('notification:show', { notification })

    // 設置自動關閉定時器
    if (notification.options.duration && notification.options.duration > 0) {
      notification.timerId = window.setTimeout(() => {
        this.closeNotification(notification.id, 'timeout')
      }, notification.options.duration)
    }

    // 播放音效（如果啟用）
    if (this.config.enableSound) {
      this.playNotificationSound(notification.type)
    }

    console.log(`[NotificationAPI] Showed ${notification.type} notification: ${notification.message}`)
  }

  /**
   * 關閉通知
   */
  private closeNotification(id: string, reason: 'user' | 'timeout' | 'auto' = 'user'): void {
    const notification = this.notifications.get(id)
    if (!notification || notification.closed) {
      return
    }

    // 清理定時器
    if (notification.timerId) {
      clearTimeout(notification.timerId)
      delete notification.timerId
    }

    // 標記為已關閉
    notification.closed = true

    // 觸發關閉事件
    this.emit('notification:close', { notification })

    // 如果是超時關閉，觸發超時事件
    if (reason === 'timeout') {
      this.emit('notification:timeout', { notification })
    }

    // 執行關閉回調
    if (notification.options.onClose) {
      try {
        notification.options.onClose()
      } catch (error) {
        console.error('[NotificationAPI] Error in onClose callback:', error)
      }
    }

    console.log(`[NotificationAPI] Closed notification ${id} (reason: ${reason})`)
  }

  /**
   * 播放通知音效
   */
  private playNotificationSound(type: NotificationType): void {
    // 這裡可以實現音效播放邏輯
    // 例如使用 Web Audio API 或 HTML5 Audio
    try {
      // 簡單的系統提示音
      if ('Notification' in window && Notification.permission === 'granted') {
        // 使用系統通知的音效
      }
    } catch (error) {
      console.warn('[NotificationAPI] Failed to play notification sound:', error)
    }
  }

  /**
   * 清理已關閉的通知
   */
  private cleanupClosedNotifications(): void {
    const closedIds: string[] = []
    const cutoffTime = new Date(Date.now() - this.config.cleanupInterval)

    for (const [id, notification] of Array.from(this.notifications.entries())) {
      if (notification.closed && notification.createdAt < cutoffTime) {
        closedIds.push(id)
      }
    }

    for (const id of closedIds) {
      this.notifications.delete(id)
    }

    if (closedIds.length > 0) {
      console.log(`[NotificationAPI] Cleaned up ${closedIds.length} old notifications`)
    }
  }

  /**
   * 顯示信息通知
   */
  info(message: string, title?: string, options?: NotificationOptions): void {
    this.show('info', message, title, options)
  }

  /**
   * 顯示成功通知
   */
  success(message: string, title?: string, options?: NotificationOptions): void {
    this.show('success', message, title, options)
  }

  /**
   * 顯示警告通知
   */
  warn(message: string, title?: string, options?: NotificationOptions): void {
    this.show('warn', message, title, options)
  }

  /**
   * 顯示錯誤通知
   */
  error(message: string, title?: string, options?: NotificationOptions): void {
    this.show('error', message, title, options)
  }

  /**
   * 顯示自定義通知
   */
  show(type: NotificationType, message: string, title?: string, options?: NotificationOptions): void {
    const notification = this.createNotification(type, message, title, options, 'system')
    this.showNotification(notification)
  }

  /**
   * 為特定插件顯示通知
   */
  showForPlugin(
    pluginId: string,
    type: NotificationType,
    message: string,
    title?: string,
    options?: NotificationOptions,
  ): string {
    const notification = this.createNotification(type, message, title, options, pluginId)
    this.showNotification(notification)
    return notification.id
  }

  /**
   * 關閉指定通知
   */
  close(id: string): void {
    this.closeNotification(id, 'user')
  }

  /**
   * 關閉所有通知
   */
  closeAll(pluginId?: string): void {
    const toClose: string[] = []

    for (const [id, notification] of Array.from(this.notifications.entries())) {
      if (!notification.closed && (!pluginId || notification.pluginId === pluginId)) {
        toClose.push(id)
      }
    }

    for (const id of toClose) {
      this.closeNotification(id, 'auto')
    }

    // 觸發清空事件
    this.emit('notification:clear', pluginId ? { pluginId } : {})

    console.log(`[NotificationAPI] Closed ${toClose.length} notifications${pluginId ? ` for plugin ${pluginId}` : ''}`)
  }

  /**
   * 獲取所有通知
   */
  getAll(pluginId?: string): NotificationItem[] {
    const notifications = Array.from(this.notifications.values())
    
    if (pluginId) {
      return notifications.filter(n => n.pluginId === pluginId)
    }
    
    return notifications
  }

  /**
   * 獲取活躍通知
   */
  getActive(pluginId?: string): NotificationItem[] {
    return this.getAll(pluginId).filter(n => n.shown && !n.closed)
  }

  /**
   * 獲取指定通知
   */
  getById(id: string): NotificationItem | null {
    return this.notifications.get(id) || null
  }

  /**
   * 檢查是否存在指定通知
   */
  has(id: string): boolean {
    const notification = this.notifications.get(id)
    return notification ? !notification.closed : false
  }

  /**
   * 手動觸發通知點擊事件
   */
  click(id: string): void {
    const notification = this.notifications.get(id)
    if (!notification || notification.closed) {
      return
    }

    // 觸發點擊事件
    this.emit('notification:click', { notification })

    // 執行點擊回調
    if (notification.options.onClick) {
      try {
        notification.options.onClick()
      } catch (error) {
        console.error('[NotificationAPI] Error in onClick callback:', error)
      }
    }
  }

  /**
   * 獲取通知統計
   */
  getStats(): NotificationStats {
    const notifications = Array.from(this.notifications.values())
    const stats: NotificationStats = {
      total: notifications.length,
      byType: { info: 0, success: 0, warn: 0, error: 0 },
      byPlugin: {},
      active: 0,
    }

    for (const notification of notifications) {
      // 按類型統計
      stats.byType[notification.type]++

      // 按插件統計
      if (!stats.byPlugin[notification.pluginId]) {
        stats.byPlugin[notification.pluginId] = {
          total: 0,
          byType: { info: 0, success: 0, warn: 0, error: 0 },
        }
      }
      const pluginStats = stats.byPlugin[notification.pluginId]!
      pluginStats.total++
      pluginStats.byType[notification.type]++

      // 活躍通知統計
      if (notification.shown && !notification.closed) {
        stats.active++
      }
    }

    return stats
  }

  /**
   * 事件監聽
   */
  on<T extends keyof NotificationEvents>(event: T, listener: (data: NotificationEvents[T]) => void): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件監聽
   */
  off<T extends keyof NotificationEvents>(event: T, listener: (data: NotificationEvents[T]) => void): void {
    const listeners = this.eventListeners.get(event) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 觸發事件
   */
  private emit<T extends keyof NotificationEvents>(event: T, data: NotificationEvents[T]): void {
    const listeners = this.eventListeners.get(event) || []
    for (const listener of listeners) {
      try {
        listener(data)
      } catch (error) {
        console.error(`[NotificationAPI] Event listener error for ${event}:`, error)
      }
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // 重啟清理定時器
    if (newConfig.cleanupInterval !== undefined || newConfig.autoCleanup !== undefined) {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer)
        this.cleanupTimer = null
      }
      
      if (this.config.autoCleanup) {
        this.startCleanupTimer()
      }
    }

    console.log('[NotificationAPI] Configuration updated')
  }

  /**
   * 獲取配置
   */
  getConfig(): NotificationConfig {
    return { ...this.config }
  }

  /**
   * 請求通知權限（針對瀏覽器通知）
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[NotificationAPI] Browser notifications not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      console.log(`[NotificationAPI] Notification permission: ${permission}`)
      return permission
    } catch (error) {
      console.error('[NotificationAPI] Failed to request notification permission:', error)
      return 'denied'
    }
  }

  /**
   * 顯示原生瀏覽器通知
   */
  showNative(
    title: string,
    options?: {
      body?: string
      icon?: string
      badge?: string
      tag?: string
      data?: any
      requireInteraction?: boolean
    },
  ): Notification | null {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('[NotificationAPI] Native notifications not available')
      return null
    }

    try {
      const notification = new Notification(title, options)
      
      notification.onclick = () => {
        // 聚焦到應用窗口
        window.focus()
        notification.close()
      }

      return notification
    } catch (error) {
      console.error('[NotificationAPI] Failed to show native notification:', error)
      return null
    }
  }

  /**
   * 清空所有通知並重置
   */
  reset(): void {
    // 清理所有定時器
    for (const notification of Array.from(this.notifications.values())) {
      if (notification.timerId) {
        clearTimeout(notification.timerId)
      }
    }

    // 清空通知列表
    this.notifications.clear()

    // 重置計數器
    this.notificationCounter = 0

    console.log('[NotificationAPI] Reset all notifications')
  }

  /**
   * 銷毀 API
   */
  destroy(): void {
    // 清理清理定時器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    // 清理所有通知定時器
    for (const notification of Array.from(this.notifications.values())) {
      if (notification.timerId) {
        clearTimeout(notification.timerId)
      }
    }

    // 清空數據
    this.notifications.clear()
    this.eventListeners.clear()

    console.log('[NotificationAPI] API destroyed')
  }
}

/**
 * 創建通知 API 實例
 */
export function createNotificationAPI(config?: Partial<NotificationConfig>): PluginNotificationAPI {
  return new PluginNotificationAPI(config)
}

/**
 * 全局通知 API 實例
 */
export const globalNotificationAPI = new PluginNotificationAPI()

/**
 * 通知工具函數
 */
export const notificationUtils = {
  /**
   * 驗證通知消息
   */
  isValidMessage(message: string): boolean {
    return typeof message === 'string' && message.trim().length > 0 && message.length <= 500
  },

  /**
   * 清理通知消息
   */
  sanitizeMessage(message: string): string {
    return message.replace(/[<>]/g, '').trim().slice(0, 500)
  },

  /**
   * 格式化通知時間
   */
  formatTime(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) { // 小於1分鐘
      return '剛剛'
    } else if (diff < 3600000) { // 小於1小時
      return `${Math.floor(diff / 60000)}分鐘前`
    } else if (diff < 86400000) { // 小於1天
      return `${Math.floor(diff / 3600000)}小時前`
    } else {
      return date.toLocaleDateString()
    }
  },

  /**
   * 獲取通知圖標
   */
  getTypeIcon(type: NotificationType): string {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warn: '⚠️',
      error: '❌',
    }
    return icons[type] || icons.info
  },

  /**
   * 獲取通知顏色
   */
  getTypeColor(type: NotificationType): string {
    const colors = {
      info: '#3b82f6',
      success: '#10b981',
      warn: '#f59e0b',
      error: '#ef4444',
    }
    return colors[type] || colors.info
  },
}
