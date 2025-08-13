import { ref, reactive, onUnmounted } from 'vue'
import type { ShortcutAPI } from '../../types/plugin'

/**
 * 快捷鍵定義
 */
export interface PluginShortcut {
  /** 快捷鍵組合 */
  key: string
  /** 處理函數 */
  handler: (event: KeyboardEvent) => void | Promise<void>
  /** 描述 */
  description?: string
  /** 插件ID */
  pluginId?: string
  /** 快捷鍵ID */
  id: string
  /** 優先級 */
  priority?: number
  /** 是否在全局範圍生效 */
  global?: boolean
  /** 作用域 */
  scope?: 'global' | 'page' | 'component'
  /** 條件檢查函數 */
  condition?: () => boolean
  /** 是否阻止默認行為 */
  preventDefault?: boolean
  /** 是否阻止事件冒泡 */
  stopPropagation?: boolean
}

/**
 * 快捷鍵解析結果
 */
export interface ParsedShortcut {
  ctrl: boolean
  meta: boolean
  alt: boolean
  shift: boolean
  key: string
  code?: string
}

/**
 * 快捷鍵事件
 */
export interface ShortcutEvents {
  'shortcut:registered': { shortcut: PluginShortcut; pluginId: string }
  'shortcut:unregistered': { shortcutId: string; pluginId: string }
  'shortcut:triggered': { shortcut: PluginShortcut; event: KeyboardEvent }
  'shortcut:conflict': { shortcut: string; existing: PluginShortcut; new: PluginShortcut }
}

/**
 * 快捷鍵配置
 */
export interface ShortcutConfig {
  /** 是否啟用全局快捷鍵 */
  enableGlobal: boolean
  /** 衝突解決策略 */
  conflictResolution: 'error' | 'override' | 'priority'
  /** 默認優先級 */
  defaultPriority: number
  /** 是否記錄快捷鍵觸發 */
  enableLogging: boolean
}

/**
 * 快捷鍵 API 實現
 */
export class PluginShortcutAPI implements ShortcutAPI {
  private shortcuts = reactive(new Map<string, PluginShortcut>())
  private shortcutsByPlugin = reactive(new Map<string, string[]>())
  private keyMap = reactive(new Map<string, string[]>()) // key -> shortcut IDs
  private eventListeners = reactive(new Map<keyof ShortcutEvents, Function[]>())
  private config: ShortcutConfig
  private globalHandler: ((event: KeyboardEvent) => void) | null = null

  constructor(config?: Partial<ShortcutConfig>) {
    this.config = {
      enableGlobal: true,
      conflictResolution: 'error',
      defaultPriority: 100,
      enableLogging: false,
      ...config
    }

    this.initializeEventSystem()
    this.setupGlobalHandler()
  }

  /**
   * 初始化事件系統
   */
  private initializeEventSystem(): void {
    const eventTypes: (keyof ShortcutEvents)[] = [
      'shortcut:registered',
      'shortcut:unregistered',
      'shortcut:triggered',
      'shortcut:conflict'
    ]

    for (const eventType of eventTypes) {
      this.eventListeners.set(eventType, [])
    }
  }

  /**
   * 設置全局按鍵處理器
   */
  private setupGlobalHandler(): void {
    if (!this.config.enableGlobal) {
      return
    }

    this.globalHandler = (event: KeyboardEvent) => {
      this.handleKeyEvent(event)
    }

    window.addEventListener('keydown', this.globalHandler)
  }

  /**
   * 處理按鍵事件
   */
  private handleKeyEvent(event: KeyboardEvent): void {
    const keyString = this.serializeKeyEvent(event)
    const shortcutIds = this.keyMap.get(keyString) || []

    if (shortcutIds.length === 0) {
      return
    }

    // 按優先級排序
    const shortcuts = shortcutIds
      .map(id => this.shortcuts.get(id))
      .filter((shortcut): shortcut is PluginShortcut => shortcut !== undefined)
      .filter(shortcut => !shortcut.condition || shortcut.condition())
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))

    for (const shortcut of shortcuts) {
      try {
        // 阻止默認行為
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }

        // 阻止事件冒泡
        if (shortcut.stopPropagation) {
          event.stopPropagation()
        }

        // 觸發快捷鍵處理
        const result = shortcut.handler(event)
        
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`[ShortcutAPI] Async shortcut handler error for ${shortcut.id}:`, error)
          })
        }

        // 記錄觸發
        this.emit('shortcut:triggered', { shortcut, event })

        if (this.config.enableLogging) {
          console.log(`[ShortcutAPI] Triggered shortcut: ${shortcut.id} (${keyString})`)
        }

        // 一般情況下，第一個匹配的快捷鍵處理後就停止
        break
      } catch (error) {
        console.error(`[ShortcutAPI] Shortcut handler error for ${shortcut.id}:`, error)
      }
    }
  }

  /**
   * 序列化按鍵事件為字符串
   */
  private serializeKeyEvent(event: KeyboardEvent): string {
    const parts: string[] = []
    
    if (event.ctrlKey) parts.push('ctrl')
    if (event.metaKey) parts.push('meta')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    
    // 使用 key 而不是 code，因為 key 考慮了鍵盤佈局
    const key = event.key.toLowerCase()
    parts.push(key)
    
    return parts.join('+')
  }

  /**
   * 解析快捷鍵字符串
   */
  private parseShortcutString(shortcutString: string): ParsedShortcut {
    const parts = shortcutString.toLowerCase().split('+').map(p => p.trim())
    const key = parts[parts.length - 1] || ''
    
    return {
      ctrl: parts.includes('ctrl'),
      meta: parts.includes('meta') || parts.includes('cmd'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      key
    }
  }

  /**
   * 標準化快捷鍵字符串
   */
  private normalizeShortcutString(shortcutString: string): string {
    const parsed = this.parseShortcutString(shortcutString)
    const parts: string[] = []
    
    if (parsed.ctrl) parts.push('ctrl')
    if (parsed.meta) parts.push('meta')
    if (parsed.alt) parts.push('alt')
    if (parsed.shift) parts.push('shift')
    parts.push(parsed.key)
    
    return parts.join('+')
  }

  /**
   * 註册快捷鍵
   */
  register(shortcut: string, handler: () => void, description?: string): void {
    const normalizedShortcut = this.normalizeShortcutString(shortcut)
    const shortcutId = `shortcut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const pluginShortcut: PluginShortcut = {
      id: shortcutId,
      key: normalizedShortcut,
      handler,
      ...(description && { description }),
      priority: this.config.defaultPriority,
      global: true,
      scope: 'global',
      preventDefault: true,
      stopPropagation: false
    }

    this.registerShortcut(pluginShortcut)
  }

  /**
   * 註册詳細快捷鍵
   */
  registerShortcut(shortcut: PluginShortcut): void {
    const normalizedKey = this.normalizeShortcutString(shortcut.key)
    
    // 檢查ID衝突
    if (this.shortcuts.has(shortcut.id)) {
      throw new Error(`Shortcut with ID '${shortcut.id}' already exists`)
    }

    // 檢查快捷鍵衝突
    const existingIds = this.keyMap.get(normalizedKey) || []
    if (existingIds.length > 0) {
      const firstExistingId = existingIds[0]
      if (firstExistingId) {
        const existingShortcut = this.shortcuts.get(firstExistingId)!
        
        this.emit('shortcut:conflict', {
          shortcut: normalizedKey,
          existing: existingShortcut,
          new: shortcut
        })

        switch (this.config.conflictResolution) {
          case 'error':
            throw new Error(`Shortcut '${normalizedKey}' conflicts with existing shortcut '${existingShortcut.id}'`)
          case 'override':
            // 移除現有快捷鍵
            this.unregister(firstExistingId)
            break
          case 'priority':
            // 允許多個快捷鍵共存，按優先級處理
            break
        }
      }
    }

    // 標準化快捷鍵對象
    const normalizedShortcut: PluginShortcut = {
      ...shortcut,
      key: normalizedKey,
      priority: shortcut.priority ?? this.config.defaultPriority,
      global: shortcut.global ?? true,
      scope: shortcut.scope ?? 'global',
      preventDefault: shortcut.preventDefault ?? true,
      stopPropagation: shortcut.stopPropagation ?? false
    }

    // 註册快捷鍵
    this.shortcuts.set(shortcut.id, normalizedShortcut)

    // 更新按鍵映射
    const keyIds = this.keyMap.get(normalizedKey) || []
    keyIds.push(shortcut.id)
    this.keyMap.set(normalizedKey, keyIds)

    // 記錄插件的快捷鍵
    if (shortcut.pluginId) {
      const pluginShortcuts = this.shortcutsByPlugin.get(shortcut.pluginId) || []
      pluginShortcuts.push(shortcut.id)
      this.shortcutsByPlugin.set(shortcut.pluginId, pluginShortcuts)
    }

    // 觸發事件
    this.emit('shortcut:registered', {
      shortcut: normalizedShortcut,
      pluginId: shortcut.pluginId || 'unknown'
    })

    console.log(`[ShortcutAPI] Registered shortcut: ${shortcut.id} (${normalizedKey})`)
  }

  /**
   * 註销快捷鍵
   */
  unregister(shortcut: string): void {
    // 可以是快捷鍵字符串或ID
    let shortcutId: string | undefined
    let shortcutObj: PluginShortcut | undefined

    // 嘗試按ID查找
    if (this.shortcuts.has(shortcut)) {
      shortcutId = shortcut
      shortcutObj = this.shortcuts.get(shortcut)
    } else {
      // 嘗試按快捷鍵字符串查找
      const normalizedKey = this.normalizeShortcutString(shortcut)
      const ids = this.keyMap.get(normalizedKey) || []
      if (ids.length > 0) {
        const firstId = ids[0]
        if (firstId) {
          shortcutId = firstId
          shortcutObj = this.shortcuts.get(firstId)
        }
      }
    }

    if (!shortcutId || !shortcutObj) {
      console.warn(`[ShortcutAPI] Shortcut '${shortcut}' not found`)
      return
    }

    // 從按鍵映射中移除
    const keyIds = this.keyMap.get(shortcutObj.key) || []
    const index = keyIds.indexOf(shortcutId)
    if (index > -1) {
      keyIds.splice(index, 1)
      if (keyIds.length === 0) {
        this.keyMap.delete(shortcutObj.key)
      } else {
        this.keyMap.set(shortcutObj.key, keyIds)
      }
    }

    // 從插件記錄中移除
    if (shortcutObj.pluginId) {
      const pluginShortcuts = this.shortcutsByPlugin.get(shortcutObj.pluginId) || []
      const pluginIndex = pluginShortcuts.indexOf(shortcutId)
      if (pluginIndex > -1) {
        pluginShortcuts.splice(pluginIndex, 1)
        if (pluginShortcuts.length === 0) {
          this.shortcutsByPlugin.delete(shortcutObj.pluginId)
        }
      }
    }

    // 移除快捷鍵
    this.shortcuts.delete(shortcutId)

    // 觸發事件
    this.emit('shortcut:unregistered', {
      shortcutId,
      pluginId: shortcutObj.pluginId || 'unknown'
    })

    console.log(`[ShortcutAPI] Unregistered shortcut: ${shortcutId} (${shortcutObj.key})`)
  }

  /**
   * 獲取所有快捷鍵
   */
  getAll(): Array<{ shortcut: string; description?: string }> {
    return Array.from(this.shortcuts.values()).map(shortcut => ({
      shortcut: shortcut.key,
      ...(shortcut.description && { description: shortcut.description })
    }))
  }

  /**
   * 檢查快捷鍵衝突
   */
  hasConflict(shortcut: string): boolean {
    const normalizedKey = this.normalizeShortcutString(shortcut)
    const existingIds = this.keyMap.get(normalizedKey) || []
    return existingIds.length > 0
  }

  /**
   * 獲取插件的快捷鍵
   */
  getByPlugin(pluginId: string): PluginShortcut[] {
    const shortcutIds = this.shortcutsByPlugin.get(pluginId) || []
    return shortcutIds
      .map(id => this.shortcuts.get(id))
      .filter((shortcut): shortcut is PluginShortcut => shortcut !== undefined)
  }

  /**
   * 註销插件的所有快捷鍵
   */
  unregisterPlugin(pluginId: string): void {
    const shortcutIds = this.shortcutsByPlugin.get(pluginId) || []
    for (const shortcutId of shortcutIds) {
      this.unregister(shortcutId)
    }
    console.log(`[ShortcutAPI] Unregistered all shortcuts for plugin: ${pluginId}`)
  }

  /**
   * 獲取快捷鍵詳情
   */
  getShortcut(shortcutId: string): PluginShortcut | null {
    return this.shortcuts.get(shortcutId) || null
  }

  /**
   * 檢查快捷鍵是否存在
   */
  hasShortcut(shortcut: string): boolean {
    return this.shortcuts.has(shortcut) || this.hasConflict(shortcut)
  }

  /**
   * 模擬觸發快捷鍵
   */
  trigger(shortcut: string): void {
    const normalizedKey = this.normalizeShortcutString(shortcut)
    const shortcutIds = this.keyMap.get(normalizedKey) || []
    
    if (shortcutIds.length === 0) {
      console.warn(`[ShortcutAPI] No shortcut found for '${shortcut}'`)
      return
    }

    // 創建模擬鍵盤事件
    const keyPart = normalizedKey.split('+').pop() || ''
    const mockEvent = new KeyboardEvent('keydown', {
      key: keyPart,
      ctrlKey: normalizedKey.includes('ctrl'),
      metaKey: normalizedKey.includes('meta'),
      altKey: normalizedKey.includes('alt'),
      shiftKey: normalizedKey.includes('shift')
    })

    this.handleKeyEvent(mockEvent)
  }

  /**
   * 獲取統計信息
   */
  getStats(): {
    totalShortcuts: number
    shortcutsByScope: Record<string, number>
    shortcutsByPlugin: Record<string, number>
    conflicts: number
  } {
    const shortcuts = Array.from(this.shortcuts.values())
    const shortcutsByScope: Record<string, number> = {}
    const shortcutsByPlugin: Record<string, number> = {}
    
    for (const shortcut of shortcuts) {
      // 統計作用域
      const scope = shortcut.scope || 'global'
      shortcutsByScope[scope] = (shortcutsByScope[scope] || 0) + 1

      // 統計插件
      const pluginId = shortcut.pluginId || 'unknown'
      shortcutsByPlugin[pluginId] = (shortcutsByPlugin[pluginId] || 0) + 1
    }

    // 統計衝突
    let conflicts = 0
    for (const [key, ids] of Array.from(this.keyMap.entries())) {
      if (ids.length > 1) {
        conflicts += ids.length - 1
      }
    }

    return {
      totalShortcuts: shortcuts.length,
      shortcutsByScope,
      shortcutsByPlugin,
      conflicts
    }
  }

  /**
   * 清空所有快捷鍵
   */
  clear(): void {
    this.shortcuts.clear()
    this.shortcutsByPlugin.clear()
    this.keyMap.clear()
    console.log('[ShortcutAPI] All shortcuts cleared')
  }

  /**
   * 銷毀 API
   */
  destroy(): void {
    if (this.globalHandler) {
      window.removeEventListener('keydown', this.globalHandler)
      this.globalHandler = null
    }

    this.clear()
    this.eventListeners.clear()
    console.log('[ShortcutAPI] API destroyed')
  }

  /**
   * 事件監聽
   */
  on<T extends keyof ShortcutEvents>(event: T, listener: (data: ShortcutEvents[T]) => void): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件監聽
   */
  off<T extends keyof ShortcutEvents>(event: T, listener: (data: ShortcutEvents[T]) => void): void {
    const listeners = this.eventListeners.get(event) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 觸發事件
   */
  private emit<T extends keyof ShortcutEvents>(event: T, data: ShortcutEvents[T]): void {
    const listeners = this.eventListeners.get(event) || []
    for (const listener of listeners) {
      try {
        listener(data)
      } catch (error) {
        console.error(`[ShortcutAPI] Event listener error for ${event}:`, error)
      }
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ShortcutConfig>): void {
    const oldConfig = { ...this.config }
    this.config = { ...this.config, ...newConfig }

    // 如果全局處理器設置改變，重新設置
    if (oldConfig.enableGlobal !== this.config.enableGlobal) {
      if (this.globalHandler) {
        window.removeEventListener('keydown', this.globalHandler)
        this.globalHandler = null
      }
      this.setupGlobalHandler()
    }

    console.log('[ShortcutAPI] Configuration updated')
  }

  /**
   * 獲取配置
   */
  getConfig(): ShortcutConfig {
    return { ...this.config }
  }
}

/**
 * 創建快捷鍵 API 實例
 */
export function createShortcutAPI(config?: Partial<ShortcutConfig>): PluginShortcutAPI {
  return new PluginShortcutAPI(config)
}

/**
 * 全局快捷鍵 API 實例
 */
export const globalShortcutAPI = new PluginShortcutAPI()

/**
 * 快捷鍵工具函數
 */
export const shortcutUtils = {
  /**
   * 格式化快捷鍵顯示
   */
  formatShortcut(shortcut: string): string {
    return shortcut
      .split('+')
      .map(part => {
        switch (part.toLowerCase()) {
          case 'ctrl': return 'Ctrl'
          case 'meta': return navigator.platform.includes('Mac') ? '⌘' : 'Win'
          case 'alt': return navigator.platform.includes('Mac') ? '⌥' : 'Alt'
          case 'shift': return '⇧'
          default: return part.charAt(0).toUpperCase() + part.slice(1)
        }
      })
      .join(navigator.platform.includes('Mac') ? '' : '+')
  },

  /**
   * 檢查是否為有效的快捷鍵
   */
  isValidShortcut(shortcut: string): boolean {
    try {
      const parts = shortcut.toLowerCase().split('+')
      if (parts.length === 0) return false
      
      const key = parts[parts.length - 1]
      if (!key || key.length === 0) return false
      
      const modifiers = parts.slice(0, -1)
      const validModifiers = ['ctrl', 'meta', 'cmd', 'alt', 'shift']
      
      return modifiers.every(mod => validModifiers.includes(mod))
    } catch {
      return false
    }
  },

  /**
   * 創建快捷鍵提示
   */
  createShortcutHint(shortcut: string, description: string): string {
    return `${this.formatShortcut(shortcut)} - ${description}`
  }
}
