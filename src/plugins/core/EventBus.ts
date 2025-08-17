import { reactive, type Ref } from 'vue'
import type {
  EventListener,
  EventListenerOptions,
  PluginEvent,
  PluginEventType,
} from '@/types/plugin'

/**
 * 事件监听器信息
 */
interface ListenerInfo {
  listener: EventListener
  options: EventListenerOptions
  priority: number
  once: boolean
}

/**
 * 插件事件总线
 * 基于 Vue 3 响应式系统实现，与现有组件事件系统兼容
 * 支持事件优先级、异步处理和错误处理
 */
export class EventBus {
  private listeners: Map<PluginEventType, ListenerInfo[]> = new Map()
  private eventHistory: PluginEvent[] = []
  private maxHistorySize = 100
  private isDestroyed = false

  /**
   * 监听事件
   */
  on<T = unknown>(
    type: PluginEventType,
    listener: EventListener<T>,
    options: EventListenerOptions = {},
  ): void {
    if (this.isDestroyed) {
      console.warn('[EventBus] Cannot add listener to destroyed event bus')
      return
    }

    const listenerInfo: ListenerInfo = {
      listener: listener as EventListener,
      options,
      priority: options.priority || 0,
      once: options.once || false,
    }

    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }

    const listeners = this.listeners.get(type)!
    listeners.push(listenerInfo)

    // 按优先级排序（数字越大优先级越高）
    listeners.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 监听一次事件
   */
  once<T = unknown>(type: PluginEventType, listener: EventListener<T>): void {
    this.on(type, listener, { once: true })
  }

  /**
   * 取消监听事件
   */
  off<T = unknown>(type: PluginEventType, listener: EventListener<T>): void {
    if (!this.listeners.has(type)) {
      return
    }

    const listeners = this.listeners.get(type)!
    const index = listeners.findIndex(info => info.listener === listener)

    if (index !== -1) {
      listeners.splice(index, 1)
    }

    // 如果没有监听器了，删除类型
    if (listeners.length === 0) {
      this.listeners.delete(type)
    }
  }

  /**
   * 发布事件
   */
  async emit<T = unknown>(
    type: PluginEventType,
    data: T,
    source?: string,
  ): Promise<void> {
    if (this.isDestroyed) {
      console.warn('[EventBus] Cannot emit event on destroyed event bus')
      return
    }

    const event: PluginEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
      ...(source && { source }),
      cancelable: false,
      cancelled: false,
    }

    // 记录事件历史
    this.addToHistory(event)

    await this.processEvent(event)
  }

  /**
   * 发布可取消事件
   */
  async emitCancelable<T = unknown>(
    type: PluginEventType,
    data: T,
    source?: string,
  ): Promise<boolean> {
    if (this.isDestroyed) {
      console.warn('[EventBus] Cannot emit event on destroyed event bus')
      return false
    }

    const event: PluginEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
      ...(source && { source }),
      cancelable: true,
      cancelled: false,
    }

    // 记录事件历史
    this.addToHistory(event)

    await this.processEvent(event)

    return !event.cancelled
  }

  /**
   * 处理事件
   */
  private async processEvent<T = unknown>(
    event: PluginEvent<T>,
  ): Promise<void> {
    const listeners = this.listeners.get(event.type)
    if (!listeners || listeners.length === 0) {
      return
    }

    // 创建监听器副本，避免在处理过程中修改原数组
    const listenersToProcess = [...listeners]
    const listenersToRemove: ListenerInfo[] = []

    for (const listenerInfo of listenersToProcess) {
      try {
        // 如果事件已被取消且不是强制执行，跳过后续监听器
        if (event.cancelled && event.cancelable) {
          break
        }

        const result = listenerInfo.listener(event)

        // 处理异步监听器
        if (result instanceof Promise) {
          await result
        }

        // 如果是一次性监听器，标记为移除
        if (listenerInfo.once) {
          listenersToRemove.push(listenerInfo)
        }
      } catch (error) {
        console.error(
          `[EventBus] Error in event listener for ${event.type}:`,
          error,
        )

        // 发布错误事件
        this.emitErrorEvent(error, event, listenerInfo)
      }
    }

    // 移除一次性监听器
    if (listenersToRemove.length > 0) {
      const currentListeners = this.listeners.get(event.type)
      if (currentListeners) {
        for (const listenerToRemove of listenersToRemove) {
          const index = currentListeners.indexOf(listenerToRemove)
          if (index !== -1) {
            currentListeners.splice(index, 1)
          }
        }
      }
    }
  }

  /**
   * 发布错误事件
   */
  private emitErrorEvent(
    error: unknown,
    originalEvent: PluginEvent,
    listenerInfo: ListenerInfo,
  ): void {
    try {
      const errorEvent: PluginEvent<{
        error: unknown
        originalEvent: PluginEvent
        listener: ListenerInfo
      }> = {
        type: 'plugin:error',
        data: { error, originalEvent, listener: listenerInfo },
        timestamp: Date.now(),
        source: 'event-bus',
        cancelable: false,
        cancelled: false,
      }

      // 异步发布错误事件，避免递归
      setTimeout(() => {
        this.processEvent(errorEvent)
      }, 0)
    } catch (err) {
      console.error('[EventBus] Failed to emit error event:', err)
    }
  }

  /**
   * 添加事件到历史记录
   */
  private addToHistory(event: PluginEvent): void {
    this.eventHistory.unshift(event)

    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize)
    }
  }

  /**
   * 获取事件历史
   */
  getHistory(type?: PluginEventType, limit?: number): PluginEvent[] {
    let history = this.eventHistory

    if (type) {
      history = history.filter(event => event.type === type)
    }

    if (limit && limit > 0) {
      history = history.slice(0, limit)
    }

    return [...history]
  }

  /**
   * 清空事件历史
   */
  clearHistory(): void {
    this.eventHistory = []
  }

  /**
   * 获取指定事件类型的监听器数量
   */
  getListenerCount(type?: PluginEventType): number {
    if (type) {
      return this.listeners.get(type)?.length || 0
    }

    let total = 0
    for (const listeners of this.listeners.values()) {
      total += listeners.length
    }
    return total
  }

  /**
   * 获取所有事件类型
   */
  getEventTypes(): PluginEventType[] {
    return Array.from(this.listeners.keys())
  }

  /**
   * 检查是否有指定事件类型的监听器
   */
  hasListeners(type: PluginEventType): boolean {
    return this.listeners.has(type) && this.listeners.get(type)!.length > 0
  }

  /**
   * 移除指定事件类型的所有监听器
   */
  removeAllListeners(type?: PluginEventType): void {
    if (type) {
      this.listeners.delete(type)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * 销毁事件总线
   */
  destroy(): void {
    this.removeAllListeners()
    this.clearHistory()
    this.isDestroyed = true
  }

  /**
   * 获取调试信息
   */
  getDebugInfo(): {
    listenerCount: number
    eventTypes: PluginEventType[]
    historySize: number
    isDestroyed: boolean
    } {
    return {
      listenerCount: this.getListenerCount(),
      eventTypes: this.getEventTypes(),
      historySize: this.eventHistory.length,
      isDestroyed: this.isDestroyed,
    }
  }
}

/**
 * 创建响应式事件总线
 * 利用 Vue 3 响应式系统
 */
export function createReactiveEventBus(): EventBus & Ref {
  const eventBus = new EventBus()
  return reactive(eventBus) as EventBus & Ref
}

/**
 * 全局事件总线实例
 */
export const globalEventBus = new EventBus()

/**
 * 事件总线工具函数
 */
export const eventBusUtils = {
  /**
   * 创建事件过滤器
   */
  createFilter(types: PluginEventType[]) {
    const typeSet = new Set(types)
    return (event: PluginEvent) => typeSet.has(event.type)
  },

  /**
   * 创建事件映射器
   */
  createMapper<T, R>(mapper: (data: T) => R) {
    return (event: PluginEvent<T>): PluginEvent<R> => ({
      ...event,
      data: mapper(event.data),
    })
  },

  /**
   * 创建防抖监听器
   */
  createDebouncedListener<T>(
    listener: EventListener<T>,
    delay: number,
  ): EventListener<T> {
    let timeoutId: number | undefined

    return (event: PluginEvent<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        listener(event)
      }, delay)
    }
  },

  /**
   * 创建节流监听器
   */
  createThrottledListener<T>(
    listener: EventListener<T>,
    delay: number,
  ): EventListener<T> {
    let lastCall = 0

    return (event: PluginEvent<T>) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        listener(event)
      }
    }
  },
}
