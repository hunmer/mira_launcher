/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// 从 window 变量缓存中同步访问插件SDK模块（通过eval环境可以访问）
const pluginSDK = (window as any).__moduleCache['../plugin-sdk']
const BasePlugin = pluginSDK?.BasePlugin

// 由于TypeScript接口在运行时不存在，我们只需要BasePlugin类
// 其他类型定义用any替代，在运行时会正常工作

/**
 * 网页链接处理插件
 * 智能识别URL并提供多种打开方式
 */
class WebLinkPlugin extends BasePlugin {
  // 必需的抽象属性实现
  readonly id = 'com.mira.web-link-plugin'
  readonly name = '网页链接插件'
  readonly version = '1.0.0'
  readonly description = '智能识别和处理网页链接，提供多种打开方式选项'
  readonly author = 'Mira Launcher Team'
  readonly dependencies = []
  readonly minAppVersion = '1.0.0'
  readonly permissions = ['shell', 'storage', 'notification']

  // 网页链接搜索入口配置
  readonly search_regexps: any[] = [
    {
      router: 'url',
      title: '网页链接',
      icon: 'pi pi-globe',
      tags: ['链接', '网页', 'URL'],
      regexps: [
        '^https?:\\/\\/',                    // http:// 或 https:// 开头
        '^www\\.',                          // www. 开头
      ],
      runner: async ({ args, api }) => {
        // 执行网页链接打开操作
        const { query } = args
        const url = this.normalizeUrl(query)
        console.log('网页链接插件：打开链接', url)
        // 在默认浏览器中打开链接
        // 例如：api?.notification?.info('正在打开链接', url)
      },
    },
    {
      router: 'domain',
      title: '域名',
      icon: 'pi pi-server',
      tags: ['域名', '网站'],
      regexps: [
        '.*\\.(com|org|net|edu|gov|io|cn|co\\.uk|de|fr|jp)\\b',  // 常见域名后缀
        '\\b\\w+\\.(com|org|net|edu|gov|io)\\b',  // 域名格式
      ],
      runner: async ({ args, api }) => {
        // 执行域名打开操作
        const { query } = args
        const url = this.normalizeUrl(query)
        console.log('网页链接插件：打开域名', url)
        // 在默认浏览器中打开域名
        // 例如：api?.notification?.info('正在打开域名', url)
      },
    },
    {
      router: 'localhost',
      title: '本地服务',
      icon: 'pi pi-desktop',
      tags: ['本地', '开发', '服务器'],
      regexps: [
        'localhost:\\d+',                   // localhost端口
        '\\d+\\.\\d+\\.\\d+\\.\\d+:\\d+',     // IP地址端口
      ],
      // 本地服务地址无需额外验证，直接通过正则匹配
      runner: async ({ args, api }) => {
        // 执行本地服务打开操作
        const { query } = args
        const url = this.normalizeUrl(query)
        console.log('网页链接插件：打开本地服务', url)
        // 在默认浏览器中打开本地服务
        // 例如：api?.notification?.success('正在打开本地服务', url)
      },
    },
  ]

  readonly logs: any = {
    level: 'info',
    maxEntries: 500,
    persist: true,
    format: 'simple',
  }

  readonly configs: any = {
    properties: {
      defaultOpenMethod: {
        type: 'string',
        default: 'system',
        enum: ['system', 'tauri-window', 'custom'],
        title: '默认打开方式',
        description: '选择链接的默认打开方式',
      },
      customBrowser: {
        type: 'string',
        default: '',
        title: '自定义浏览器',
        description: '指定自定义浏览器可执行文件路径',
      },
      enableHistory: {
        type: 'boolean',
        default: true,
        title: '启用历史记录',
        description: '保存访问的网页链接历史',
      },
      maxHistoryEntries: {
        type: 'number',
        default: 100,
        minimum: 10,
        maximum: 1000,
        title: '历史记录数量',
        description: '最大保存的历史记录条数',
      },
      enableNotifications: {
        type: 'boolean',
        default: true,
        title: '启用通知',
        description: '显示链接处理状态通知',
      },
    },
    required: [],
    defaults: {
      defaultOpenMethod: 'system',
      customBrowser: '',
      enableHistory: true,
      maxHistoryEntries: 100,
      enableNotifications: true,
    },
  }

  readonly contextMenus: any[] = [
    {
      id: 'open-link-system',
      title: '默认浏览器打开',
      contexts: ['selection'],
      icon: 'pi pi-external-link',
    },
    {
      id: 'open-link-tauri',
      title: '新窗口打开',
      contexts: ['selection'],
      icon: 'pi pi-window-maximize',
    },
    {
      id: 'copy-link',
      title: '复制链接',
      contexts: ['selection'],
      icon: 'pi pi-copy',
    },
    {
      id: 'view-history',
      title: '查看历史记录',
      contexts: ['page'],
      icon: 'pi pi-history',
    },
  ]

  readonly hotkeys: any[] = [
    {
      id: 'quick-open-link',
      combination: 'Ctrl+Shift+O',
      description: '快速打开选中的链接',
      global: true,
      handler: () => this.quickOpenSelectedLink(),
    },
    {
      id: 'toggle-history',
      combination: 'Ctrl+H',
      description: '切换历史记录面板',
      global: false,
      handler: () => this.toggleHistoryPanel(),
    },
  ]

  readonly subscriptions: any[] = [
    {
      event: 'search:query',
      handler: (data?: unknown) => this.onSearchQuery(data as string),
      options: { once: false },
    },
    {
      event: 'selection:changed',
      handler: (data?: unknown) => this.onSelectionChanged(data as string),
      options: { once: false },
    },
  ]

  readonly notifications: any = {
    defaults: {
      type: 'info',
      duration: 3000,
      closable: true,
    },
    templates: {
      link_opened: {
        title: '链接已打开',
        message: '网页链接已成功打开',
        type: 'success',
      },
      link_copied: {
        title: '链接已复制',
        message: '链接已复制到剪贴板',
        type: 'info',
      },
      error: {
        title: '操作失败',
        message: '链接处理过程中发生错误',
        type: 'error',
      },
    },
  }

  readonly storage: any = {
    type: 'localStorage',
    prefix: 'web-link-plugin',
    encrypt: false,
    sizeLimit: 2 * 1024 * 1024, // 2MB
  }

  readonly queue: any = {
    type: 'fifo',
    config: {
      concurrency: 2,
      autostart: true,
      timeout: 10000,
      results: true,
    },
  }

  readonly builder: any = (options) => {
    console.log('[WebLinkPlugin] Builder executed with options:', options)
    if (options?.app) {
      this.setupAppIntegration(options.app)
    }
    return { initialized: true, timestamp: Date.now() }
  }

  // 私有状态
  private linkHistory: LinkHistoryEntry[] = []
  private isRunning = false
  private currentSelection = ''
  private pluginConfig = {
    defaultOpenMethod: 'system' as 'system' | 'tauri-window' | 'custom',
    customBrowser: '',
    enableHistory: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
  }

  /**
     * 获取插件元数据
     */
  getMetadata(): any {
    const baseMetadata = this.metadata
    return {
      ...baseMetadata,
      keywords: ['web', 'link', 'url', 'browser', 'internet'],
      configSchema: {
        type: 'object',
        properties: {
          defaultOpenMethod: { type: 'string', enum: ['system', 'tauri-window', 'custom'] },
          customBrowser: { type: 'string' },
          enableHistory: { type: 'boolean' },
          maxHistoryEntries: { type: 'number', minimum: 10, maximum: 1000 },
          enableNotifications: { type: 'boolean' },
        },
      },
    }
  }

  /**
     * 插件加载生命周期
     */
  async onLoad(): Promise<void> {
    console.log('[WebLinkPlugin] Loading plugin...')

    // 加载配置
    await this.loadConfiguration()

    // 加载历史记录
    await this.loadHistory()

    console.log('[WebLinkPlugin] Plugin loaded successfully')
  }

  /**
     * 插件激活生命周期
     */
  async onActivate(): Promise<void> {
    console.log('[WebLinkPlugin] Activating plugin...')
    console.log('[WebLinkPlugin] API status:', {
      hasApi: !!this._api,
      hasAddEntry: !!(this._api && this._api.addEntry),
      apiKeys: this._api ? Object.keys(this._api) : [],
    })

    this.isRunning = true

    // 注册命令
    this.registerCommands()

    // 发送激活通知
    if (this.pluginConfig.enableNotifications) {
      this.sendNotification('info', {
        title: '网页链接插件已激活',
        message: '智能链接识别功能现已可用',
        duration: 3000,
      })
    }

    // 注册添加网址入口
    const registerAddEntry = async (retryCount = 0) => {
      try {
        if (!this._api || !this._api.addEntry) {
          if (retryCount < 3) {
            // 等待API准备好，最多重试3次
            console.log(`[WebLinkPlugin] API not ready, retrying in 100ms... (attempt ${retryCount + 1}/3)`)
            setTimeout(() => registerAddEntry(retryCount + 1), 100)
            return
          } else {
            console.warn('[WebLinkPlugin] API or addEntry not available after retries')
            return
          }
        }
        
        const addEntryAPI = this._api.addEntry
        const entryId = addEntryAPI.register({
          id: 'weblink-add-url',
          label: '添加网址',
          icon: 'pi pi-link',
          type: 'app',
          priority: 12,
          formDefaults: { category: 'productivity' },
          appType: 'web-url',
          fields: {
            url: { 
              label: '网页地址', 
              input: 'url', 
              required: true, 
              placeholder: 'https://example.com',
              validation: {
                pattern: '^https?:\\/\\/.+',
                minLength: 7,
              },
            },
          },
          exec: async ({ fields }) => {
            const raw = String(fields.url || '')
            if (!raw) return false
            const url = this.normalizeUrl(raw)
            await this.openLink(url, 'system')
            return true
          },
        })
        
        console.log(`[WebLinkPlugin] Successfully registered addEntry with ID: ${entryId}`)
      } catch (e) {
        console.warn('[WebLinkPlugin] addEntry register failed', e)
      }
    }

    await registerAddEntry()

    console.log('[WebLinkPlugin] Plugin activated successfully')
  }

  /**
     * 插件停用生命周期
     */
  async onDeactivate(): Promise<void> {
    console.log('[WebLinkPlugin] Deactivating plugin...')

    this.isRunning = false

    // 保存历史记录
    await this.saveHistory()

    console.log('[WebLinkPlugin] Plugin deactivated successfully')
  }

  /**
     * 插件卸载生命周期
     */
  async onUnload(): Promise<void> {
    console.log('[WebLinkPlugin] Unloading plugin...')

    // 保存配置
    await this.saveConfiguration()

    // 清理数据
    this.linkHistory = []

    console.log('[WebLinkPlugin] Plugin unloaded successfully')
  }

  /**
     * 检测文本是否为有效链接
     */
  private isValidLink(text: string): boolean {
    if (!text) return false

    // 检查是否匹配任何正则表达式
    return this.search_regexps.some(entry => {
      return entry.regexps.some(pattern => {
        const regex = new RegExp(pattern, 'i')
        return regex.test(text.trim())
      })
    })
  }

  /**
     * 标准化链接URL
     */
  private normalizeUrl(url: string): string {
    let normalized = url.trim()

    // 如果没有协议，添加 https://
    if (!normalized.match(/^https?:\/\//i)) {
      if (normalized.startsWith('www.') || normalized.includes('.')) {
        normalized = `https://${normalized}`
      }
    }

    return normalized
  }

  /**
     * 使用系统默认浏览器打开链接
     */
  private async openWithSystemBrowser(url: string): Promise<void> {
    try {
      const shell = await (window as any).__importModule('@tauri-apps/plugin-shell')
      await shell.open(url)
      this.log('info', `Opened link with system browser: ${url}`)

      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('success', {
          title: '链接已打开',
          message: '已使用默认浏览器打开链接',
        })
      }
    } catch (error) {
      this.log('error', 'Failed to open link with system browser:', error)
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('error', {
          title: '打开失败',
          message: '无法使用默认浏览器打开链接',
        })
      }
      throw error
    }
  }

  /**
     * 使用自定义浏览器打开链接
     */
  private async openWithCustomBrowser(url: string): Promise<void> {
    if (!this.pluginConfig.customBrowser) {
      throw new Error('Custom browser not configured')
    }

    try {
      const core = await (window as any).__importModule('@tauri-apps/api/core')
      await core.invoke('execute_command', {
        command: this.pluginConfig.customBrowser,
        args: [url],
      })
      this.log('info', `Opened link with custom browser: ${url}`)

      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('success', {
          title: '链接已打开',
          message: '已使用自定义浏览器打开链接',
        })
      }
    } catch (error) {
      this.log('error', 'Failed to open link with custom browser:', error)
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('error', {
          title: '打开失败',
          message: '无法使用自定义浏览器打开链接',
        })
      }
      throw error
    }
  }

  /**
     * 在Tauri新窗口中打开链接
     */
  private async openInTauriWindow(url: string): Promise<void> {
    try {
      const core = await (window as any).__importModule('@tauri-apps/api/core')
      await core.invoke('create_webview_window', {
        label: `web-link-${Date.now()}`,
        url,
        title: '网页浏览',
        width: 1200,
        height: 800,
        resizable: true,
      })
      this.log('info', `Opened link in Tauri window: ${url}`)

      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('success', {
          title: '链接已打开',
          message: '已在新窗口中打开链接',
        })
      }
    } catch (error) {
      this.log('error', 'Failed to open link in Tauri window:', error)
      // 回退到系统浏览器
      await this.openWithSystemBrowser(url)
    }
  }

  /**
     * 根据配置打开链接
     */
  async openLink(url: string, method?: 'system' | 'tauri-window' | 'custom'): Promise<void> {
    const normalizedUrl = this.normalizeUrl(url)
    const openMethod = method || this.pluginConfig.defaultOpenMethod

    try {
      switch (openMethod) {
      case 'system':
        await this.openWithSystemBrowser(normalizedUrl)
        break
      case 'tauri-window':
        await this.openInTauriWindow(normalizedUrl)
        break
      case 'custom':
        await this.openWithCustomBrowser(normalizedUrl)
        break
      default:
        await this.openWithSystemBrowser(normalizedUrl)
      }

      // 添加到历史记录
      if (this.pluginConfig.enableHistory) {
        await this.addToHistory(normalizedUrl)
      }
    } catch (error) {
      this.log('error', 'Failed to open link:', error)
      throw error
    }
  }

  /**
     * 复制链接到剪贴板
     */
  private async copyLink(url: string): Promise<void> {
    try {
      // 使用浏览器 API 复制文本
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        // 回退方案：创建临时输入框
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      this.log('info', `Copied link to clipboard: ${url}`)

      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('info', {
          title: '链接已复制',
          message: '链接已复制到剪贴板',
        })
      }
    } catch (error) {
      this.log('error', 'Failed to copy link to clipboard:', error)
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('error', {
          title: '复制失败',
          message: '无法复制链接到剪贴板',
        })
      }
    }
  }

  /**
     * 添加链接到历史记录
     */
  private async addToHistory(url: string): Promise<void> {
    const entry: LinkHistoryEntry = {
      id: Date.now().toString(),
      url,
      title: await this.getLinkTitle(url),
      visitTime: new Date(),
      visitCount: 1,
    }

    // 检查是否已存在
    const existingIndex = this.linkHistory.findIndex(item => item.url === url)
    if (existingIndex >= 0 && this.linkHistory[existingIndex]) {
      this.linkHistory[existingIndex].visitCount += 1
      this.linkHistory[existingIndex].visitTime = new Date()
    } else {
      this.linkHistory.unshift(entry)
    }

    // 限制历史记录数量
    if (this.linkHistory.length > this.pluginConfig.maxHistoryEntries) {
      this.linkHistory = this.linkHistory.slice(0, this.pluginConfig.maxHistoryEntries)
    }

    await this.saveHistory()
  }

  /**
     * 获取链接标题（简化实现）
     */
  private async getLinkTitle(url: string): Promise<string> {
    try {
      // 从URL中提取域名作为标题
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }

  /**
     * 加载配置
     */
  private async loadConfiguration(): Promise<void> {
    try {
      console.log('[WebLinkPlugin] Loading configuration, API status:', {
        hasApi: !!this._api,
        apiKeys: this._api ? Object.keys(this._api) : [],
        hasGetStorage: !!(this._api && this._api.getStorage),
      })
      
      if (!this._api) {
        console.warn('[WebLinkPlugin] API not available in loadConfiguration, using defaults')
        return
      }
      
      const storage = this.getStorage()
      console.log('[WebLinkPlugin] Storage object:', storage)
      
      if (storage && typeof storage === 'object' && 'get' in storage) {
        const savedConfig = await (storage as any).get('config')
        if (savedConfig) {
          this.pluginConfig = { ...this.pluginConfig, ...savedConfig }
          console.log('[WebLinkPlugin] Loaded saved config:', savedConfig)
        }
      } else {
        console.log('[WebLinkPlugin] No storage available or invalid storage interface')
      }
    } catch (error) {
      console.error('[WebLinkPlugin] Failed to load configuration:', error)
      // 不使用 this.log 避免循环错误
    }
  }

  /**
     * 保存配置
     */
  private async saveConfiguration(): Promise<void> {
    try {
      const storage = this.getStorage()
      if (storage && typeof storage === 'object' && 'set' in storage) {
        await (storage as any).set('config', this.pluginConfig)
      }
    } catch (error) {
      this.log('error', 'Failed to save configuration:', error)
    }
  }

  /**
     * 加载历史记录
     */
  private async loadHistory(): Promise<void> {
    try {
      if (!this._api) {
        console.warn('[WebLinkPlugin] API not available in loadHistory, using empty history')
        return
      }
      
      const storage = this.getStorage()
      if (storage && typeof storage === 'object' && 'get' in storage) {
        const savedHistory = await (storage as any).get('history')
        if (savedHistory && Array.isArray(savedHistory)) {
          this.linkHistory = savedHistory
          console.log('[WebLinkPlugin] Loaded history with', savedHistory.length, 'entries')
        }
      }
    } catch (error) {
      console.error('[WebLinkPlugin] Failed to load history:', error)
      // 不使用 this.log 避免循环错误
    }
  }

  /**
     * 保存历史记录
     */
  private async saveHistory(): Promise<void> {
    try {
      const storage = this.getStorage()
      if (storage && typeof storage === 'object' && 'set' in storage) {
        await (storage as any).set('history', this.linkHistory)
      }
    } catch (error) {
      this.log('error', 'Failed to save history:', error)
    }
  }

  /**
     * 注册命令
     */
  private registerCommands(): void {
    // 注册上下文菜单命令
    this.registerCommand('webLink.openSystem', (data: any) => {
      if (data?.url) {
        this.openLink(data.url, 'system')
      } else if (this.currentSelection) {
        this.openLink(this.currentSelection, 'system')
      }
    })

    this.registerCommand('webLink.openTauri', (data: any) => {
      if (data?.url) {
        this.openLink(data.url, 'tauri-window')
      } else if (this.currentSelection) {
        this.openLink(this.currentSelection, 'tauri-window')
      }
    })

    this.registerCommand('webLink.copy', (data: any) => {
      if (data?.url) {
        this.copyLink(data.url)
      } else if (this.currentSelection) {
        this.copyLink(this.currentSelection)
      }
    })

    this.registerCommand('webLink.viewHistory', () => {
      this.showHistoryPanel()
    })
  }

  /**
     * 注册命令（简化版本）
     */
  private registerCommand(command: string, handler: (data?: any) => void): void {
    // 实际实现中会通过API注册命令
    console.log(`[WebLinkPlugin] Registered command: ${command}`)
  }

  /**
     * 快速打开选中的链接
     */
  private quickOpenSelectedLink(): void {
    if (this.currentSelection && this.isValidLink(this.currentSelection)) {
      this.openLink(this.currentSelection)
    } else {
      this.log('info', 'No valid link selected')
    }
  }

  /**
     * 切换历史记录面板
     */
  private toggleHistoryPanel(): void {
    this.log('info', 'Toggling history panel...')
    // 实际实现中会切换历史记录面板显示状态
    this.showHistoryPanel()
  }

  /**
     * 显示历史记录面板
     */
  private showHistoryPanel(): void {
    this.log('info', 'Showing history panel...')
    // 实际实现中会显示历史记录UI
    console.log('Link History:', this.linkHistory)
  }

  /**
     * 事件处理器 - 搜索查询
     */
  private onSearchQuery(query: string): void {
    if (!query) return

    this.log('info', `Search query received: ${query}`)

    // 检查查询是否为有效链接
    if (this.isValidLink(query)) {
      this.log('info', 'Query is a valid link')
      // 可以在这里提供链接打开选项
      this.handleLinkDetected(query)
    }
  }

  /**
     * 事件处理器 - 选择变化
     */
  private onSelectionChanged(selection: string): void {
    this.currentSelection = selection
    this.log('info', `Selection changed: ${selection}`)

    if (this.isValidLink(selection)) {
      this.log('info', 'Selection is a valid link')
      // 可以显示链接操作选项
    }
  }

  /**
     * 处理检测到的链接
     */
  private handleLinkDetected(link: string): void {
    this.log('info', `Link detected: ${link}`)
    // 实际实现中可以显示链接操作UI
  }

  /**
     * 设置应用集成
     */
  private setupAppIntegration(app: any): void {
    this.log('info', 'Setting up app integration')
    // 与Vue应用实例集成
  }

  /**
     * 获取历史记录
     */
  getHistory(): LinkHistoryEntry[] {
    return [...this.linkHistory]
  }

  /**
     * 清空历史记录
     */
  async clearHistory(): Promise<void> {
    this.linkHistory = []
    await this.saveHistory()
    this.log('info', 'History cleared')
  }
}

/**
 * 链接历史记录条目接口
 */
interface LinkHistoryEntry {
    id: string
    url: string
    title: string
    visitTime: Date
    visitCount: number
}

// 将插件实例暴露到全局 __pluginInstances
if (typeof (window as any).__pluginInstances === 'object') {
  const pluginInstance = new WebLinkPlugin()
  ;(window as any).__pluginInstances['web-link-plugin'] = pluginInstance
  console.log('[WebLinkPlugin] Exported instance to global __pluginInstances')
}

