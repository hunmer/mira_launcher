import { ref, reactive, computed } from 'vue'

/**
 * 沙箱權限類型
 */
export type SandboxPermission = 
  | 'menu:read'           // 讀取菜單
  | 'menu:write'          // 修改菜單
  | 'shortcut:read'       // 讀取快捷鍵
  | 'shortcut:write'      // 註冊快捷鍵
  | 'storage:read'        // 讀取存儲
  | 'storage:write'       // 寫入存儲
  | 'notification:show'   // 顯示通知
  | 'ui:component'        // 註冊UI組件
  | 'ui:route'           // 註冊路由
  | 'system:info'        // 獲取系統信息
  | 'network:fetch'      // 網絡請求
  | 'file:read'          // 讀取文件
  | 'file:write'         // 寫入文件

/**
 * 沙箱策略
 */
export interface SandboxPolicy {
  /** 允許的權限列表 */
  permissions: SandboxPermission[]
  /** API 調用限制 */
  rateLimit: {
    /** 時間窗口（毫秒） */
    windowMs: number
    /** 最大調用次數 */
    maxCalls: number
  }
  /** 資源限制 */
  resourceLimits: {
    /** 最大內存使用（字節） */
    maxMemory: number
    /** 最大存儲大小（字節） */
    maxStorage: number
    /** 最大通知數量 */
    maxNotifications: number
  }
  /** 網絡訪問控制 */
  networkPolicy: {
    /** 允許的域名列表 */
    allowedDomains: string[]
    /** 是否允許本地地址 */
    allowLocalhost: boolean
    /** 是否允許 HTTP（僅 HTTPS） */
    allowHttp: boolean
  }
  /** 時間限制 */
  timePolicy: {
    /** 最大執行時間（毫秒） */
    maxExecutionTime: number
    /** 空閒超時時間（毫秒） */
    idleTimeout: number
  }
}

/**
 * 沙箱執行上下文
 */
export interface SandboxContext {
  /** 插件 ID */
  pluginId: string
  /** 插件權限 */
  permissions: Set<SandboxPermission>
  /** API 實例 */
  apis: {
    menu?: any
    shortcut?: any
    storage?: any
    notification?: any
  }
  /** 執行統計 */
  stats: {
    /** API 調用次數 */
    apiCalls: number
    /** 內存使用量 */
    memoryUsage: number
    /** 存儲使用量 */
    storageUsage: number
    /** 開始時間 */
    startTime: Date
    /** 最後活動時間 */
    lastActivity: Date
  }
  /** 是否已銷毀 */
  destroyed: boolean
}

/**
 * API 調用記錄
 */
export interface APICallRecord {
  /** 插件 ID */
  pluginId: string
  /** API 名稱 */
  apiName: string
  /** 方法名稱 */
  methodName: string
  /** 參數 */
  args: any[]
  /** 調用時間 */
  timestamp: Date
  /** 執行時間（毫秒） */
  duration: number
  /** 是否成功 */
  success: boolean
  /** 錯誤信息 */
  error?: string
}

/**
 * 沙箱事件
 */
export interface SandboxEvents {
  'sandbox:created': { pluginId: string; context: SandboxContext }
  'sandbox:destroyed': { pluginId: string; reason: string }
  'sandbox:permission-denied': { pluginId: string; permission: SandboxPermission; api: string; method: string }
  'sandbox:rate-limit-exceeded': { pluginId: string; api: string; method: string; limit: number }
  'sandbox:resource-limit-exceeded': { pluginId: string; resource: string; usage: number; limit: number }
  'sandbox:api-call': { pluginId: string; record: APICallRecord }
  'sandbox:error': { pluginId: string; error: Error; context?: any }
}

/**
 * 沙箱統計
 */
export interface SandboxStats {
  /** 活躍沙箱數量 */
  activeSandboxes: number
  /** 總 API 調用次數 */
  totalApiCalls: number
  /** 權限拒絕次數 */
  permissionDenials: number
  /** 限流觸發次數 */
  rateLimitHits: number
  /** 資源限制觸發次數 */
  resourceLimitHits: number
  /** 按插件分組的統計 */
  byPlugin: Record<string, {
    apiCalls: number
    memoryUsage: number
    storageUsage: number
    permissionDenials: number
    rateLimitHits: number
  }>
}

/**
 * 沙箱環境實現
 */
export class PluginSandbox {
  private policy: SandboxPolicy
  private contexts = reactive(new Map<string, SandboxContext>())
  private eventListeners = reactive(new Map<keyof SandboxEvents, Function[]>())
  private apiCallHistory: APICallRecord[] = []
  private rateLimitTracking = new Map<string, { calls: number; resetTime: number }>()

  constructor(policy?: Partial<SandboxPolicy>) {
    this.policy = {
      permissions: [],
      rateLimit: {
        windowMs: 60000, // 1分鐘
        maxCalls: 100
      },
      resourceLimits: {
        maxMemory: 50 * 1024 * 1024, // 50MB
        maxStorage: 10 * 1024 * 1024, // 10MB
        maxNotifications: 20
      },
      networkPolicy: {
        allowedDomains: [],
        allowLocalhost: false,
        allowHttp: false
      },
      timePolicy: {
        maxExecutionTime: 5000, // 5秒
        idleTimeout: 300000 // 5分鐘
      },
      ...policy
    }

    this.initializeEventSystem()
    this.startCleanupTimer()
  }

  /**
   * 初始化事件系統
   */
  private initializeEventSystem(): void {
    const eventTypes: (keyof SandboxEvents)[] = [
      'sandbox:created',
      'sandbox:destroyed',
      'sandbox:permission-denied',
      'sandbox:rate-limit-exceeded',
      'sandbox:resource-limit-exceeded',
      'sandbox:api-call',
      'sandbox:error'
    ]

    for (const eventType of eventTypes) {
      this.eventListeners.set(eventType, [])
    }
  }

  /**
   * 啟動清理定時器
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupIdleSandboxes()
      this.cleanupOldApiCalls()
      this.resetRateLimits()
    }, 60000) // 每分鐘檢查一次
  }

  /**
   * 創建沙箱上下文
   */
  createSandbox(
    pluginId: string,
    permissions: SandboxPermission[],
    apis: {
      menu?: any
      shortcut?: any
      storage?: any
      notification?: any
    }
  ): SandboxContext {
    if (this.contexts.has(pluginId)) {
      throw new Error(`Sandbox already exists for plugin: ${pluginId}`)
    }

    // 驗證權限
    const validPermissions = permissions.filter(p => this.policy.permissions.includes(p))
    if (validPermissions.length !== permissions.length) {
      const invalidPermissions = permissions.filter(p => !this.policy.permissions.includes(p))
      console.warn(`[Sandbox] Invalid permissions for ${pluginId}:`, invalidPermissions)
    }

    const context: SandboxContext = {
      pluginId,
      permissions: new Set(validPermissions),
      apis: this.wrapAPIs(pluginId, apis),
      stats: {
        apiCalls: 0,
        memoryUsage: 0,
        storageUsage: 0,
        startTime: new Date(),
        lastActivity: new Date()
      },
      destroyed: false
    }

    this.contexts.set(pluginId, context)

    // 觸發創建事件
    this.emit('sandbox:created', { pluginId, context })

    console.log(`[Sandbox] Created sandbox for plugin: ${pluginId}`)
    return context
  }

  /**
   * 包裝 API 以添加權限檢查和限流
   */
  private wrapAPIs(pluginId: string, apis: any): any {
    const wrappedAPIs: any = {}

    for (const [apiName, api] of Object.entries(apis)) {
      if (!api) continue

      wrappedAPIs[apiName] = new Proxy(api as object, {
        get: (target, prop) => {
          const original = (target as any)[prop]
          if (typeof original !== 'function') {
            return original
          }

          return (...args: any[]) => {
            const startTime = performance.now()
            const methodName = String(prop)

            try {
              // 檢查權限
              if (!this.checkPermission(pluginId, apiName, methodName)) {
                const requiredPermission = this.getRequiredPermission(apiName, methodName)
                this.emit('sandbox:permission-denied', {
                  pluginId,
                  permission: requiredPermission,
                  api: apiName,
                  method: methodName
                })
                throw new Error(`Permission denied: ${requiredPermission} required for ${apiName}.${methodName}`)
              }

              // 檢查限流
              if (!this.checkRateLimit(pluginId, apiName, methodName)) {
                this.emit('sandbox:rate-limit-exceeded', {
                  pluginId,
                  api: apiName,
                  method: methodName,
                  limit: this.policy.rateLimit.maxCalls
                })
                throw new Error(`Rate limit exceeded for ${apiName}.${methodName}`)
              }

              // 更新統計
              this.updateStats(pluginId)

              // 執行原方法
              const result = original.apply(target, args)

              // 記錄 API 調用
              const duration = performance.now() - startTime
              this.recordAPICall(pluginId, apiName, methodName, args, duration, true)

              return result
            } catch (error) {
              // 記錄錯誤的 API 調用
              const duration = performance.now() - startTime
              const errorMessage = error instanceof Error ? error.message : 'Unknown error'
              this.recordAPICall(pluginId, apiName, methodName, args, duration, false, errorMessage)

              // 觸發錯誤事件
              this.emit('sandbox:error', {
                pluginId,
                error: error instanceof Error ? error : new Error(String(error)),
                context: { api: apiName, method: methodName, args }
              })

              throw error
            }
          }
        }
      })
    }

    return wrappedAPIs
  }

  /**
   * 檢查權限
   */
  private checkPermission(pluginId: string, apiName: string, methodName: string): boolean {
    const context = this.contexts.get(pluginId)
    if (!context) return false

    const requiredPermission = this.getRequiredPermission(apiName, methodName)
    return context.permissions.has(requiredPermission)
  }

  /**
   * 獲取所需權限
   */
  private getRequiredPermission(apiName: string, methodName: string): SandboxPermission {
    const permissionMap: Record<string, Record<string, SandboxPermission>> = {
      menu: {
        register: 'menu:write',
        unregister: 'menu:write',
        update: 'menu:write',
        getAll: 'menu:read'
      },
      shortcut: {
        register: 'shortcut:write',
        unregister: 'shortcut:write',
        getAll: 'shortcut:read',
        hasConflict: 'shortcut:read'
      },
      storage: {
        get: 'storage:read',
        set: 'storage:write',
        remove: 'storage:write',
        clear: 'storage:write',
        has: 'storage:read',
        keys: 'storage:read'
      },
      notification: {
        info: 'notification:show',
        success: 'notification:show',
        warn: 'notification:show',
        error: 'notification:show',
        show: 'notification:show'
      }
    }

    return permissionMap[apiName]?.[methodName] || 'system:info'
  }

  /**
   * 檢查限流
   */
  private checkRateLimit(pluginId: string, apiName: string, methodName: string): boolean {
    const key = `${pluginId}:${apiName}:${methodName}`
    const now = Date.now()
    const tracking = this.rateLimitTracking.get(key)

    if (!tracking || now > tracking.resetTime) {
      // 重置或初始化
      this.rateLimitTracking.set(key, {
        calls: 1,
        resetTime: now + this.policy.rateLimit.windowMs
      })
      return true
    }

    if (tracking.calls >= this.policy.rateLimit.maxCalls) {
      return false
    }

    tracking.calls++
    return true
  }

  /**
   * 更新統計信息
   */
  private updateStats(pluginId: string): void {
    const context = this.contexts.get(pluginId)
    if (!context) return

    context.stats.apiCalls++
    context.stats.lastActivity = new Date()

    // 檢查資源限制
    this.checkResourceLimits(pluginId, context)
  }

  /**
   * 檢查資源限制
   */
  private checkResourceLimits(pluginId: string, context: SandboxContext): void {
    const limits = this.policy.resourceLimits

    // 檢查內存使用
    if (context.stats.memoryUsage > limits.maxMemory) {
      this.emit('sandbox:resource-limit-exceeded', {
        pluginId,
        resource: 'memory',
        usage: context.stats.memoryUsage,
        limit: limits.maxMemory
      })
    }

    // 檢查存儲使用
    if (context.stats.storageUsage > limits.maxStorage) {
      this.emit('sandbox:resource-limit-exceeded', {
        pluginId,
        resource: 'storage',
        usage: context.stats.storageUsage,
        limit: limits.maxStorage
      })
    }
  }

  /**
   * 記錄 API 調用
   */
  private recordAPICall(
    pluginId: string,
    apiName: string,
    methodName: string,
    args: any[],
    duration: number,
    success: boolean,
    error?: string
  ): void {
    const record: APICallRecord = {
      pluginId,
      apiName,
      methodName,
      args: args.map(arg => this.serializeArg(arg)),
      timestamp: new Date(),
      duration,
      success,
      ...(error && { error })
    }

    this.apiCallHistory.push(record)

    // 觸發 API 調用事件
    this.emit('sandbox:api-call', { pluginId, record })
  }

  /**
   * 序列化參數（避免循環引用）
   */
  private serializeArg(arg: any): any {
    try {
      return JSON.parse(JSON.stringify(arg))
    } catch {
      return String(arg)
    }
  }

  /**
   * 銷毀沙箱
   */
  destroySandbox(pluginId: string, reason = 'manual'): void {
    const context = this.contexts.get(pluginId)
    if (!context) return

    // 標記為已銷毀
    context.destroyed = true

    // 清理相關的限流記錄
    for (const key of Array.from(this.rateLimitTracking.keys())) {
      if (key.startsWith(`${pluginId}:`)) {
        this.rateLimitTracking.delete(key)
      }
    }

    // 從上下文中移除
    this.contexts.delete(pluginId)

    // 觸發銷毀事件
    this.emit('sandbox:destroyed', { pluginId, reason })

    console.log(`[Sandbox] Destroyed sandbox for plugin: ${pluginId} (reason: ${reason})`)
  }

  /**
   * 獲取沙箱上下文
   */
  getSandbox(pluginId: string): SandboxContext | null {
    return this.contexts.get(pluginId) || null
  }

  /**
   * 獲取所有沙箱
   */
  getAllSandboxes(): SandboxContext[] {
    return Array.from(this.contexts.values())
  }

  /**
   * 檢查沙箱是否存在
   */
  hasSandbox(pluginId: string): boolean {
    return this.contexts.has(pluginId)
  }

  /**
   * 更新沙箱權限
   */
  updatePermissions(pluginId: string, permissions: SandboxPermission[]): void {
    const context = this.contexts.get(pluginId)
    if (!context) {
      throw new Error(`Sandbox not found for plugin: ${pluginId}`)
    }

    const validPermissions = permissions.filter(p => this.policy.permissions.includes(p))
    context.permissions = new Set(validPermissions)

    console.log(`[Sandbox] Updated permissions for plugin: ${pluginId}`)
  }

  /**
   * 獲取 API 調用歷史
   */
  getAPICallHistory(pluginId?: string, limit = 100): APICallRecord[] {
    let history = this.apiCallHistory

    if (pluginId) {
      history = history.filter(record => record.pluginId === pluginId)
    }

    return history.slice(-limit)
  }

  /**
   * 獲取沙箱統計
   */
  getStats(): SandboxStats {
    const stats: SandboxStats = {
      activeSandboxes: this.contexts.size,
      totalApiCalls: this.apiCallHistory.length,
      permissionDenials: 0,
      rateLimitHits: 0,
      resourceLimitHits: 0,
      byPlugin: {}
    }

    // 統計各種事件
    for (const record of this.apiCallHistory) {
      if (!stats.byPlugin[record.pluginId]) {
        stats.byPlugin[record.pluginId] = {
          apiCalls: 0,
          memoryUsage: 0,
          storageUsage: 0,
          permissionDenials: 0,
          rateLimitHits: 0
        }
      }
      const pluginStats = stats.byPlugin[record.pluginId]!
      pluginStats.apiCalls++
    }

    // 統計當前上下文
    for (const context of Array.from(this.contexts.values())) {
      if (!stats.byPlugin[context.pluginId]) {
        stats.byPlugin[context.pluginId] = {
          apiCalls: 0,
          memoryUsage: 0,
          storageUsage: 0,
          permissionDenials: 0,
          rateLimitHits: 0
        }
      }
      const pluginStats = stats.byPlugin[context.pluginId]!
      pluginStats.memoryUsage = context.stats.memoryUsage
      pluginStats.storageUsage = context.stats.storageUsage
    }

    return stats
  }

  /**
   * 清理空閒沙箱
   */
  private cleanupIdleSandboxes(): void {
    const now = new Date()
    const idleTimeout = this.policy.timePolicy.idleTimeout
    const toDestroy: string[] = []

    for (const [pluginId, context] of Array.from(this.contexts.entries())) {
      const idleTime = now.getTime() - context.stats.lastActivity.getTime()
      if (idleTime > idleTimeout) {
        toDestroy.push(pluginId)
      }
    }

    for (const pluginId of toDestroy) {
      this.destroySandbox(pluginId, 'idle-timeout')
    }
  }

  /**
   * 清理舊的 API 調用記錄
   */
  private cleanupOldApiCalls(): void {
    const maxAge = 24 * 60 * 60 * 1000 // 24小時
    const cutoff = new Date(Date.now() - maxAge)

    this.apiCallHistory = this.apiCallHistory.filter(
      record => record.timestamp > cutoff
    )
  }

  /**
   * 重置限流計數
   */
  private resetRateLimits(): void {
    const now = Date.now()
    for (const [key, tracking] of Array.from(this.rateLimitTracking.entries())) {
      if (now > tracking.resetTime) {
        this.rateLimitTracking.delete(key)
      }
    }
  }

  /**
   * 事件監聽
   */
  on<T extends keyof SandboxEvents>(event: T, listener: (data: SandboxEvents[T]) => void): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件監聽
   */
  off<T extends keyof SandboxEvents>(event: T, listener: (data: SandboxEvents[T]) => void): void {
    const listeners = this.eventListeners.get(event) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 觸發事件
   */
  private emit<T extends keyof SandboxEvents>(event: T, data: SandboxEvents[T]): void {
    const listeners = this.eventListeners.get(event) || []
    for (const listener of listeners) {
      try {
        listener(data)
      } catch (error) {
        console.error(`[Sandbox] Event listener error for ${event}:`, error)
      }
    }
  }

  /**
   * 更新策略
   */
  updatePolicy(newPolicy: Partial<SandboxPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy }
    console.log('[Sandbox] Policy updated')
  }

  /**
   * 獲取策略
   */
  getPolicy(): SandboxPolicy {
    return { ...this.policy }
  }

  /**
   * 銷毀所有沙箱
   */
  destroyAll(reason = 'shutdown'): void {
    const pluginIds = Array.from(this.contexts.keys())
    for (const pluginId of pluginIds) {
      this.destroySandbox(pluginId, reason)
    }
  }
}

/**
 * 創建沙箱實例
 */
export function createSandbox(policy?: Partial<SandboxPolicy>): PluginSandbox {
  return new PluginSandbox(policy)
}

/**
 * 全局沙箱實例
 */
export const globalSandbox = new PluginSandbox()

/**
 * 沙箱工具函數
 */
export const sandboxUtils = {
  /**
   * 驗證權限字符串
   */
  isValidPermission(permission: string): permission is SandboxPermission {
    const validPermissions: SandboxPermission[] = [
      'menu:read', 'menu:write',
      'shortcut:read', 'shortcut:write',
      'storage:read', 'storage:write',
      'notification:show',
      'ui:component', 'ui:route',
      'system:info',
      'network:fetch',
      'file:read', 'file:write'
    ]
    return validPermissions.includes(permission as SandboxPermission)
  },

  /**
   * 解析權限字符串
   */
  parsePermissions(permissions: string[]): SandboxPermission[] {
    return permissions.filter(this.isValidPermission)
  },

  /**
   * 格式化資源大小
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
   * 格式化時間間隔
   */
  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
    return `${(ms / 3600000).toFixed(1)}h`
  },

  /**
   * 檢查域名是否允許
   */
  isDomainAllowed(domain: string, allowedDomains: string[]): boolean {
    return allowedDomains.some(allowed => {
      if (allowed.startsWith('*.')) {
        const pattern = allowed.slice(2)
        return domain.endsWith(pattern)
      }
      return domain === allowed
    })
  }
}
