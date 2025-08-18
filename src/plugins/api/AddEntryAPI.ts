import type { AddEntry } from '@/stores/addEntries'
import { useAddEntriesStore } from '@/stores/addEntries'

/**
 * 插件添加入口 API
 * 允许插件注册应用入口到添加应用对话框
 */
export interface PluginAddEntryAPI {
  /**
   * 注册添加入口
   */
  register(entry: AddEntry): string
  
  /**
   * 取消注册添加入口
   */
  unregister(entryId: string): boolean
  
  /**
   * 获取已注册的入口列表
   */
  getEntries(): AddEntry[]
  
  /**
   * 检查入口是否已注册
   */
  isRegistered(entryId: string): boolean
}

/**
 * 添加入口 API 实现
 */
export class PluginAddEntryAPIImpl implements PluginAddEntryAPI {
  private currentPlugin: string = ''
  
  constructor(pluginId?: string) {
    if (pluginId) {
      this.currentPlugin = pluginId
    }
  }
  
  /**
   * 设置当前插件ID
   */
  setCurrentPlugin(pluginId: string): void {
    this.currentPlugin = pluginId
  }
  
  /**
   * 注册添加入口
   */
  register(entry: AddEntry): string {
    const store = useAddEntriesStore()
    
    // 为入口添加插件标识
    const entryWithPlugin: AddEntry = {
      ...entry,
      id: entry.id || `${this.currentPlugin}-${Date.now()}`,
      // 如果没有指定插件信息，自动添加
      pluginId: entry.pluginId || this.currentPlugin,
    }
    
    // 注册入口
    store.register(entryWithPlugin)
    
    console.log(`[AddEntryAPI] Registered entry "${entryWithPlugin.id}" for plugin "${this.currentPlugin}"`)
    
    return entryWithPlugin.id
  }
  
  /**
   * 取消注册添加入口
   */
  unregister(entryId: string): boolean {
    const store = useAddEntriesStore()
    
    try {
      store.unregister(entryId)
      console.log(`[AddEntryAPI] Unregistered entry "${entryId}" for plugin "${this.currentPlugin}"`)
      return true
    } catch (error) {
      console.warn(`[AddEntryAPI] Failed to unregister entry "${entryId}":`, error)
      return false
    }
  }
  
  /**
   * 获取已注册的入口列表
   */
  getEntries(): AddEntry[] {
    const store = useAddEntriesStore()
    
    // 只返回当前插件注册的入口
    return store.entries.filter(entry => entry.pluginId === this.currentPlugin)
  }
  
  /**
   * 检查入口是否已注册
   */
  isRegistered(entryId: string): boolean {
    const store = useAddEntriesStore()
    return store.entries.some(entry => entry.id === entryId)
  }
}

/**
 * 创建添加入口 API 实例
 */
export function createAddEntryAPI(pluginId?: string): PluginAddEntryAPI {
  return new PluginAddEntryAPIImpl(pluginId)
}

/**
 * 全局添加入口 API 实例
 */
export const globalAddEntryAPI = createAddEntryAPI()

/**
 * 添加入口 API 工具函数
 */
export const addEntryUtils = {
  /**
   * 验证入口ID格式
   */
  validateEntryId(entryId: string): boolean {
    return /^[a-zA-Z0-9-_]+$/.test(entryId)
  },
  
  /**
   * 生成入口ID
   */
  generateEntryId(pluginId: string, suffix?: string): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 5)
    const parts = [pluginId, suffix, timestamp, random].filter(Boolean)
    return parts.join('-')
  },
  
  /**
   * 格式化入口信息
   */
  formatEntry(entry: AddEntry): string {
    return `${entry.label} (${entry.id}) - ${entry.type}`
  },
}

// 导出类型
export type {
    AddEntry,
}

