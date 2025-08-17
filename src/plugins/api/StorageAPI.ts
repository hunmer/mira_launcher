import { ref, reactive, watch } from 'vue'
import type { StorageAPI } from '../../types/plugin'

/**
 * 存儲項目
 */
export interface StorageItem<T = any> {
  /** 值 */
  value: T
  /** 創建時間 */
  createdAt: Date
  /** 更新時間 */
  updatedAt: Date
  /** 過期時間 */
  expiresAt?: Date
  /** 是否加密 */
  encrypted?: boolean
  /** 元數據 */
  metadata?: Record<string, any>
}

/**
 * 存儲配置
 */
export interface StorageConfig {
  /** 插件命名空間前綴 */
  namespacePrefix: string
  /** 是否啟用加密 */
  enableEncryption: boolean
  /** 加密密鑰 */
  encryptionKey?: string
  /** 數據過期檢查間隔（毫秒） */
  cleanupInterval: number
  /** 最大存儲大小（字節） */
  maxStorageSize: number
  /** 是否啟用變更監聽 */
  enableWatcher: boolean
}

/**
 * 存儲事件
 */
export interface StorageEvents {
  'storage:set': { key: string; value: any; pluginId: string }
  'storage:get': { key: string; value: any; pluginId: string }
  'storage:remove': { key: string; pluginId: string }
  'storage:clear': { pluginId: string }
  'storage:expired': { key: string; pluginId: string }
  'storage:quota-exceeded': { pluginId: string; size: number; limit: number }
}

/**
 * 存儲統計
 */
export interface StorageStats {
  /** 總項目數 */
  totalItems: number
  /** 使用的存儲大小（字節） */
  usedSize: number
  /** 過期項目數 */
  expiredItems: number
  /** 按插件分組的統計 */
  byPlugin: Record<
    string,
    {
      items: number
      size: number
    }
  >
}

/**
 * 插件存儲 API 實現類（內部使用）
 */
export class PluginStorageAPIImpl {
  private config: StorageConfig
  private eventListeners = reactive(new Map<keyof StorageEvents, Function[]>())
  private cleanupTimer: number | null = null
  private watchers = new Map<string, Function>()

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      namespacePrefix: 'mira-plugin',
      enableEncryption: false,
      cleanupInterval: 5 * 60 * 1000, // 5分鐘
      maxStorageSize: 10 * 1024 * 1024, // 10MB
      enableWatcher: true,
      ...config,
    }

    this.initializeEventSystem()
    this.startCleanupTimer()

    if (this.config.enableWatcher) {
      this.setupStorageWatcher()
    }
  }

  /**
   * 初始化事件系統
   */
  private initializeEventSystem(): void {
    const eventTypes: (keyof StorageEvents)[] = [
      'storage:set',
      'storage:get',
      'storage:remove',
      'storage:clear',
      'storage:expired',
      'storage:quota-exceeded',
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
      this.cleanupExpiredItems()
    }, this.config.cleanupInterval)
  }

  /**
   * 設置存儲監聽器
   */
  private setupStorageWatcher(): void {
    // 監聽localStorage變化
    window.addEventListener('storage', event => {
      if (event.key && event.key.startsWith(this.config.namespacePrefix)) {
        const pluginKey = this.extractPluginKey(event.key)
        if (pluginKey) {
          // 觸發相應事件
          // 這裡可以解析事件類型並觸發相應的存儲事件
        }
      }
    })
  }

  /**
   * 生成命名空間鍵
   */
  private getNamespacedKey(pluginId: string, key: string): string {
    return `${this.config.namespacePrefix}:${pluginId}:${key}`
  }

  /**
   * 從命名空間鍵提取插件鍵信息
   */
  private extractPluginKey(
    namespacedKey: string,
  ): { pluginId: string; key: string } | null {
    const prefix = `${this.config.namespacePrefix}:`
    if (!namespacedKey.startsWith(prefix)) {
      return null
    }

    const parts = namespacedKey.slice(prefix.length).split(':')
    if (parts.length < 2) {
      return null
    }

    const pluginId = parts[0]
    if (!pluginId) {
      return null
    }

    return {
      pluginId,
      key: parts.slice(1).join(':'),
    }
  }

  /**
   * 序列化存儲項目
   */
  private serializeItem<T>(
    value: T,
    options?: {
      expiresIn?: number
      encrypted?: boolean
      metadata?: Record<string, any>
    },
  ): string {
    const now = new Date()
    const item: StorageItem<T> = {
      value,
      createdAt: now,
      updatedAt: now,
      ...(options?.expiresIn && {
        expiresAt: new Date(now.getTime() + options.expiresIn),
      }),
      ...(options?.encrypted && { encrypted: options.encrypted }),
      ...(options?.metadata && { metadata: options.metadata }),
    }

    let serialized = JSON.stringify(item)

    // 簡單加密（生產環境應使用更安全的加密方式）
    if (options?.encrypted && this.config.enableEncryption) {
      serialized = this.encrypt(serialized)
    }

    return serialized
  }

  /**
   * 反序列化存儲項目
   */
  private deserializeItem<T>(
    serialized: string,
    encrypted = false,
  ): StorageItem<T> | null {
    try {
      let data = serialized

      // 解密
      if (encrypted && this.config.enableEncryption) {
        data = this.decrypt(data)
      }

      const item: StorageItem<T> = JSON.parse(data)

      // 轉換日期
      item.createdAt = new Date(item.createdAt)
      item.updatedAt = new Date(item.updatedAt)
      if (item.expiresAt) {
        item.expiresAt = new Date(item.expiresAt)
      }

      // 檢查是否過期
      if (item.expiresAt && item.expiresAt < new Date()) {
        return null
      }

      return item
    } catch (error) {
      console.error('[StorageAPI] Failed to deserialize item:', error)
      return null
    }
  }

  /**
   * 簡單加密（示例實現）
   */
  private encrypt(data: string): string {
    if (!this.config.encryptionKey) {
      return data
    }
    // 這裡應該使用更安全的加密算法
    return btoa(data)
  }

  /**
   * 簡單解密（示例實現）
   */
  private decrypt(data: string): string {
    if (!this.config.encryptionKey) {
      return data
    }
    // 這裡應該使用相應的解密算法
    return atob(data)
  }

  /**
   * 檢查存儲配額
   */
  private checkQuota(pluginId: string, newDataSize: number): boolean {
    const stats = this.getPluginStats(pluginId)
    const totalSize = stats.size + newDataSize

    if (totalSize > this.config.maxStorageSize) {
      this.emit('storage:quota-exceeded', {
        pluginId,
        size: totalSize,
        limit: this.config.maxStorageSize,
      })
      return false
    }

    return true
  }

  /**
   * 獲取插件存儲統計
   */
  private getPluginStats(pluginId: string): { items: number; size: number } {
    let items = 0
    let size = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        key.startsWith(`${this.config.namespacePrefix}:${pluginId}:`)
      ) {
        const value = localStorage.getItem(key)
        if (value) {
          items++
          size += value.length
        }
      }
    }

    return { items, size }
  }

  /**
   * 設置值
   */
  set<T>(
    key: string,
    value: T,
    pluginId: string,
    options?: {
      expiresIn?: number
      encrypted?: boolean
      metadata?: Record<string, any>
    },
  ): void {
    const namespacedKey = this.getNamespacedKey(pluginId, key)
    const serialized = this.serializeItem(value, options)

    // 檢查配額
    if (!this.checkQuota(pluginId, serialized.length)) {
      throw new Error(`Storage quota exceeded for plugin: ${pluginId}`)
    }

    try {
      localStorage.setItem(namespacedKey, serialized)

      // 觸發事件
      this.emit('storage:set', { key, value, pluginId })

      console.log(`[StorageAPI] Set item: ${pluginId}:${key}`)
    } catch (error) {
      console.error(
        `[StorageAPI] Failed to set item ${pluginId}:${key}:`,
        error,
      )
      throw error
    }
  }

  /**
   * 獲取值
   */
  get<T>(key: string, pluginId: string, defaultValue?: T): T | undefined {
    const namespacedKey = this.getNamespacedKey(pluginId, key)

    try {
      const serialized = localStorage.getItem(namespacedKey)
      if (serialized === null) {
        return defaultValue
      }

      const item = this.deserializeItem<T>(serialized)
      if (item === null) {
        // 過期或無效的項目，移除它
        localStorage.removeItem(namespacedKey)
        this.emit('storage:expired', { key, pluginId })
        return defaultValue
      }

      // 觸發事件
      this.emit('storage:get', { key, value: item.value, pluginId })

      return item.value
    } catch (error) {
      console.error(
        `[StorageAPI] Failed to get item ${pluginId}:${key}:`,
        error,
      )
      return defaultValue
    }
  }

  /**
   * 移除值
   */
  remove(key: string, pluginId: string): void {
    const namespacedKey = this.getNamespacedKey(pluginId, key)

    try {
      localStorage.removeItem(namespacedKey)

      // 觸發事件
      this.emit('storage:remove', { key, pluginId })

      console.log(`[StorageAPI] Removed item: ${pluginId}:${key}`)
    } catch (error) {
      console.error(
        `[StorageAPI] Failed to remove item ${pluginId}:${key}:`,
        error,
      )
      throw error
    }
  }

  /**
   * 檢查鍵是否存在
   */
  has(key: string, pluginId: string): boolean {
    const namespacedKey = this.getNamespacedKey(pluginId, key)
    const value = localStorage.getItem(namespacedKey)

    if (value === null) {
      return false
    }

    // 檢查是否過期
    const item = this.deserializeItem(value)
    if (item === null) {
      localStorage.removeItem(namespacedKey)
      return false
    }

    return true
  }

  /**
   * 獲取所有鍵
   */
  keys(pluginId: string): string[] {
    const prefix = `${this.config.namespacePrefix}:${pluginId}:`
    const keys: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        const originalKey = key.slice(prefix.length)

        // 檢查項目是否有效
        const value = localStorage.getItem(key)
        if (value) {
          const item = this.deserializeItem(value)
          if (item !== null) {
            keys.push(originalKey)
          } else {
            // 清理過期項目
            localStorage.removeItem(key)
          }
        }
      }
    }

    return keys
  }

  /**
   * 清空插件的所有數據
   */
  clear(pluginId: string): void {
    const prefix = `${this.config.namespacePrefix}:${pluginId}:`
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }

    // 觸發事件
    this.emit('storage:clear', { pluginId })

    console.log(`[StorageAPI] Cleared all data for plugin: ${pluginId}`)
  }

  /**
   * 獲取項目詳情
   */
  getItem<T>(key: string, pluginId: string): StorageItem<T> | null {
    const namespacedKey = this.getNamespacedKey(pluginId, key)
    const serialized = localStorage.getItem(namespacedKey)

    if (serialized === null) {
      return null
    }

    return this.deserializeItem<T>(serialized)
  }

  /**
   * 設置項目詳情
   */
  setItem<T>(key: string, item: StorageItem<T>, pluginId: string): void {
    const namespacedKey = this.getNamespacedKey(pluginId, key)
    const serialized = JSON.stringify(item)

    // 檢查配額
    if (!this.checkQuota(pluginId, serialized.length)) {
      throw new Error(`Storage quota exceeded for plugin: ${pluginId}`)
    }

    localStorage.setItem(namespacedKey, serialized)
  }

  /**
   * 批量操作
   */
  batch(
    operations: Array<{
      operation: 'set' | 'remove'
      key: string
      value?: any
      options?: any
    }>,
    pluginId: string,
  ): void {
    const results: any[] = []

    for (const op of operations) {
      try {
        switch (op.operation) {
        case 'set':
          this.set(op.key, op.value, pluginId, op.options)
          results.push({ success: true, key: op.key })
          break
        case 'remove':
          this.remove(op.key, pluginId)
          results.push({ success: true, key: op.key })
          break
        }
      } catch (error) {
        results.push({
          success: false,
          key: op.key,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log(
      `[StorageAPI] Batch operation completed for plugin ${pluginId}:`,
      results,
    )
  }

  /**
   * 清理過期項目
   */
  private cleanupExpiredItems(): void {
    const prefix = this.config.namespacePrefix
    const expiredKeys: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        const value = localStorage.getItem(key)
        if (value) {
          const item = this.deserializeItem(value)
          if (item === null) {
            expiredKeys.push(key)
          }
        }
      }
    }

    for (const key of expiredKeys) {
      localStorage.removeItem(key)

      const keyInfo = this.extractPluginKey(key)
      if (keyInfo) {
        this.emit('storage:expired', {
          key: keyInfo.key,
          pluginId: keyInfo.pluginId,
        })
      }
    }

    if (expiredKeys.length > 0) {
      console.log(`[StorageAPI] Cleaned up ${expiredKeys.length} expired items`)
    }
  }

  /**
   * 獲取存儲統計
   */
  getStats(): StorageStats {
    const prefix = this.config.namespacePrefix
    let totalItems = 0
    let usedSize = 0
    let expiredItems = 0
    const byPlugin: Record<string, { items: number; size: number }> = {}

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        const value = localStorage.getItem(key)
        if (value) {
          const keyInfo = this.extractPluginKey(key)
          if (keyInfo) {
            const item = this.deserializeItem(value)
            if (item === null) {
              expiredItems++
            } else {
              totalItems++
              usedSize += value.length

              if (!byPlugin[keyInfo.pluginId]) {
                byPlugin[keyInfo.pluginId] = { items: 0, size: 0 }
              }
              const pluginStats = byPlugin[keyInfo.pluginId]!
              pluginStats.items++
              pluginStats.size += value.length
            }
          }
        }
      }
    }

    return {
      totalItems,
      usedSize,
      expiredItems,
      byPlugin,
    }
  }

  /**
   * 監聽鍵變化
   */
  watch<T>(
    key: string,
    pluginId: string,
    callback: (newValue: T | undefined, oldValue: T | undefined) => void,
  ): () => void {
    const watchKey = `${pluginId}:${key}`
    let currentValue = this.get<T>(key, pluginId)

    const watcher = () => {
      const newValue = this.get<T>(key, pluginId)
      if (newValue !== currentValue) {
        const oldValue = currentValue
        currentValue = newValue
        callback(newValue, oldValue)
      }
    }

    // 使用定時器模擬監聽（實際實現可以使用更高效的方式）
    const interval = setInterval(watcher, 1000)

    const unwatch = () => {
      clearInterval(interval)
      this.watchers.delete(watchKey)
    }

    this.watchers.set(watchKey, unwatch)
    return unwatch
  }

  /**
   * 事件監聽
   */
  on<T extends keyof StorageEvents>(
    event: T,
    listener: (data: StorageEvents[T]) => void,
  ): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件監聽
   */
  off<T extends keyof StorageEvents>(
    event: T,
    listener: (data: StorageEvents[T]) => void,
  ): void {
    const listeners = this.eventListeners.get(event) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 觸發事件
   */
  private emit<T extends keyof StorageEvents>(
    event: T,
    data: StorageEvents[T],
  ): void {
    const listeners = this.eventListeners.get(event) || []
    for (const listener of listeners) {
      try {
        listener(data)
      } catch (error) {
        console.error(`[StorageAPI] Event listener error for ${event}:`, error)
      }
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // 重啟清理定時器
    if (newConfig.cleanupInterval !== undefined) {
      this.startCleanupTimer()
    }

    console.log('[StorageAPI] Configuration updated')
  }

  /**
   * 獲取配置
   */
  getConfig(): StorageConfig {
    return { ...this.config }
  }

  /**
   * 銷毀 API
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    // 清理所有監聽器
    for (const unwatch of Array.from(this.watchers.values())) {
      unwatch()
    }
    this.watchers.clear()

    this.eventListeners.clear()
    console.log('[StorageAPI] API destroyed')
  }
}

/**
 * 插件存儲 API 適配器（符合 StorageAPI 接口）
 */
export class PluginStorageAPI implements StorageAPI {
  private impl: PluginStorageAPIImpl
  private currentPluginId: string = 'unknown'

  constructor(config?: Partial<StorageConfig>) {
    this.impl = new PluginStorageAPIImpl(config)
  }

  /**
   * 設置當前插件 ID
   */
  setCurrentPlugin(pluginId: string): void {
    this.currentPluginId = pluginId
  }

  /**
   * 獲取數據
   */
  get<T = unknown>(key: string): T | null {
    const result = this.impl.get<T>(key, this.currentPluginId)
    return result === undefined ? null : result
  }

  /**
   * 設置數據
   */
  set<T = unknown>(key: string, value: T): boolean {
    try {
      this.impl.set(key, value, this.currentPluginId)
      return true
    } catch {
      return false
    }
  }

  /**
   * 刪除數據
   */
  remove(key: string): boolean {
    try {
      this.impl.remove(key, this.currentPluginId)
      return true
    } catch {
      return false
    }
  }

  /**
   * 清空所有數據
   */
  clear(): boolean {
    try {
      this.impl.clear(this.currentPluginId)
      return true
    } catch {
      return false
    }
  }

  /**
   * 獲取所有鍵
   */
  keys(): string[] {
    return this.impl.keys(this.currentPluginId)
  }

  /**
   * 檢查鍵是否存在
   */
  has(key: string): boolean {
    return this.impl.has(key, this.currentPluginId)
  }

  /**
   * 獲取實現實例（供內部使用）
   */
  getImpl(): PluginStorageAPIImpl {
    return this.impl
  }
}

/**
 * 創建存儲 API 實例
 */
export function createStorageAPI(
  config?: Partial<StorageConfig>,
): PluginStorageAPI {
  return new PluginStorageAPI(config)
}

/**
 * 全局存儲 API 實例
 */
export const globalStorageAPI = new PluginStorageAPI()

/**
 * 存儲工具函數
 */
export const storageUtils = {
  /**
   * 計算數據大小
   */
  calculateSize(data: any): number {
    return JSON.stringify(data).length
  },

  /**
   * 格式化存儲大小
   */
  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  },

  /**
   * 驗證鍵名
   */
  isValidKey(key: string): boolean {
    // 檢查鍵名是否有效（不包含特殊字符）
    return /^[a-zA-Z0-9_.-]+$/.test(key) && key.length > 0 && key.length <= 250
  },

  /**
   * 清理鍵名
   */
  sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 250)
  },
}
