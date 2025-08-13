import type { MenuItem } from 'primevue/menuitem'
import { ref, computed, reactive } from 'vue'
import type { MenuAPI } from '../../types/plugin'

/**
 * 插件菜單項定義
 * 擴展 PrimeVue MenuItem 以支持插件特定需求
 */
export interface PluginMenuItem extends MenuItem {
  /** 插件ID */
  pluginId?: string
  /** 菜單項ID */
  id: string
  /** 優先級 (數字越小優先級越高) */
  priority?: number
  /** 顯示條件函數 */
  visible?: () => boolean
  /** 菜單位置 */
  position?: 'main' | 'tools' | 'help' | 'custom'
  /** 權限要求 */
  permissions?: string[]
  /** 分組名稱 */
  group?: string
}

/**
 * 菜單註册配置
 */
export interface MenuRegistrationConfig {
  /** 默認位置 */
  defaultPosition: 'main' | 'tools' | 'help' | 'custom'
  /** 默認優先級 */
  defaultPriority: number
  /** 權限檢查函數 */
  permissionChecker?: (permissions: string[]) => boolean
  /** 菜單項生成器 */
  itemGenerator?: (item: PluginMenuItem) => MenuItem
}

/**
 * 菜單事件
 */
export interface MenuEvents {
  'menu:registered': { item: PluginMenuItem; pluginId: string }
  'menu:unregistered': { itemId: string; pluginId: string }
  'menu:clicked': { item: PluginMenuItem; event: any }
  'menu:visibility-changed': { itemId: string; visible: boolean }
}

/**
 * 菜單 API 實現
 * 提供插件菜單註册和管理功能
 */
export class PluginMenuAPI implements MenuAPI {
  private menuItems = reactive(new Map<string, PluginMenuItem>())
  private menuItemsByPlugin = reactive(new Map<string, string[]>())
  private eventListeners = reactive(new Map<keyof MenuEvents, Function[]>())
  private config: MenuRegistrationConfig

  constructor(config?: Partial<MenuRegistrationConfig>) {
    this.config = {
      defaultPosition: 'tools',
      defaultPriority: 100,
      permissionChecker: () => true,
      ...config
    }

    this.initializeEventSystem()
  }

  /**
   * 初始化事件系統
   */
  private initializeEventSystem(): void {
    const eventTypes: (keyof MenuEvents)[] = [
      'menu:registered',
      'menu:unregistered',
      'menu:clicked',
      'menu:visibility-changed'
    ]

    for (const eventType of eventTypes) {
      this.eventListeners.set(eventType, [])
    }
  }

  /**
   * 註册菜單項
   */
  register(items: MenuItem[], position = this.config.defaultPosition): void {
    if (!Array.isArray(items)) {
      throw new Error('Menu items must be an array')
    }

    for (const item of items) {
      this.registerSingleItem(item as PluginMenuItem, position)
    }
  }

  /**
   * 註册單個菜單項
   */
  private registerSingleItem(item: PluginMenuItem, position: string): void {
    // 生成唯一ID
    if (!item.id) {
      item.id = `plugin-menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // 檢查ID衝突
    if (this.menuItems.has(item.id)) {
      throw new Error(`Menu item with ID '${item.id}' already exists`)
    }

    // 設置默認值
    const menuItem: PluginMenuItem = {
      ...item,
      position: position as any || this.config.defaultPosition,
      priority: item.priority ?? this.config.defaultPriority,
      visible: item.visible || (() => true),
      permissions: item.permissions || []
    }

    // 權限檢查
    if (menuItem.permissions && menuItem.permissions.length > 0) {
      if (!this.config.permissionChecker!(menuItem.permissions)) {
        console.warn(`[MenuAPI] Menu item '${menuItem.id}' skipped due to insufficient permissions`)
        return
      }
    }

    // 包裝命令處理
    if (menuItem.command) {
      const originalCommand = menuItem.command
      menuItem.command = (event) => {
        this.emit('menu:clicked', { item: menuItem, event })
        originalCommand(event)
      }
    }

    // 註册菜單項
    this.menuItems.set(item.id, menuItem)

    // 記錄插件的菜單項
    if (menuItem.pluginId) {
      const pluginItems = this.menuItemsByPlugin.get(menuItem.pluginId) || []
      pluginItems.push(item.id)
      this.menuItemsByPlugin.set(menuItem.pluginId, pluginItems)
    }

    // 觸發事件
    this.emit('menu:registered', { 
      item: menuItem, 
      pluginId: menuItem.pluginId || 'unknown' 
    })

    console.log(`[MenuAPI] Registered menu item: ${item.id}`)
  }

  /**
   * 註销菜單項
   */
  unregister(itemId: string): void {
    const menuItem = this.menuItems.get(itemId)
    if (!menuItem) {
      console.warn(`[MenuAPI] Menu item '${itemId}' not found`)
      return
    }

    // 從插件記錄中移除
    if (menuItem.pluginId) {
      const pluginItems = this.menuItemsByPlugin.get(menuItem.pluginId) || []
      const index = pluginItems.indexOf(itemId)
      if (index > -1) {
        pluginItems.splice(index, 1)
        if (pluginItems.length === 0) {
          this.menuItemsByPlugin.delete(menuItem.pluginId)
        }
      }
    }

    // 移除菜單項
    this.menuItems.delete(itemId)

    // 觸發事件
    this.emit('menu:unregistered', { 
      itemId, 
      pluginId: menuItem.pluginId || 'unknown' 
    })

    console.log(`[MenuAPI] Unregistered menu item: ${itemId}`)
  }

  /**
   * 更新菜單項
   */
  update(itemId: string, updates: Partial<PluginMenuItem>): void {
    const existingItem = this.menuItems.get(itemId)
    if (!existingItem) {
      throw new Error(`Menu item '${itemId}' not found`)
    }

    // 合併更新
    const updatedItem = { ...existingItem, ...updates }

    // 權限檢查
    if (updatedItem.permissions && updatedItem.permissions.length > 0) {
      if (!this.config.permissionChecker!(updatedItem.permissions)) {
        console.warn(`[MenuAPI] Menu item update '${itemId}' rejected due to insufficient permissions`)
        return
      }
    }

    // 包裝命令處理
    if (updates.command && updates.command !== existingItem.command) {
      const originalCommand = updates.command
      updatedItem.command = (event) => {
        this.emit('menu:clicked', { item: updatedItem, event })
        originalCommand(event)
      }
    }

    // 更新菜單項
    this.menuItems.set(itemId, updatedItem)

    console.log(`[MenuAPI] Updated menu item: ${itemId}`)
  }

  /**
   * 獲取所有菜單項
   */
  getAll(): MenuItem[] {
    return Array.from(this.menuItems.values())
      .filter(item => !item.visible || item.visible())
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
      .map(item => this.convertToMenuItem(item))
  }

  /**
   * 獲取指定位置的菜單項
   */
  getByPosition(position: string): MenuItem[] {
    return Array.from(this.menuItems.values())
      .filter(item => item.position === position)
      .filter(item => !item.visible || item.visible())
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
      .map(item => this.convertToMenuItem(item))
  }

  /**
   * 獲取插件的菜單項
   */
  getByPlugin(pluginId: string): MenuItem[] {
    const itemIds = this.menuItemsByPlugin.get(pluginId) || []
    return itemIds
      .map(id => this.menuItems.get(id))
      .filter((item): item is PluginMenuItem => item !== undefined)
      .filter(item => !item.visible || item.visible())
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
      .map(item => this.convertToMenuItem(item))
  }

  /**
   * 註销插件的所有菜單項
   */
  unregisterPlugin(pluginId: string): void {
    const itemIds = this.menuItemsByPlugin.get(pluginId) || []
    for (const itemId of itemIds) {
      this.unregister(itemId)
    }
    console.log(`[MenuAPI] Unregistered all menu items for plugin: ${pluginId}`)
  }

  /**
   * 檢查菜單項是否存在
   */
  hasItem(itemId: string): boolean {
    return this.menuItems.has(itemId)
  }

  /**
   * 獲取菜單項詳情
   */
  getItem(itemId: string): PluginMenuItem | null {
    return this.menuItems.get(itemId) || null
  }

  /**
   * 創建菜單組
   */
  createGroup(groupName: string, items: PluginMenuItem[], options?: {
    position?: string
    priority?: number
    separator?: boolean
  }): string {
    const groupId = `group-${groupName}-${Date.now()}`
    
    // 添加分隔符（如果需要）
    if (options?.separator) {
      this.registerSingleItem({
        id: `${groupId}-separator-before`,
        separator: true,
        priority: (options.priority || 0) - 1,
        position: options.position || this.config.defaultPosition
      } as PluginMenuItem, options.position || this.config.defaultPosition)
    }

    // 註册組內項目
    for (let i = 0; i < items.length; i++) {
      const sourceItem = items[i]
      if (!sourceItem) continue
      
      const item: PluginMenuItem = {
        ...sourceItem,
        id: sourceItem.id || `${groupId}-item-${i}`,
        group: groupName,
        priority: (options?.priority || 0) + i,
        position: (options?.position || this.config.defaultPosition) as "main" | "tools" | "help" | "custom"
      }
      this.registerSingleItem(item, options?.position || this.config.defaultPosition)
    }

    return groupId
  }

  /**
   * 轉換為 PrimeVue MenuItem
   */
  private convertToMenuItem(item: PluginMenuItem): MenuItem {
    const { pluginId, id, priority, visible, position, permissions, group, ...menuItem } = item
    return menuItem
  }

  /**
   * 觸發事件
   */
  private emit<T extends keyof MenuEvents>(event: T, data: MenuEvents[T]): void {
    const listeners = this.eventListeners.get(event) || []
    for (const listener of listeners) {
      try {
        listener(data)
      } catch (error) {
        console.error(`[MenuAPI] Event listener error for ${event}:`, error)
      }
    }
  }

  /**
   * 添加事件監聽
   */
  on<T extends keyof MenuEvents>(event: T, listener: (data: MenuEvents[T]) => void): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件監聽
   */
  off<T extends keyof MenuEvents>(event: T, listener: (data: MenuEvents[T]) => void): void {
    const listeners = this.eventListeners.get(event) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 獲取統計信息
   */
  getStats(): {
    totalItems: number
    itemsByPosition: Record<string, number>
    itemsByPlugin: Record<string, number>
    visibleItems: number
  } {
    const items = Array.from(this.menuItems.values())
    const itemsByPosition: Record<string, number> = {}
    const itemsByPlugin: Record<string, number> = {}

    for (const item of items) {
      // 統計位置
      const position = item.position || 'unknown'
      itemsByPosition[position] = (itemsByPosition[position] || 0) + 1

      // 統計插件
      const pluginId = item.pluginId || 'unknown'
      itemsByPlugin[pluginId] = (itemsByPlugin[pluginId] || 0) + 1
    }

    const visibleItems = items.filter(item => !item.visible || item.visible()).length

    return {
      totalItems: items.length,
      itemsByPosition,
      itemsByPlugin,
      visibleItems
    }
  }

  /**
   * 清空所有菜單項
   */
  clear(): void {
    this.menuItems.clear()
    this.menuItemsByPlugin.clear()
    console.log('[MenuAPI] All menu items cleared')
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<MenuRegistrationConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[MenuAPI] Configuration updated')
  }

  /**
   * 獲取配置
   */
  getConfig(): MenuRegistrationConfig {
    return { ...this.config }
  }
}

/**
 * 創建菜單 API 實例
 */
export function createMenuAPI(config?: Partial<MenuRegistrationConfig>): PluginMenuAPI {
  return new PluginMenuAPI(config)
}

/**
 * 全局菜單 API 實例
 */
export const globalMenuAPI = new PluginMenuAPI()

/**
 * 菜單工具函數
 */
export const menuUtils = {
  /**
   * 創建標準菜單項
   */
  createStandardItem(options: {
    id?: string
    label: string
    icon?: string
    command?: () => void
    route?: string
    priority?: number
    position?: string
  }): PluginMenuItem {
    const item: PluginMenuItem = {
      id: options.id || `menu-${Date.now()}`,
      label: options.label,
      ...(options.icon && { icon: options.icon }),
      ...(options.command && { command: options.command }),
      ...(options.route && { route: options.route }),
      ...(options.priority !== undefined && { priority: options.priority }),
      ...(options.position && { position: options.position as "main" | "tools" | "help" | "custom" })
    }
    return item
  },

  /**
   * 創建分隔符
   */
  createSeparator(priority?: number): PluginMenuItem {
    const item: PluginMenuItem = {
      id: `separator-${Date.now()}`,
      separator: true,
      ...(priority !== undefined && { priority })
    }
    return item
  },

  /**
   * 創建子菜單
   */
  createSubmenu(options: {
    id?: string
    label: string
    icon?: string
    items: PluginMenuItem[]
    priority?: number
  }): PluginMenuItem {
    const item: PluginMenuItem = {
      id: options.id || `submenu-${Date.now()}`,
      label: options.label,
      items: options.items,
      ...(options.icon && { icon: options.icon }),
      ...(options.priority !== undefined && { priority: options.priority })
    }
    return item
  }
}
