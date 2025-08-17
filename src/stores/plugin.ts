import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  PluginMetadata,
  PluginState,
  PluginRegistryEntry,
  PluginConfiguration,
} from '@/types/plugin'
import { PluginManager } from '@/plugins/core/PluginManager'
import { EventBus } from '@/plugins/core/EventBus'

/**
 * 插件状态管理 Store
 * 集成 Pinia 状态管理，与现有应用状态保持一致
 * 提供响应式的插件管理接口
 */
export const usePluginStore = defineStore('plugin', () => {
  // 响应式状态
  const pluginManager = ref<PluginManager>()
  const eventBus = ref<EventBus>()
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const plugins = computed(() => {
    if (!pluginManager.value) return []
    return pluginManager.value.getAllPlugins()
  })

  const activePlugins = computed(() => {
    if (!pluginManager.value) return []
    return pluginManager.value.getPluginsByState('active')
  })

  const loadedPlugins = computed(() => {
    if (!pluginManager.value) return []
    return pluginManager.value.getPluginsByState('loaded')
  })

  const errorPlugins = computed(() => {
    if (!pluginManager.value) return []
    return pluginManager.value.getPluginsByState('error')
  })

  const pluginStats = computed(() => {
    if (!pluginManager.value) return null
    return pluginManager.value.getStats()
  })

  const pluginCount = computed(() => plugins.value.length)
  const activePluginCount = computed(() => activePlugins.value.length)

  // 初始化插件系统
  const initialize = async (config?: {
    maxPlugins?: number
    autoActivate?: boolean
    enableSandbox?: boolean
  }) => {
    if (isInitialized.value) {
      console.warn('[PluginStore] Plugin system already initialized')
      return
    }

    try {
      isLoading.value = true
      error.value = null

      // 创建事件总线和插件管理器
      eventBus.value = new EventBus()
      pluginManager.value = new PluginManager(eventBus.value, config)

      // 监听插件事件并更新状态
      setupEventListeners()

      isInitialized.value = true
      console.log('[PluginStore] Plugin system initialized successfully')

      // 从 localStorage 恢复插件配置
      await restorePluginConfigurations()
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to initialize plugin system'
      console.error('[PluginStore] Failed to initialize plugin system:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 设置事件监听器
  const setupEventListeners = () => {
    if (!eventBus.value) return

    // 监听插件状态变化事件
    eventBus.value.on('plugin:registered', () => {
      console.log('[PluginStore] Plugin registered event received')
    })

    eventBus.value.on('plugin:loaded', () => {
      console.log('[PluginStore] Plugin loaded event received')
    })

    eventBus.value.on('plugin:activated', () => {
      console.log('[PluginStore] Plugin activated event received')
    })

    eventBus.value.on('plugin:deactivated', () => {
      console.log('[PluginStore] Plugin deactivated event received')
    })

    eventBus.value.on('plugin:unloaded', () => {
      console.log('[PluginStore] Plugin unloaded event received')
    })

    eventBus.value.on('plugin:error', (event: any) => {
      console.error('[PluginStore] Plugin error event received:', event.data)
      error.value = `Plugin error: ${event.data?.error || 'Unknown error'}`
    })
  }

  // 注册插件
  const registerPlugin = async (
    pluginClass: new () => any,
    metadata: PluginMetadata,
  ): Promise<boolean> => {
    if (!pluginManager.value) {
      throw new Error('Plugin system not initialized')
    }

    try {
      isLoading.value = true
      error.value = null

      const success = await pluginManager.value.register(pluginClass, metadata)

      if (success) {
        // 保存插件配置到 localStorage
        await savePluginConfiguration(metadata.id, {})
      }

      return success
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to register plugin'
      console.error('[PluginStore] Failed to register plugin:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 加载插件
  const loadPlugin = async (pluginId: string): Promise<boolean> => {
    if (!pluginManager.value) {
      throw new Error('Plugin system not initialized')
    }

    try {
      isLoading.value = true
      error.value = null

      return await pluginManager.value.load(pluginId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load plugin'
      console.error('[PluginStore] Failed to load plugin:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 激活插件
  const activatePlugin = async (pluginId: string): Promise<boolean> => {
    if (!pluginManager.value) {
      throw new Error('Plugin system not initialized')
    }

    try {
      isLoading.value = true
      error.value = null

      const success = await pluginManager.value.activate(pluginId)

      if (success) {
        // 更新激活状态到 localStorage
        await savePluginActivationState(pluginId, true)
      }

      return success
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to activate plugin'
      console.error('[PluginStore] Failed to activate plugin:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 停用插件
  const deactivatePlugin = async (pluginId: string): Promise<boolean> => {
    if (!pluginManager.value) {
      throw new Error('Plugin system not initialized')
    }

    try {
      isLoading.value = true
      error.value = null

      const success = await pluginManager.value.deactivate(pluginId)

      if (success) {
        // 更新激活状态到 localStorage
        await savePluginActivationState(pluginId, false)
      }

      return success
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to deactivate plugin'
      console.error('[PluginStore] Failed to deactivate plugin:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 卸载插件
  const unloadPlugin = async (pluginId: string): Promise<boolean> => {
    if (!pluginManager.value) {
      throw new Error('Plugin system not initialized')
    }

    try {
      isLoading.value = true
      error.value = null

      const success = await pluginManager.value.unload(pluginId)

      if (success) {
        // 清理 localStorage 中的插件数据
        await removePluginConfiguration(pluginId)
      }

      return success
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to unload plugin'
      console.error('[PluginStore] Failed to unload plugin:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 配置插件
  const configurePlugin = async (
    pluginId: string,
    configuration: PluginConfiguration,
  ): Promise<boolean> => {
    if (!pluginManager.value) {
      throw new Error('Plugin system not initialized')
    }

    try {
      const success = pluginManager.value.configurePlugin(
        pluginId,
        configuration,
      )

      if (success) {
        // 保存配置到 localStorage
        await savePluginConfiguration(pluginId, configuration)
      }

      return success
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to configure plugin'
      console.error('[PluginStore] Failed to configure plugin:', err)
      return false
    }
  }

  // 获取插件信息
  const getPlugin = (pluginId: string): PluginRegistryEntry | undefined => {
    if (!pluginManager.value) return undefined
    return pluginManager.value.getPlugin(pluginId)
  }

  // 获取插件配置
  const getPluginConfiguration = (
    pluginId: string,
  ): PluginConfiguration | undefined => {
    if (!pluginManager.value) return undefined
    return pluginManager.value.getPluginConfiguration(pluginId)
  }

  // 检查插件是否激活
  const isPluginActive = (pluginId: string): boolean => {
    const plugin = getPlugin(pluginId)
    return plugin?.state === 'active'
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  // localStorage 操作
  const STORAGE_KEYS = {
    PLUGIN_CONFIGS: 'mira:plugin:configs',
    PLUGIN_ACTIVATIONS: 'mira:plugin:activations',
  }

  // 保存插件配置
  const savePluginConfiguration = async (
    pluginId: string,
    configuration: PluginConfiguration,
  ): Promise<void> => {
    try {
      const configs = getStoredConfigurations()
      configs[pluginId] = configuration
      localStorage.setItem(STORAGE_KEYS.PLUGIN_CONFIGS, JSON.stringify(configs))
    } catch (error) {
      console.error('[PluginStore] Failed to save plugin configuration:', error)
    }
  }

  // 保存插件激活状态
  const savePluginActivationState = async (
    pluginId: string,
    isActive: boolean,
  ): Promise<void> => {
    try {
      const activations = getStoredActivations()
      activations[pluginId] = isActive
      localStorage.setItem(
        STORAGE_KEYS.PLUGIN_ACTIVATIONS,
        JSON.stringify(activations),
      )
    } catch (error) {
      console.error(
        '[PluginStore] Failed to save plugin activation state:',
        error,
      )
    }
  }

  // 移除插件配置
  const removePluginConfiguration = async (pluginId: string): Promise<void> => {
    try {
      const configs = getStoredConfigurations()
      delete configs[pluginId]
      localStorage.setItem(STORAGE_KEYS.PLUGIN_CONFIGS, JSON.stringify(configs))

      const activations = getStoredActivations()
      delete activations[pluginId]
      localStorage.setItem(
        STORAGE_KEYS.PLUGIN_ACTIVATIONS,
        JSON.stringify(activations),
      )
    } catch (error) {
      console.error(
        '[PluginStore] Failed to remove plugin configuration:',
        error,
      )
    }
  }

  // 获取存储的配置
  const getStoredConfigurations = (): Record<string, PluginConfiguration> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLUGIN_CONFIGS)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('[PluginStore] Failed to get stored configurations:', error)
      return {}
    }
  }

  // 获取存储的激活状态
  const getStoredActivations = (): Record<string, boolean> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLUGIN_ACTIVATIONS)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('[PluginStore] Failed to get stored activations:', error)
      return {}
    }
  }

  // 恢复插件配置
  const restorePluginConfigurations = async (): Promise<void> => {
    try {
      const configs = getStoredConfigurations()
      const activations = getStoredActivations()

      // 应用保存的配置（在实际插件加载后会使用）
      console.log('[PluginStore] Plugin configurations restored:', configs)
      console.log('[PluginStore] Plugin activations restored:', activations)
    } catch (error) {
      console.error(
        '[PluginStore] Failed to restore plugin configurations:',
        error,
      )
    }
  }

  // 重置插件系统
  const reset = async (): Promise<void> => {
    try {
      if (pluginManager.value) {
        await pluginManager.value.destroy()
      }

      pluginManager.value = undefined
      eventBus.value = undefined
      isInitialized.value = false
      isLoading.value = false
      error.value = null

      console.log('[PluginStore] Plugin system reset')
    } catch (err) {
      console.error('[PluginStore] Failed to reset plugin system:', err)
    }
  }

  // 销毁插件系统
  const destroy = async (): Promise<void> => {
    await reset()
  }

  return {
    // 状态
    isInitialized,
    isLoading,
    error,

    // 计算属性
    plugins,
    activePlugins,
    loadedPlugins,
    errorPlugins,
    pluginStats,
    pluginCount,
    activePluginCount,

    // 核心方法
    initialize,
    registerPlugin,
    loadPlugin,
    activatePlugin,
    deactivatePlugin,
    unloadPlugin,
    configurePlugin,

    // 查询方法
    getPlugin,
    getPluginConfiguration,
    isPluginActive,

    // 工具方法
    clearError,
    reset,
    destroy,

    // 内部访问（用于调试）
    pluginManager,
    eventBus,
  }
})
