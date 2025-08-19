import type { PluginDiscoveryResult } from '@/plugins/loader/Discovery'
import { PluginDiscovery } from '@/plugins/loader/Discovery'
import { PluginLoader } from '@/plugins/loader/PluginLoader'
import { usePluginStore } from '@/stores/plugin'
import { PluginSettingsService } from './PluginSettingsService'

/**
 * 插件自动启动服务
 * 负责发现、加载和注册所有可用插件
 */
export class PluginAutoStartService {
  private discovery: PluginDiscovery
  private loader: PluginLoader
  private pluginStore: ReturnType<typeof usePluginStore>

  constructor() {
    // 使用设置服务获取动态配置
    const discoveryConfig = PluginSettingsService.getDiscoveryConfig()
    const loaderConfig = PluginSettingsService.getLoaderConfig()

    this.discovery = new PluginDiscovery(discoveryConfig)
    this.loader = new PluginLoader(loaderConfig)
    this.pluginStore = usePluginStore()
  }

  /**
   * 检查插件是否应该被激活
   * 从插件设置或用户配置中读取
   */
  private async shouldActivatePlugin(pluginId: string): Promise<boolean> {
    // 检查用户是否在设置中启用了这个插件
    // 这里可以从 localStorage 或者其他配置源读取
    try {
      const storedActivations = localStorage.getItem('mira:plugin:activations')
      if (storedActivations) {
        const activations = JSON.parse(storedActivations)
        return activations[pluginId] === true
      }
    } catch (error) {
      console.warn(`Failed to read activation state for ${pluginId}:`, error)
    }

    // 默认不激活，需要用户手动启用
    return false
  }

  /**
   * 获取 eval 执行后的插件实例
   * 从全局对象中查找插件实例
   */
  private async getEvalPluginInstance(pluginId: string): Promise<any> {
    try {
      // 尝试从 window 全局对象获取插件实例
      if (typeof window !== 'undefined') {
        // 常见的插件类名格式
        const possibleNames = [
          pluginId,
          pluginId.charAt(0).toUpperCase() + pluginId.slice(1),
          pluginId.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()),
          `${pluginId}Plugin`,
          `${pluginId.charAt(0).toUpperCase() + pluginId.slice(1)}Plugin`,
        ]

        for (const name of possibleNames) {
          if ((window as any)[name]) {
            const PluginClass = (window as any)[name]
            // 如果是类，创建实例；如果已经是实例，直接返回
            if (typeof PluginClass === 'function') {
              return new PluginClass()
            } else if (typeof PluginClass === 'object') {
              return PluginClass
            }
          }
        }

        // 尝试工厂函数
        const factoryName = `create${pluginId.charAt(0).toUpperCase() + pluginId.slice(1)}`
        if ((window as any)[factoryName] && typeof (window as any)[factoryName] === 'function') {
          return (window as any)[factoryName]()
        }
      }

      console.warn(`No plugin instance found for ${pluginId} in global scope`)
      return null
    } catch (error) {
      console.error(`Failed to get eval plugin instance for ${pluginId}:`, error)
      return null
    }
  }

  /**
   * 自动发现并加载所有插件
   */
  async discoverAndLoadPlugins(): Promise<{
    discovered: number
    loaded: number
    registered: number
    activated: number
    errors: string[]
  }> {
    const result = {
      discovered: 0,
      loaded: 0,
      registered: 0,
      activated: 0,
      errors: [] as string[],
    }

    try {
      console.log('🔍 开始插件发现...')

      // 检查是否启用自动加载
      if (!PluginSettingsService.isAutoLoadEnabled()) {
        console.log('⚠️ 插件自动加载已禁用')
        return result
      }

      // 显示当前插件目录配置
      const pluginDirs = PluginSettingsService.getPluginDirectories()
      console.log('📂 插件搜索目录:', pluginDirs)

      // 1. 发现插件
      const discoveredPlugins = await this.discovery.discoverPlugins()
      result.discovered = discoveredPlugins.length

      console.log(`📦 发现 ${result.discovered} 个插件`)

      if (discoveredPlugins.length === 0) {
        console.log('⚠️ 未发现任何插件')
        return result
      }

      // 过滤有效插件
      const validPlugins = discoveredPlugins.filter(plugin => plugin.isValid)
      const invalidPlugins = discoveredPlugins.filter(plugin => !plugin.isValid)

      if (invalidPlugins.length > 0) {
        invalidPlugins.forEach(plugin => {
          const errorMsg = `Invalid plugin ${plugin.metadata.id}: ${plugin.errors.join(', ')}`
          result.errors.push(errorMsg)

          // 只在设置允许时显示错误详情
          if (PluginSettingsService.shouldShowErrors()) {
            console.warn(`⚠️ ${errorMsg}`)
          }
        })
      }

      // 2. 仅加载插件元数据，不执行代码
      console.log('⚡ 加载插件元数据（不执行代码）...')
      const loadResults = await Promise.all(
        validPlugins.map(plugin => this.loader.loadPluginMetadataOnly(plugin)),
      )

      for (const loadResult of loadResults) {
        if (loadResult.success) {
          result.loaded++
          console.log(
            `✅ 成功加载插件元数据: ${loadResult.metadata.name} (${loadResult.metadata.id})`,
          )

          // 3. 首先注册所有插件的元数据（这样插件列表可以显示它们）
          try {
            // 使用现有的 registerPlugin 方法，但不提供插件类
            // 这样插件会以 'registered' 状态显示在列表中
            const registered = await this.pluginStore.registerPlugin(
              null as any, // 暂时不提供插件类
              loadResult.metadata,
            )

            if (registered) {
              result.registered++
              console.log(`📝 成功注册插件元数据: ${loadResult.metadata.id}`)

              // 检查插件是否应该被激活（从设置中读取）
              const shouldActivate = await this.shouldActivatePlugin(loadResult.metadata.id)
              
              if (shouldActivate) {
                console.log(`🔄 插件 ${loadResult.metadata.id} 被标记为激活，开始执行代码...`)
                
                // 找到对应的发现结果
                const discoveryResult = validPlugins.find(p => p.metadata.id === loadResult.metadata.id)
                if (discoveryResult) {
                  // 执行插件代码
                  const executeResult = await this.loader.loadAndExecutePluginCode(discoveryResult)
                  
                  if (executeResult.success) {
                    console.log(`✅ 成功执行插件代码: ${loadResult.metadata.id}`)
                    
                    // 对于 eval 插件，我们需要从全局对象获取插件实例
                    const pluginInstance = await this.getEvalPluginInstance(loadResult.metadata.id)
                    
                    if (pluginInstance) {
                      // 现在尝试激活插件
                      try {
                        const activated = await this.pluginStore.activatePlugin(
                          loadResult.metadata.id,
                        )
                        if (activated) {
                          result.activated++
                          console.log(`🚀 成功激活插件: ${loadResult.metadata.id}`)
                        }
                      } catch (activateError) {
                        const errorMsg = `Failed to activate plugin ${loadResult.metadata.id}: ${activateError}`
                        result.errors.push(errorMsg)
                        console.warn(`⚠️ ${errorMsg}`)
                      }
                    } else {
                      result.errors.push(
                        `No plugin instance found after eval execution for ${loadResult.metadata.id}`,
                      )
                    }
                  } else {
                    result.errors.push(
                      `Failed to execute plugin code for ${loadResult.metadata.id}: ${executeResult.error}`,
                    )
                  }
                }
              } else {
                console.log(`⏸️ 插件 ${loadResult.metadata.id} 未被激活，保持元数据注册状态`)
              }
            } else {
              result.errors.push(
                `Failed to register plugin metadata ${loadResult.metadata.id}`,
              )
            }
          } catch (registerError) {
            const errorMsg = `Failed to process plugin ${loadResult.metadata.id}: ${registerError}`
            result.errors.push(errorMsg)
            console.error(`❌ ${errorMsg}`)
          }
        } else {
          const errorMsg = `Failed to load plugin ${loadResult.metadata.id}: ${loadResult.error}`
          result.errors.push(errorMsg)

          // 只在设置允许时显示错误详情
          if (PluginSettingsService.shouldShowErrors()) {
            console.error(`❌ ${errorMsg}`)
          }
        }
      }

      console.log(
        `✨ 插件启动完成: 发现${result.discovered}个, 加载${result.loaded}个, 注册${result.registered}个, 激活${result.activated}个`,
      )

      if (result.errors.length > 0) {
        const errorLogEnabled = PluginSettingsService.shouldShowErrors()
        console.warn(
          `⚠️ 有 ${result.errors.length} 个错误${errorLogEnabled ? ':' : '（详情已隐藏）'}`,
        )
        if (errorLogEnabled) {
          result.errors.forEach(error => console.warn(`  - ${error}`))
        }
      }
    } catch (error) {
      const errorMsg = `Plugin auto-start failed: ${error}`
      result.errors.push(errorMsg)
      console.error(`❌ ${errorMsg}`)
    }

    return result
  }

  /**
   * 重新扫描并加载新插件
   */
  async rescanPlugins(): Promise<boolean> {
    try {
      console.log('🔄 重新扫描插件...')
      const result = await this.discoverAndLoadPlugins()
      return result.errors.length === 0
    } catch (error) {
      console.error('❌ 重新扫描插件失败:', error)
      return false
    }
  }

  /**
   * 重新配置并重新扫描插件
   * 当插件设置改变时调用
   */
  async reconfigure(): Promise<boolean> {
    try {
      console.log('⚙️ 重新配置插件系统...')

      // 重新创建 discovery 和 loader 实例以应用新配置
      const discoveryConfig = PluginSettingsService.getDiscoveryConfig()
      const loaderConfig = PluginSettingsService.getLoaderConfig()

      this.discovery = new PluginDiscovery(discoveryConfig)
      this.loader = new PluginLoader(loaderConfig)

      console.log('🔄 重新扫描插件...')
      const result = await this.discoverAndLoadPlugins()
      return result.errors.length === 0
    } catch (error) {
      console.error('❌ 重新配置插件失败:', error)
      return false
    }
  }

  /**
   * 获取发现的插件列表
   */
  getDiscoveredPlugins(): PluginDiscoveryResult[] {
    return this.discovery.getAllDiscoveredPlugins()
  }

  /**
   * 根据ID获取插件
   */
  getPluginById(pluginId: string): PluginDiscoveryResult | undefined {
    return this.discovery.getPluginById(pluginId)
  }
}
