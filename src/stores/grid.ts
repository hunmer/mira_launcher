import type {
  DragState,
  GridConfig,
  GridHistory,
  GridItem,
} from '@/types/components'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

/**
 * 插件相关的网格项目类型
 */
interface PluginGridItem extends GridItem {
  pluginId?: string
  pluginType?: 'widget' | 'launcher' | 'shortcut'
  pluginData?: Record<string, any>
}

/**
 * 插件网格配置
 */
interface PluginGridConfig {
  allowPluginItems: boolean
  pluginItemsLimit: number
  pluginRenderMode: 'isolated' | 'integrated'
}

export const useGridStore = defineStore('grid', () => {
  // 网格配置
  const config = ref<GridConfig>({
    columns: 'auto',
    gap: 'md',
    responsive: true,
    autoRows: true,
  })

  // 插件网格配置
  const pluginConfig = ref<PluginGridConfig>({
    allowPluginItems: true,
    pluginItemsLimit: 50,
    pluginRenderMode: 'integrated',
  })

  // 网格项目数据
  const items = ref<GridItem[]>([])

  // 插件注册的自定义项目类型
  const pluginItemTypes = ref<
    Map<
      string,
      {
        renderer: any
        validator: (data: any) => boolean
        defaultData: Record<string, any>
          }
          >
          >(new Map())

  // 拖拽状态
  const dragState = ref<DragState>({
    isDragging: false,
    placeholderVisible: false,
  })

  // 操作历史
  const history = ref<GridHistory[]>([])

  // 选中的项目
  const selectedItems = ref<string[]>([])

  // 计算属性
  const itemCount = computed(() => items.value.length)

  const hasSelection = computed(() => selectedItems.value.length > 0)

  const sortedItems = computed(() => {
    return [...items.value].sort((a, b) => {
      // 固定项目优先显示
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1

      // 按最后使用时间排序
      const aTime = a.lastUsed?.getTime() || 0
      const bTime = b.lastUsed?.getTime() || 0
      return bTime - aTime
    })
  })

  // 网格配置管理
  const updateConfig = (newConfig: Partial<GridConfig>) => {
    config.value = { ...config.value, ...newConfig }
    saveToStorage()
  }

  const resetConfig = () => {
    config.value = {
      columns: 'auto',
      gap: 'md',
      responsive: true,
      autoRows: true,
    }
    saveToStorage()
  }

  // 项目管理方法
  const addItem = (item: Omit<GridItem, 'id'>) => {
    const newItem: GridItem = {
      ...item,
      id: generateId(),
      lastUsed: new Date(),
    }

    items.value.push(newItem)
    addToHistory('add', newItem)
    saveToStorage()

    return newItem.id
  }

  const removeItem = (id: string) => {
    const index = items.value.findIndex(item => item.id === id)
    if (index === -1) return false

    const removedItem = items.value[index]
    if (!removedItem) return false

    items.value.splice(index, 1)

    // 从选中列表中移除
    selectedItems.value = selectedItems.value.filter(itemId => itemId !== id)

    addToHistory('remove', removedItem, index)
    saveToStorage()

    return true
  }

  const updateItem = (id: string, updates: Partial<GridItem>) => {
    const index = items.value.findIndex(item => item.id === id)
    if (index === -1) return false

    const currentItem = items.value[index]
    if (!currentItem) return false

    const oldItem = { ...currentItem }
    const updatedItem = { ...currentItem, ...updates }
    items.value[index] = updatedItem

    addToHistory('update', updatedItem, index, index, { oldData: oldItem })
    saveToStorage()

    return true
  }

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= items.value.length ||
      toIndex >= items.value.length
    ) {
      return false
    }

    const item = items.value[fromIndex]
    if (!item) return false

    items.value.splice(fromIndex, 1)
    items.value.splice(toIndex, 0, item)

    addToHistory('move', item, fromIndex, toIndex)
    saveToStorage()

    return true
  }

  const getItem = (id: string) => {
    return items.value.find(item => item.id === id)
  }

  const findItemIndex = (id: string) => {
    return items.value.findIndex(item => item.id === id)
  }

  // 批量操作
  const removeSelectedItems = () => {
    const toRemove = [...selectedItems.value]
    toRemove.forEach(id => removeItem(id))
    selectedItems.value = []
  }

  const duplicateItem = (id: string) => {
    const item = getItem(id)
    if (!item) return null

    const { id: _, ...itemWithoutId } = item
    const duplicate = {
      ...itemWithoutId,
      name: `${item.name} (副本)`,
      pinned: false,
    }

    return addItem(duplicate)
  }

  // 选择管理
  const selectItem = (id: string) => {
    if (!selectedItems.value.includes(id)) {
      selectedItems.value.push(id)
    }
  }

  const deselectItem = (id: string) => {
    selectedItems.value = selectedItems.value.filter(itemId => itemId !== id)
  }

  const toggleSelection = (id: string) => {
    if (selectedItems.value.includes(id)) {
      deselectItem(id)
    } else {
      selectItem(id)
    }
  }

  const clearSelection = () => {
    selectedItems.value = []
  }

  const selectAll = () => {
    selectedItems.value = items.value.map(item => item.id)
  }

  // 拖拽状态管理
  const startDrag = (item: GridItem, fromIndex: number) => {
    dragState.value = {
      isDragging: true,
      draggedItem: item,
      draggedFromIndex: fromIndex,
      placeholderVisible: false,
    }
  }

  const updateDragPosition = (toIndex: number) => {
    dragState.value.draggedToIndex = toIndex
    dragState.value.placeholderVisible = true
  }

  const endDrag = () => {
    const { draggedFromIndex, draggedToIndex } = dragState.value

    if (
      draggedFromIndex !== undefined &&
      draggedToIndex !== undefined &&
      draggedFromIndex !== draggedToIndex
    ) {
      moveItem(draggedFromIndex, draggedToIndex)
    }

    dragState.value = {
      isDragging: false,
      placeholderVisible: false,
    }
  }

  const cancelDrag = () => {
    dragState.value = {
      isDragging: false,
      placeholderVisible: false,
    }
  }

  // 历史记录管理
  const addToHistory = (
    action: GridHistory['action'],
    item: GridItem,
    oldPosition?: number,
    newPosition?: number,
    data?: any,
  ) => {
    const historyEntry: GridHistory = {
      id: generateId(),
      timestamp: new Date(),
      action,
      item: { ...item },
      ...(oldPosition !== undefined && { oldPosition }),
      ...(newPosition !== undefined && { newPosition }),
      ...(data && { data }),
    }

    history.value.unshift(historyEntry)

    // 限制历史记录数量
    if (history.value.length > 100) {
      history.value = history.value.slice(0, 100)
    }
  }

  const clearHistory = () => {
    history.value = []
    saveToStorage()
  }

  // 持久化
  const STORAGE_KEY = 'mira-launcher-grid-store'

  const saveToStorage = () => {
    try {
      const data = {
        config: config.value,
        pluginConfig: pluginConfig.value,
        items: items.value,
        selectedItems: selectedItems.value,
        timestamp: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save grid store to localStorage:', error)
    }
  }

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)

        if (data.config) {
          config.value = data.config
        }

        if (data.pluginConfig) {
          pluginConfig.value = { ...pluginConfig.value, ...data.pluginConfig }
        }

        if (data.items) {
          // 恢复日期对象
          items.value = data.items.map((item: any) => ({
            ...item,
            lastUsed: item.lastUsed ? new Date(item.lastUsed) : undefined,
          }))
        }

        if (data.selectedItems) {
          selectedItems.value = data.selectedItems
        }

        return true
      }
    } catch (error) {
      console.error('Failed to load grid store from localStorage:', error)
    }
    return false
  }

  // 导入导出
  const exportConfig = () => {
    return {
      config: config.value,
      items: items.value,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    }
  }

  const importConfig = (data: any) => {
    try {
      if (data.config) {
        config.value = data.config
      }

      if (data.items) {
        items.value = data.items.map((item: any) => ({
          ...item,
          id: item.id || generateId(),
          lastUsed: item.lastUsed ? new Date(item.lastUsed) : new Date(),
        }))
      }

      selectedItems.value = []
      saveToStorage()

      return true
    } catch (error) {
      console.error('Failed to import grid config:', error)
      return false
    }
  }

  // 加载项目数据
  const loadItems = (newItems: GridItem[]) => {
    items.value = newItems.map(item => ({
      ...item,
      lastUsed: item.lastUsed || new Date(),
    }))
    selectedItems.value = []
  }

  // 清空所有项目
  const clearItems = () => {
    items.value = []
    selectedItems.value = []
    saveToStorage()
  }

  // 插件集成方法
  const registerPluginItemType = (
    pluginId: string,
    typeName: string,
    renderer: any,
    validator: (data: any) => boolean,
    defaultData: Record<string, any> = {},
  ) => {
    const typeKey = `${pluginId}.${typeName}`
    pluginItemTypes.value.set(typeKey, {
      renderer,
      validator,
      defaultData,
    })

    console.log(`[Grid] Registered plugin item type: ${typeKey}`)
    return typeKey
  }

  const unregisterPluginItemType = (pluginId: string, typeName?: string) => {
    if (typeName) {
      const typeKey = `${pluginId}.${typeName}`
      pluginItemTypes.value.delete(typeKey)
      console.log(`[Grid] Unregistered plugin item type: ${typeKey}`)
    } else {
      // 移除该插件的所有类型
      for (const [key] of pluginItemTypes.value) {
        if (key.startsWith(`${pluginId}.`)) {
          pluginItemTypes.value.delete(key)
        }
      }
      console.log(`[Grid] Unregistered all item types for plugin: ${pluginId}`)
    }
  }

  const addPluginItem = (
    pluginId: string,
    itemData: Partial<PluginGridItem>,
  ) => {
    if (!pluginConfig.value.allowPluginItems) {
      throw new Error('Plugin items are disabled')
    }

    const pluginItems = items.value.filter((item: any) => item.pluginId)
    if (pluginItems.length >= pluginConfig.value.pluginItemsLimit) {
      throw new Error(
        `Plugin items limit reached: ${pluginConfig.value.pluginItemsLimit}`,
      )
    }

    const newItem: PluginGridItem = {
      ...itemData,
      id: generateId(),
      pluginId,
      pluginType: itemData.pluginType || 'widget',
      pluginData: itemData.pluginData || {},
      lastUsed: new Date(),
    } as PluginGridItem

    items.value.push(newItem)
    addToHistory('add', newItem)
    saveToStorage()

    console.log(`[Grid] Added plugin item for ${pluginId}:`, newItem.id)
    return newItem.id
  }

  const removePluginItems = (pluginId: string) => {
    const initialLength = items.value.length
    items.value = items.value.filter((item: any) => {
      return item.pluginId !== pluginId
    })

    const removedCount = initialLength - items.value.length
    if (removedCount > 0) {
      saveToStorage()
      console.log(
        `[Grid] Removed ${removedCount} items for plugin: ${pluginId}`,
      )
    }

    return removedCount
  }

  const updatePluginConfig = (newConfig: Partial<PluginGridConfig>) => {
    pluginConfig.value = { ...pluginConfig.value, ...newConfig }
    saveToStorage()
    console.log('[Grid] Updated plugin config:', newConfig)
  }

  const getPluginItems = (pluginId?: string) => {
    const pluginItems = items.value.filter((item: any) => item.pluginId)

    if (pluginId) {
      return pluginItems.filter((item: any) => item.pluginId === pluginId)
    }

    return pluginItems
  }

  const syncWithPlugin = (
    pluginId: string,
    callback: (items: PluginGridItem[]) => void,
  ) => {
    const pluginItems = getPluginItems(pluginId) as PluginGridItem[]

    try {
      callback(pluginItems)
      console.log(`[Grid] Synced with plugin: ${pluginId}`)
    } catch (error) {
      console.error(`[Grid] Sync failed with plugin ${pluginId}:`, error)
    }
  }

  // 工具函数
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 初始化时加载数据
  loadFromStorage()

  // 自动保存监听
  watch(
    [config, pluginConfig, items, selectedItems],
    () => {
      saveToStorage()
    },
    { deep: true },
  )

  return {
    // 状态
    config,
    pluginConfig,
    items,
    dragState,
    history,
    selectedItems,
    pluginItemTypes,

    // 计算属性
    itemCount,
    hasSelection,
    sortedItems,

    // 配置管理
    updateConfig,
    resetConfig,

    // 项目管理
    addItem,
    removeItem,
    updateItem,
    moveItem,
    getItem,
    findItemIndex,
    duplicateItem,

    // 批量操作
    removeSelectedItems,

    // 选择管理
    selectItem,
    deselectItem,
    toggleSelection,
    clearSelection,
    selectAll,

    // 拖拽管理
    startDrag,
    updateDragPosition,
    endDrag,
    cancelDrag,

    // 历史管理
    clearHistory,

    // 持久化
    saveToStorage,
    loadFromStorage,
    exportConfig,
    importConfig,

    // 项目数据管理
    loadItems,
    clearItems,

    // 插件集成方法
    registerPluginItemType,
    unregisterPluginItemType,
    addPluginItem,
    removePluginItems,
    updatePluginConfig,
    getPluginItems,
    syncWithPlugin,
  }
})
