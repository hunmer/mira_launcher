import type {
  PluginBuilderFunction,
  PluginConfigDefinition,
  PluginContextMenu,
  PluginHotkey,
  PluginLogConfig,
  PluginMetadata,
  PluginNotificationConfig,
  PluginQueueConfig,
  PluginStorageConfig,
  PluginSubscription,
} from '../plugin-sdk'
import { BasePlugin } from '../plugin-sdk'

/**
 * 测试插件类
 * 展示所有新功能特性的完整实现
 */
class TestPlugin extends BasePlugin {
  // 必需的抽象属性实现
  readonly id = 'com.mira.test-plugin'
  readonly name = '测试插件'
  readonly version = '1.0.0'
  readonly description = '用于测试插件系统功能的示例插件，展示所有新特性'
  readonly author = 'Mira Launcher Team'
  readonly dependencies = []
  readonly minAppVersion = '1.0.0'
  readonly permissions = ['storage', 'notification', 'system']

  override readonly search_regexps = [
    '^test:.*',           // 匹配 test: 开头的搜索
    '.*\\.(test|spec)\\.',  // 匹配测试文件
    'demo|example|sample',   // 匹配演示相关关键词
  ]

  override readonly logs: PluginLogConfig = {
    level: 'info',
    maxEntries: 1000,
    persist: true,
    format: 'simple',
  }

  override readonly configs: PluginConfigDefinition = {
    properties: {
      enableNotifications: {
        type: 'boolean',
        default: true,
        title: '启用通知',
        description: '是否显示插件通知消息',
      },
      maxItems: {
        type: 'number',
        default: 10,
        minimum: 1,
        maximum: 50,
        title: '最大项目数',
        description: '单页显示的最大项目数量',
      },
      theme: {
        type: 'string',
        default: 'auto',
        enum: ['light', 'dark', 'auto'],
        title: '主题设置',
        description: '选择插件界面主题',
      },
    },
    required: [],
    defaults: {
      enableNotifications: true,
      maxItems: 10,
      theme: 'auto',
    },
  }

  override readonly contextMenus: PluginContextMenu[] = [
    {
      id: 'test-action-1',
      title: '测试操作1',
      contexts: ['selection'],
      icon: 'pi pi-cog',
    },
    {
      id: 'test-action-2',
      title: '测试操作2',
      contexts: ['page'],
      icon: 'pi pi-play',
    },
  ]

  override readonly hotkeys: PluginHotkey[] = [
    {
      id: 'test-hotkey-1',
      combination: 'Ctrl+Shift+T',
      description: '快速测试功能',
      global: true,
      handler: () => this.runQuickTest(),
    },
    {
      id: 'test-hotkey-2',
      combination: 'Alt+T',
      description: '切换测试面板',
      global: false,
      handler: () => this.toggleTestPanel(),
    },
  ]

  override readonly subscriptions: PluginSubscription[] = [
    {
      event: 'app:startup',
      handler: () => this.onAppStartup(),
      options: { once: true },
    },
    {
      event: 'search:query',
      handler: (data?: unknown) => this.onSearchQuery(data as string),
      options: { once: false },
    },
    {
      event: 'grid:pageChanged',
      handler: (data?: unknown) => this.onPageChanged(data as number),
      options: { once: false },
    },
  ]

  override readonly notifications: PluginNotificationConfig = {
    defaults: {
      type: 'info',
      duration: 3000,
      closable: true,
    },
    templates: {
      activated: {
        title: '测试插件已激活',
        message: '插件功能现已可用',
        type: 'success',
      },
      test_completed: {
        title: '测试完成',
        message: '所有测试已执行完毕',
        type: 'info',
      },
    },
  }

  override readonly storage: PluginStorageConfig = {
    type: 'localStorage',
    prefix: 'test-plugin',
    encrypt: false,
    sizeLimit: 1024 * 1024, // 1MB
  }

  override readonly queue: PluginQueueConfig = {
    type: 'fifo',
    config: {
      concurrency: 3,
      autostart: true,
      timeout: 30000,
      results: true,
    },
  }

  override readonly builder: PluginBuilderFunction = (options) => {
    console.log('[TestPlugin] Builder executed with options:', options)
    // 构建器逻辑 - 可以用于插件的动态配置和初始化
    if (options?.api) {
      this.setupApiIntegration(options.api)
    }
    if (options?.app) {
      this.setupAppIntegration(options.app)
    }
    return { initialized: true, timestamp: Date.now() }
  }

  // 私有状态
  private testData: any[] = []
  private isRunning = false
  private testConfig = {
    enableNotifications: true,
    maxItems: 10,
    theme: 'auto',
  }

  /**
     * 获取插件元数据
     */
  override getMetadata(): PluginMetadata {
    const baseMetadata = this.metadata
    return {
      ...baseMetadata,
      keywords: ['test', 'example', 'demo'],
      configSchema: {
        type: 'object',
        properties: {
          enableNotifications: { type: 'boolean' },
          maxItems: { type: 'number', minimum: 1, maximum: 50 },
          theme: { type: 'string', enum: ['light', 'dark', 'auto'] },
        },
      },
    }
  }

  /**
     * 插件加载生命周期
     */
  override async onLoad(): Promise<void> {
    console.log('[TestPlugin] Loading plugin...')

    // 加载配置
    await this.loadConfiguration()

    // 初始化测试数据
    await this.initializeTestData()

    console.log('[TestPlugin] Plugin loaded successfully')
  }

  /**
     * 插件激活生命周期
     */
  override async onActivate(): Promise<void> {
    console.log('[TestPlugin] Activating plugin...')

    this.isRunning = true

    // 注册测试命令
    this.registerCommands()

    // 开始监控应用程序数据
    this.startDataMonitoring()

    // 发送激活通知
    if (this.testConfig.enableNotifications) {
      this.sendNotification('info', {
        title: '测试插件已激活',
        message: '插件功能现已可用',
        duration: 3000,
      })
    }

    console.log('[TestPlugin] Plugin activated successfully')
  }

  /**
     * 插件停用生命周期
     */
  override async onDeactivate(): Promise<void> {
    console.log('[TestPlugin] Deactivating plugin...')

    this.isRunning = false

    // 停止数据监控
    this.stopDataMonitoring()

    // 清理资源
    this.cleanup()

    console.log('[TestPlugin] Plugin deactivated successfully')
  }

  /**
     * 插件卸载生命周期
     */
  override async onUnload(): Promise<void> {
    console.log('[TestPlugin] Unloading plugin...')

    // 保存配置
    await this.saveConfiguration()

    // 清理所有数据
    this.testData = []

    console.log('[TestPlugin] Plugin unloaded successfully')
  }

  /**
     * 加载配置
     */
  private async loadConfiguration(): Promise<void> {
    try {
      const storage = this.getStorage()
      if (storage && typeof storage === 'object' && 'get' in storage) {
        const savedConfig = await (storage as any).get('config')
        if (savedConfig) {
          this.testConfig = { ...this.testConfig, ...savedConfig }
        }
      }
    } catch (error) {
      this.log('error', 'Failed to load configuration:', error)
    }
  }

  /**
     * 保存配置
     */
  private async saveConfiguration(): Promise<void> {
    try {
      const storage = this.getStorage()
      if (storage && typeof storage === 'object' && 'set' in storage) {
        await (storage as any).set('config', this.testConfig)
      }
    } catch (error) {
      this.log('error', 'Failed to save configuration:', error)
    }
  }

  /**
     * 初始化测试数据
     */
  private async initializeTestData(): Promise<void> {
    // 模拟从真实应用程序数据源获取数据
    this.testData = [
      {
        id: '1',
        name: 'Visual Studio Code',
        path: 'C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
        category: 'development',
        type: 'app',
        icon: 'vscode',
        description: '代码编辑器',
      },
      {
        id: '2',
        name: 'Chrome Browser',
        path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        category: 'productivity',
        type: 'app',
        icon: 'chrome',
        description: '网页浏览器',
      },
      {
        id: '3',
        name: 'Test Document',
        path: 'D:\\Projects\\test.docx',
        category: 'files',
        type: 'file',
        description: '测试文档',
      },
    ]

    this.log('info', `Initialized test data with ${this.testData.length} items`)
  }

  /**
     * 注册命令
     */
  private registerCommands(): void {
    // 注册上下文菜单命令
    this.registerCommand('testPlugin.action1', () => {
      this.log('info', 'Test Action 1 executed')
      if (this.testConfig.enableNotifications) {
        this.sendNotification('success', {
          title: '操作成功',
          message: '测试操作1已执行',
        })
      }
    })

    this.registerCommand('testPlugin.action2', () => {
      this.log('info', 'Test Action 2 executed')
      this.openTestPanel()
    })

    // 注册快捷键命令
    this.registerCommand('testPlugin.quickTest', () => {
      this.runQuickTest()
    })

    this.registerCommand('testPlugin.togglePanel', () => {
      this.toggleTestPanel()
    })
  }

  /**
     * 注册命令（简化版本）
     */
  private registerCommand(command: string, handler: () => void): void {
    // 实际实现中会通过API注册命令
    console.log(`[TestPlugin] Registered command: ${command}`)
  }

  /**
     * 开始数据监控
     */
  private startDataMonitoring(): void {
    // 模拟监控应用程序数据变化
    setInterval(() => {
      if (this.isRunning) {
        this.checkDataChanges()
      }
    }, 5000)
  }

  /**
     * 停止数据监控
     */
  private stopDataMonitoring(): void {
    // 清理监控定时器
    this.log('info', 'Data monitoring stopped')
  }

  /**
     * 检查数据变化
     */
  private checkDataChanges(): void {
    // 模拟检查应用程序数据变化
    const changeDetected = Math.random() > 0.8
    if (changeDetected) {
      this.log('info', 'Data change detected')
      if (this.testConfig.enableNotifications) {
        this.sendNotification('info', {
          title: '数据更新',
          message: '检测到应用程序数据变化',
        })
      }
    }
  }

  /**
     * 运行快速测试
     */
  private runQuickTest(): void {
    this.log('info', 'Running quick test...')

    // 模拟测试流程
    const testResults = {
      passed: Math.floor(Math.random() * 10) + 5,
      failed: Math.floor(Math.random() * 3),
      total: 0,
    }
    testResults.total = testResults.passed + testResults.failed

    this.log('info', `Test completed: ${testResults.passed}/${testResults.total} passed`)

    if (this.testConfig.enableNotifications) {
      this.sendNotification(testResults.failed === 0 ? 'success' : 'warning', {
        title: '测试完成',
        message: `${testResults.passed}/${testResults.total} 测试通过`,
      })
    }
  }

  /**
     * 打开测试面板
     */
  private openTestPanel(): void {
    this.log('info', 'Opening test panel...')
    // 实际实现中会打开UI面板
  }

  /**
     * 切换测试面板
     */
  private toggleTestPanel(): void {
    this.log('info', 'Toggling test panel...')
    // 实际实现中会切换面板显示状态
  }

  /**
     * 事件处理器 - 应用启动
     */
  private onAppStartup(): void {
    this.log('info', 'App startup event received')
    if (this.testConfig.enableNotifications) {
      this.sendNotification('info', {
        title: '测试插件',
        message: '应用程序已启动，插件监控中...',
      })
    }
  }

  /**
     * 事件处理器 - 搜索查询
     */
  private onSearchQuery(query: string): void {
    this.log('info', `Search query received: ${query}`)

    // 检查查询是否匹配插件的正则表达式
    const isMatch = this.search_regexps.some(pattern => {
      const regex = new RegExp(pattern, 'i')
      return regex.test(query)
    })

    if (isMatch) {
      this.log('info', 'Query matches plugin regex patterns')
      // 提供搜索结果
      this.handlePluginSearch(query)
    }
  }

  /**
     * 事件处理器 - 页面变化
     */
  private onPageChanged(pageIndex: number): void {
    this.log('info', `Page changed to: ${pageIndex}`)
  }

  /**
     * 处理插件搜索
     */
  private handlePluginSearch(query: string): void {
    // 根据查询返回相关的测试数据
    const results = this.testData.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase()),
    ).slice(0, this.testConfig.maxItems)

    this.log('info', `Plugin search returned ${results.length} results`)
  }

  /**
     * 设置API集成
     */
  private setupApiIntegration(api: any): void {
    this.log('info', 'Setting up API integration')
    // 与主应用API集成
  }

  /**
     * 设置应用集成
     */
  private setupAppIntegration(app: any): void {
    this.log('info', 'Setting up app integration')
    // 与Vue应用实例集成
  }

  /**
     * 清理资源
     */
  private cleanup(): void {
    this.log('info', 'Cleaning up plugin resources')
    // 清理定时器、事件监听器等资源
  }
}

// 导出插件工厂函数
function createTestPlugin() {
  return new TestPlugin()
}

// 插件元数据
const metadata = {
  id: 'test-plugin',
  name: '测试插件',
  version: '1.0.0',
  description: '用于测试插件系统功能的示例插件',
  author: 'Mira Launcher Team',
}

// CommonJS 兼容性
if (typeof module !== 'undefined' && module.exports) {
  (module as any).exports = createTestPlugin
  ;(module as any).exports.TestPlugin = TestPlugin
  ;(module as any).exports.metadata = metadata
  ;(module as any).exports.default = createTestPlugin
}

// 全局变量导出（用于 eval 环境）
if (typeof window !== 'undefined') {
  (window as any).TestPlugin = TestPlugin
  ;(window as any).createTestPlugin = createTestPlugin
  ;(window as any).testPluginMetadata = metadata
  
  // 将插件实例暴露到全局 __pluginInstances
  if (typeof (window as any).__pluginInstances === 'object') {
    const pluginInstance = createTestPlugin()
    ;(window as any).__pluginInstances['test-plugin'] = pluginInstance
    console.log('[TestPlugin] Exported instance to global __pluginInstances')
  }
} else if (typeof global !== 'undefined') {
  (global as any).TestPlugin = TestPlugin
  ;(global as any).createTestPlugin = createTestPlugin
  ;(global as any).testPluginMetadata = metadata
}
