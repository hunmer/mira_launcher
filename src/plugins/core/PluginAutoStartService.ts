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

      // 2. 加载插件
      console.log(`⚡ 开始加载 ${validPlugins.length} 个有效插件...`)
      const loadResults = await this.loader.loadPlugins(validPlugins)

      for (const loadResult of loadResults) {
        if (loadResult.success) {
          result.loaded++
          console.log(`✅ 成功加载插件: ${loadResult.metadata.name} (${loadResult.metadata.id})`)

          // 3. 注册插件
          try {
            if (loadResult.pluginClass) {
              const registered = await this.pluginStore.registerPlugin(
                loadResult.pluginClass,
                loadResult.metadata,
              )

              if (registered) {
                result.registered++
                console.log(`📝 成功注册插件: ${loadResult.metadata.id}`)

                // 4. 尝试激活插件 (如果配置了自动激活)
                try {
                  const activated = await this.pluginStore.activatePlugin(loadResult.metadata.id)
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
                result.errors.push(`Failed to register plugin ${loadResult.metadata.id}`)
              }
            } else {
              result.errors.push(`No plugin class found for ${loadResult.metadata.id}`)
            }
          } catch (registerError) {
            const errorMsg = `Failed to register plugin ${loadResult.metadata.id}: ${registerError}`
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

      console.log(`✨ 插件启动完成: 发现${result.discovered}个, 加载${result.loaded}个, 注册${result.registered}个, 激活${result.activated}个`)

      if (result.errors.length > 0) {
        const errorLogEnabled = PluginSettingsService.shouldShowErrors()
        console.warn(`⚠️ 有 ${result.errors.length} 个错误${errorLogEnabled ? ':' : '（详情已隐藏）'}`)
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
