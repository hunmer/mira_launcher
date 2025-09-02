
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pluginSDK = (window as any).__moduleCache['../plugin-sdk']
const BasePlugin = pluginSDK?.BasePlugin
const console = pluginSDK?.console || window.console


/**
 * 窗口测试插件 - 使用真正的 BasePlugin 基类
 * 演示新的插件窗口管理系统功能
 */
export class WindowTestPlugin extends BasePlugin {
  readonly id = 'window-test-plugin'
  readonly name = '窗口测试插件'
  readonly version = '1.0.0'
  readonly description = '用于测试插件窗口管理系统的示例插件'
  readonly author = 'Mira Launcher Team'
  readonly dependencies: string[] = []
  readonly permissions: string[] = []
  readonly minAppVersion = '1.0.0'

  // 实现必需的抽象属性
  readonly search_regexps = undefined
  readonly logs = undefined
  readonly configs = undefined
  readonly contextMenus = undefined
  readonly hotkeys = undefined
  readonly subscriptions = undefined
  readonly notifications = undefined
  readonly storage = undefined
  readonly queue = undefined
  readonly builder = undefined

  private windowCount = 0

  /**
   * 插件加载生命周期方法
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async onLoad(): Promise<void> {
    console.log('[WindowTestPlugin] 插件加载完成')
  }

  /**
   * 插件激活生命周期方法
   */
  async onActivate(): Promise<void> {
    console.log('[WindowTestPlugin] ===== 插件激活开始 =====')
    
    if (!this.api) {
      console.error('[WindowTestPlugin] API 未初始化!')
      return
    }
    
    console.log('[WindowTestPlugin] API 检查:')
    console.log('  - API 对象:', !!this.api)
    console.log('  - window API:', !!this.api.window)
    console.log('  - protocol API:', !!this.api.protocol)
    
    // 注册协议处理器
    console.log('[WindowTestPlugin] 注册协议处理器...')
    
    this.api.protocol.registerHandler('demo', (params) => {
      console.log('[WindowTestPlugin] [协议] demo 被调用:', params)
      this.showDemoWindow()
    })

    this.api.protocol.registerHandler('settings', (params) => {
      console.log('[WindowTestPlugin] [协议] settings 被调用:', params)
      this.openSettingsWindow()
    })

    this.api.protocol.registerHandler('config', (params) => {
      console.log('[WindowTestPlugin] [协议] config 被调用:', params)
      this.openConfigWindow()
    })

    this.api.protocol.registerHandler('help', (params) => {
      console.log('[WindowTestPlugin] [协议] help 被调用:', params)
      this.openHelpWindow()
    })
    
    console.log('[WindowTestPlugin] 协议处理器注册完成')
    console.log('[WindowTestPlugin] ===== 插件激活完成 =====')
  }

  /**
   * 插件停用生命周期方法
   */
  async onDeactivate(): Promise<void> {
    console.log('[WindowTestPlugin] ===== 插件停用开始 =====')
    
    try {
      
      // 关闭所有窗口
      await this.api?.window.closeAll()
      console.log('[WindowTestPlugin] 所有窗口已关闭')
      
      // 清理协议处理器
      this.api?.protocol.unregisterHandler('demo')
      this.api?.protocol.unregisterHandler('settings')
      this.api?.protocol.unregisterHandler('config')
      this.api?.protocol.unregisterHandler('help')
      console.log('[WindowTestPlugin] 协议处理器已清理')
      
    } catch (error) {
      console.error('[WindowTestPlugin] 停用过程中出错:', error)
    }
    
    console.log('[WindowTestPlugin] ===== 插件停用完成 =====')
  }

  /**
   * 插件卸载生命周期方法
   */
  async onUnload(): Promise<void> {
    console.log('[WindowTestPlugin] ===== 插件卸载开始 =====')
    
    try {
      // 确保所有资源都已清理
      await this.onDeactivate()
    } catch (error) {
      console.error('[WindowTestPlugin] 卸载过程中出错:', error)
    }
    
    console.log('[WindowTestPlugin] ===== 插件卸载完成 =====')
  }

  /**
   * 处理插件启动事件（由 PluginWindowManager 直接调用）
   */
  async onLaunch(event: { 
    pluginId: string
    action: string
    route?: string
    params?: Record<string, unknown>
    windowOptions?: Record<string, unknown>
  }) {
    console.log(this)
    console.log('[WindowTestPlugin] 接收到启动事件:', JSON.stringify(event, null, 2))
    console.log('[WindowTestPlugin] 事件详情:')
    console.log('  - pluginId:', event.pluginId)
    console.log('  - action:', event.action)
    console.log('  - route:', event.route)
    console.log('  - params:', event.params)
    console.log('  - windowOptions:', event.windowOptions)
    
    // 检查 API 可用性
    if (!this.api) {
      console.error('[WindowTestPlugin] API 不可用，无法处理启动事件')
      return
    }
    
    console.log('[WindowTestPlugin] API 状态检查:')
    console.log('  - API 对象:', !!this.api)
    console.log('  - window API:', !!this.api?.window)
    console.log('  - createWindow 方法:', !!this.api?.window?.createWindow)
    
    const { action, route, params, windowOptions } = event
    
    try {
      switch (action) {
        case 'launch':
          console.log('[WindowTestPlugin] 处理 launch action - 默认打开主页面')
          await this.openMainPage({ route, ...params, ...windowOptions })
          break
        
        case 'settings':
          console.log('[WindowTestPlugin] 处理 settings action')
          await this.openSettingsPage({ route, ...params, ...windowOptions })
          break
        
        case 'config':
        case 'configure':
          console.log('[WindowTestPlugin] 处理 config/configure action')
          await this.openConfigPage({ route, ...params, ...windowOptions })
          break
        
        case 'help':
          console.log('[WindowTestPlugin] 处理 help action')
          await this.openHelpPage({ route, ...params, ...windowOptions })
          break
        
        case 'homepage':
        case 'main':
          console.log('[WindowTestPlugin] 处理 homepage/main action')
          await this.openMainPage({ route, ...params, ...windowOptions })
          break
        
        case 'test':
          console.log('[WindowTestPlugin] 处理 test action - 运行所有功能测试')
          await this.testAllFeatures()
          break
        
        default:
          console.log(`[WindowTestPlugin] 处理未知 action: ${action}`)
          // 如果指定了窗口选项，创建自定义窗口
          if (windowOptions && Object.keys(windowOptions).length > 0) {
            console.log('[WindowTestPlugin] 创建自定义窗口')
            await this.createCustomWindow(action, { route, ...params, ...windowOptions })
          } else if (route) {
            console.log('[WindowTestPlugin] 尝试导航到路由:', route)
            await this.navigateToRoute(route, params)
          } else {
            console.log('[WindowTestPlugin] 默认打开主页面')
            await this.openMainPage({ route, ...params })
          }
          break
      }
      
      console.log(`[WindowTestPlugin] 成功处理启动事件 action: ${action}`)
    } catch (error) {
      console.error(`[WindowTestPlugin] 处理启动事件失败 action: ${action}`, error)
      throw error
    }
  }

  /**
   * 创建自定义窗口
   */
  async createCustomWindow(action: string, options?: Record<string, unknown>) {
    console.log(`[WindowTestPlugin] 创建自定义窗口: ${action}`, options)
    
    if (!this.api) {
      console.error('[WindowTestPlugin] API 不可用，无法创建自定义窗口')
      return
    }
    
    try {
      const windowOptions = {
        title: `${this.name} - ${action}`,
        width: (options?.width as number) || 800,
        height: (options?.height as number) || 600,
        html: `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>${action} - ${this.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; }
              .action { font-size: 24px; font-weight: bold; color: #333; }
              .options { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>插件窗口测试</h1>
              <div class="action">Action: ${action}</div>
              <div class="options">
                <h3>选项:</h3>
                <pre>${JSON.stringify(options, null, 2)}</pre>
              </div>
            </div>
          </body>
          </html>
        `,
      }
      
      const window = await this.api?.window.createWindow(windowOptions)
      
      console.log(`[WindowTestPlugin] 自定义窗口已创建: ${action}`, window?.id)
      return window
    } catch (error) {
      console.error(`[WindowTestPlugin] 创建自定义窗口失败: ${action}`, error)
      throw error
    }
  }

  /**
   * 打开设置页面
   */
  async openSettingsPage(options?: Record<string, unknown>) {
    console.log('[WindowTestPlugin] openSettingsPage 被调用，参数:', options)
    
    if (!this.api) {
      console.error('[WindowTestPlugin] API 不可用，无法创建设置窗口')
      return
    }
    
    try {
      const windowConfig = {
        title: '插件设置',
        width: 600,
        height: 400,
        html: `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>插件设置 - ${this.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; }
              .title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
              .options { padding: 15px; background: #f5f5f5; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">插件设置</div>
              <div class="options">
                <h3>设置选项:</h3>
                <pre>${JSON.stringify(options, null, 2)}</pre>
              </div>
            </div>
          </body>
          </html>
        `,
      }
      
      console.log('[WindowTestPlugin] 创建设置窗口，配置:', windowConfig)
      
      const window = await this.api?.window.createWindow(windowConfig)
      
      console.log('[WindowTestPlugin] 设置窗口已创建:', window?.id)
      return window
    } catch (error) {
      console.error('[WindowTestPlugin] 创建设置窗口失败:', error)
      throw error
    }
  }

  /**
   * 打开配置页面
   */
  async openConfigPage(options?: Record<string, unknown>) {
    console.log('[WindowTestPlugin] openConfigPage 被调用，参数:', options)
    
    if (!this.api) {
      console.error('[WindowTestPlugin] API 不可用，无法创建配置窗口')
      return
    }
    
    try {
      const windowConfig = {
        title: '插件配置',
        width: 700,
        height: 500,
        html: `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>插件配置 - ${this.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 700px; margin: 0 auto; }
              .title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
              .options { padding: 15px; background: #f5f5f5; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">插件配置</div>
              <div class="options">
                <h3>配置选项:</h3>
                <pre>${JSON.stringify(options, null, 2)}</pre>
              </div>
            </div>
          </body>
          </html>
        `,
      }
      
      console.log('[WindowTestPlugin] 创建配置窗口，配置:', windowConfig)
      
      const window = await this.api?.window.createWindow(windowConfig)
      
      console.log('[WindowTestPlugin] 配置窗口已创建:', window?.id)
      return window
    } catch (error) {
      console.error('[WindowTestPlugin] 创建配置窗口失败:', error)
      throw error
    }
  }

  /**
   * 打开帮助页面
   */
  async openHelpPage(options?: Record<string, unknown>) {
    console.log('[WindowTestPlugin] openHelpPage 被调用，参数:', options)
    
    if (!this.api) {
      console.error('[WindowTestPlugin] API 不可用，无法创建帮助窗口')
      return
    }
    
    try {
      const windowConfig = {
        title: '插件帮助',
        width: 900,
        height: 700,
        html: `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>插件帮助 - ${this.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 800px; margin: 0 auto; }
              .title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
              .options { padding: 15px; background: #f5f5f5; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">插件帮助</div>
              <div class="options">
                <h3>帮助选项:</h3>
                <pre>${JSON.stringify(options, null, 2)}</pre>
              </div>
            </div>
          </body>
          </html>
        `,
      }
      
      console.log('[WindowTestPlugin] 创建帮助窗口，配置:', windowConfig)
      
      const window = await this.api?.window.createWindow(windowConfig)
      
      console.log('[WindowTestPlugin] 帮助窗口已创建:', window?.id)
      return window
    } catch (error) {
      console.error('[WindowTestPlugin] 创建帮助窗口失败:', error)
      throw error
    }
  }

  /**
   * 打开主页面
   */
  async openMainPage(options?: Record<string, unknown>) {
    console.log('[WindowTestPlugin] openMainPage 被调用，参数:', options)
    
    if (!this.api) {
      console.error('[WindowTestPlugin] API 不可用，无法创建主窗口')
      return
    }
    
    try {
      const windowConfig = {
        title: '窗口测试插件',
        width: 700,
        height: 500,
        html: `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>窗口测试插件 - ${this.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 650px; margin: 0 auto; }
              .title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
              .options { padding: 15px; background: #f5f5f5; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">窗口测试插件主页</div>
              <div class="options">
                <h3>启动选项:</h3>
                <pre>${JSON.stringify(options, null, 2)}</pre>
              </div>
            </div>
          </body>
          </html>
        `,
      }
      
      console.log('[WindowTestPlugin] 创建主窗口，配置:', windowConfig)
      
      console.log('[WindowTestPlugin] 准备调用 createWindow API...')
      console.log('[WindowTestPlugin] API 对象存在:', this.api)
      console.log('[WindowTestPlugin] window API 存在:', this.api?.window)
      console.log('[WindowTestPlugin] createWindow 方法存在:', this.api?.window?.createWindow)
      
      const window = await this.api?.window.createWindow(windowConfig)
      
      console.log('[WindowTestPlugin] createWindow 返回结果:', window)
      console.log('[WindowTestPlugin] 主窗口已创建:', window?.id)
      return window
    } catch (error) {
      console.error('[WindowTestPlugin] 创建主窗口失败:', error)
      throw error
    }
  }

  /**
   * 显示模态窗口
   */
  async showConfirmModal(message: string, onConfirm?: () => void) {
    try {
      const result = await this.api?.window.showModal({
        title: '确认操作',
        content: message,
        buttons: [
          { label: '确认', action: 'confirm', primary: true },
          { label: '取消', action: 'cancel' },
        ],
      })
      
      if (result === 'confirm' && onConfirm) {
        onConfirm()
      }
      
      return result
      
      console.log('[WindowTestPlugin] 确认模态窗口已显示')
    } catch (error) {
      console.error('[WindowTestPlugin] 显示模态窗口失败:', error)
    }
  }

  /**
   * 导航到指定路由
   */
  async navigateToRoute(route: string, params?: Record<string, unknown>) {
    try {
      await this.api?.protocol.navigate(this.id, route, params)
      console.log('[WindowTestPlugin] 导航到路由:', route, params)
    } catch (error) {
      console.error('[WindowTestPlugin] 导航失败:', error)
    }
  }

  /**
   * 测试所有窗口功能
   */
  async testAllFeatures() {
    console.log('[WindowTestPlugin] 开始测试所有窗口功能')
    
    try {
      // 测试设置窗口
      await this.openSettingsPage({ theme: 'dark' })
      
      // 延迟后测试配置窗口
      setTimeout(async () => {
        await this.openConfigPage({ advanced: true })
      }, 1000)
      
      // 延迟后测试帮助窗口
      setTimeout(async () => {
        await this.openHelpPage({ section: 'getting-started' })
      }, 2000)
      
      // 延迟后测试模态窗口
      setTimeout(async () => {
        await this.showConfirmModal('这是一个测试确认消息')
      }, 3000)
      
      console.log('[WindowTestPlugin] 所有测试已启动')
    } catch (error) {
      console.error('[WindowTestPlugin] 测试失败:', error)
    }
  }

  /**
   * 显示演示窗口
   */
  async showDemoWindow() {
    await this.createCustomWindow('demo', { width: 600, height: 400 })
  }

  /**
   * 打开设置窗口
   */
  async openSettingsWindow() {
    await this.openSettingsPage({ theme: 'default' })
  }

  /**
   * 打开配置窗口
   */
  async openConfigWindow() {
    await this.openConfigPage({ mode: 'basic' })
  }

  /**
   * 打开帮助窗口
   */
  async openHelpWindow() {
    await this.openHelpPage({ section: 'overview' })
  }
}

// 导出插件实例创建函数
export function createPlugin() {
  return new WindowTestPlugin()
}

// 导出插件元数据
export const metadata = {
  id: 'window-test-plugin',
  name: '窗口测试插件',
  version: '1.0.0',
  description: '用于测试插件窗口管理系统的示例插件',
  author: 'Mira Launcher Team',
  type: 'app' as const,
}

// 将插件实例暴露到全局 __pluginInstances
interface WindowWithPluginInstances extends Window {
  __pluginInstances?: Record<string, unknown>
}

const windowObj = window as WindowWithPluginInstances
if (typeof windowObj.__pluginInstances === 'object') {
  const pluginInstance = new WindowTestPlugin()
  windowObj.__pluginInstances['window-test-plugin'] = pluginInstance
  console.log('[WindowTestPlugin] Exported instance to global __pluginInstances')
}
