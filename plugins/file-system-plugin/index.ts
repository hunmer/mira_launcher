import type {
  PluginBuilderFunction,
  PluginConfigDefinition,
  PluginContextMenu,
  PluginHotkey,
  PluginLogConfig,
  PluginMetadata,
  PluginNotificationConfig,
  PluginQueueConfig,
  PluginSearchEntry,
  PluginStorageConfig,
  PluginSubscription,
} from '../plugin-sdk'
import { BasePlugin } from '../plugin-sdk'

/**
 * 文件系统处理插件
 * 智能识别文件和文件夹路径并提供多种打开方式
 */
export class FileSystemPlugin extends BasePlugin {
  // 必需的抽象属性实现
  readonly id = 'com.mira.file-system-plugin'
  readonly name = '文件系统插件'
  readonly version = '1.0.0'
  readonly description = '智能识别和处理文件与文件夹路径，提供多种打开方式选项'
  readonly author = 'Mira Launcher Team'
  readonly dependencies = []
  readonly minAppVersion = '1.0.0'
  readonly permissions = ['filesystem', 'storage', 'notification', 'shell']

  // 文件路径搜索入口配置
  override readonly search_regexps: PluginSearchEntry[] = [
    {
      router: 'file',
      title: '文件系统',
      icon: 'pi pi-folder',
      tags: ['文件', '文件夹', '路径'],
      regexps: [
        '^[A-Za-z]:[\\\\\/].*',                    // Windows 绝对路径 (C:\path 或 C:/path)
        '^\/[^\/\\s]*',                           // Unix 绝对路径 (/path)
        '^~\/.*',                                 // Home 目录路径 (~/path)
        '^\\.{1,2}[\\\\\/].*',                    // 相对路径 (./path 或 ../path)
      ],
      parser: async ({ args }) => {
        // 检查是否为有效的文件路径格式
        const { query } = args
        return /^([A-Za-z]:[\\\/]|\/|~\/|\.[\\\/])/.test(query)
      },
      runner: async ({ args, api }) => {
        // 执行文件路径打开操作
        const { query } = args
        console.log('文件系统插件：打开路径', query)
        // 这里可以调用系统API打开文件或文件夹
        // 例如：api?.notification?.success('正在打开文件路径', query)
      },
    },
    {
      router: 'file-extension',
      title: '文件扩展名',
      icon: 'pi pi-file',
      tags: ['文件类型', '扩展名'],
      regexps: [
        '.*\\.(txt|doc|docx|pdf|xls|xlsx|ppt|pptx|jpg|png|gif|mp4|mp3|exe|msi|zip|rar|7z)$', // 常见文件扩展名
      ],
      parser: async ({ args }) => {
        // 检查是否以常见文件扩展名结尾
        const { query } = args
        return /\.(txt|doc|docx|pdf|xls|xlsx|ppt|pptx|jpg|png|gif|mp4|mp3|exe|msi|zip|rar|7z)$/i.test(query)
      },
      runner: async ({ args, api }) => {
        // 执行文件打开操作
        const { query } = args
        console.log('文件系统插件：打开文件', query)
        // 根据文件扩展名选择合适的应用程序打开
        // 例如：api?.notification?.info('正在打开文件', query)
      },
    },
    {
      router: 'common-folders',
      title: '常用文件夹',
      icon: 'pi pi-folder-open',
      tags: ['下载', '桌面', '文档', '图片'],
      regexps: [
        '.*[\\\\\/](?:Downloads|Desktop|Documents|Pictures|Videos|Music)[\\\\\/].*', // 常见文件夹路径
      ],
      // 这个入口没有parser，直接通过正则匹配即可
      runner: async ({ args, api }) => {
        // 执行文件夹打开操作
        const { query } = args
        console.log('文件系统插件：打开常用文件夹', query)
        // 打开系统文件管理器到指定文件夹
        // 例如：api?.notification?.success('正在打开文件夹', query)
      },
    },
  ]

  override readonly logs: PluginLogConfig = {
    level: 'info',
    maxEntries: 500,
    persist: true,
    format: 'simple',
  }

  override readonly configs: PluginConfigDefinition = {
    properties: {
      defaultOpenMethod: {
        type: 'string',
        default: 'system',
        enum: ['system', 'explorer', 'custom'],
        title: '默认打开方式',
        description: '选择文件的默认打开方式',
      },
      customFileExplorer: {
        type: 'string',
        default: '',
        title: '自定义文件管理器',
        description: '指定自定义文件管理器可执行文件路径',
      },
      customTextEditor: {
        type: 'string',
        default: '',
        title: '自定义文本编辑器',
        description: '指定默认文本编辑器路径',
      },
      enableHistory: {
        type: 'boolean',
        default: true,
        title: '启用历史记录',
        description: '保存访问的文件和文件夹历史',
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
        description: '显示文件操作状态通知',
      },
      showHiddenFiles: {
        type: 'boolean',
        default: false,
        title: '显示隐藏文件',
        description: '在浏览器中显示隐藏文件和文件夹',
      },
    },
    required: [],
    defaults: {
      defaultOpenMethod: 'system',
      customFileExplorer: '',
      customTextEditor: '',
      enableHistory: true,
      maxHistoryEntries: 100,
      enableNotifications: true,
      showHiddenFiles: false,
    },
  }

  override readonly contextMenus: PluginContextMenu[] = [
    {
      id: 'open-file-system',
      title: '系统默认打开',
      contexts: ['selection'],
      icon: 'pi pi-folder-open',
    },
    {
      id: 'open-file-explorer',
      title: '在文件管理器中显示',
      contexts: ['selection'],
      icon: 'pi pi-eye',
    },
    {
      id: 'open-with-editor',
      title: '用编辑器打开',
      contexts: ['selection'],
      icon: 'pi pi-file-edit',
    },
    {
      id: 'copy-path',
      title: '复制路径',
      contexts: ['selection'],
      icon: 'pi pi-copy',
    },
    {
      id: 'view-file-history',
      title: '查看文件历史',
      contexts: ['page'],
      icon: 'pi pi-history',
    },
  ]

  override readonly hotkeys: PluginHotkey[] = [
    {
      id: 'quick-open-file',
      combination: 'Ctrl+Shift+F',
      description: '快速打开选中的文件或文件夹',
      global: true,
      handler: () => this.quickOpenSelected(),
    },
    {
      id: 'show-in-explorer',
      combination: 'Ctrl+Shift+E',
      description: '在文件管理器中显示',
      global: true,
      handler: () => this.showInExplorer(),
    },
    {
      id: 'toggle-file-history',
      combination: 'Ctrl+Shift+H',
      description: '切换文件历史记录面板',
      global: false,
      handler: () => this.toggleFileHistoryPanel(),
    },
  ]

  override readonly subscriptions: PluginSubscription[] = [
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
    {
      event: 'file:dropped',
      handler: (data?: unknown) => this.onFileDropped(data as FileDropInfo),
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
      file_opened: {
        title: '文件已打开',
        message: '文件已成功打开',
        type: 'success',
      },
      folder_opened: {
        title: '文件夹已打开',
        message: '文件夹已在文件管理器中打开',
        type: 'success',
      },
      path_copied: {
        title: '路径已复制',
        message: '文件路径已复制到剪贴板',
        type: 'info',
      },
      file_not_found: {
        title: '文件未找到',
        message: '指定的文件或文件夹不存在',
        type: 'warning',
      },
      error: {
        title: '操作失败',
        message: '文件处理过程中发生错误',
        type: 'error',
      },
    },
  }

  override readonly storage: PluginStorageConfig = {
    type: 'localStorage',
    prefix: 'file-system-plugin',
    encrypt: false,
    sizeLimit: 2 * 1024 * 1024, // 2MB
  }

  override readonly queue: PluginQueueConfig = {
    type: 'fifo',
    config: {
      concurrency: 3,
      autostart: true,
      timeout: 15000,
      results: true,
    },
  }

  override readonly builder: PluginBuilderFunction = (options) => {
    console.log('[FileSystemPlugin] Builder executed with options:', options)
    if (options?.app) {
      this.setupAppIntegration(options.app)
    }
    return { initialized: true, timestamp: Date.now() }
  }

  // 私有状态
  private fileHistory: FileHistoryEntry[] = []
  private isRunning = false
  private currentSelection = ''
  private pluginConfig = {
    defaultOpenMethod: 'system' as 'system' | 'explorer' | 'custom',
    customFileExplorer: '',
    customTextEditor: '',
    enableHistory: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
    showHiddenFiles: false,
  }

  /**
     * 获取插件元数据
     */
  override getMetadata(): PluginMetadata {
    const baseMetadata = this.metadata
    return {
      ...baseMetadata,
      keywords: ['file', 'folder', 'path', 'explorer', 'filesystem'],
      configSchema: {
        type: 'object',
        properties: {
          defaultOpenMethod: { type: 'string', enum: ['system', 'explorer', 'custom'] },
          customFileExplorer: { type: 'string' },
          customTextEditor: { type: 'string' },
          enableHistory: { type: 'boolean' },
          maxHistoryEntries: { type: 'number', minimum: 10, maximum: 1000 },
          enableNotifications: { type: 'boolean' },
          showHiddenFiles: { type: 'boolean' },
        },
      },
    }
  }

  /**
     * 插件加载生命周期
     */
  override async onLoad(): Promise<void> {
    console.log('[FileSystemPlugin] Loading plugin...')

    // 加载配置
    await this.loadConfiguration()

    // 加载历史记录
    await this.loadHistory()

    console.log('[FileSystemPlugin] Plugin loaded successfully')
  }

  /**
     * 插件激活生命周期
     */
  override async onActivate(): Promise<void> {
    console.log('[FileSystemPlugin] Activating plugin...')

    this.isRunning = true

    // 注册命令
    this.registerCommands()

    // 发送激活通知
    if (this.pluginConfig.enableNotifications) {
      this.sendNotification('info', {
        title: '文件系统插件已激活',
        message: '智能文件路径识别功能现已可用',
        duration: 3000,
      })
    }

    console.log('[FileSystemPlugin] Plugin activated successfully')
  }

  /**
     * 插件停用生命周期
     */
  override async onDeactivate(): Promise<void> {
    console.log('[FileSystemPlugin] Deactivating plugin...')

    this.isRunning = false

    // 保存历史记录
    await this.saveHistory()

    console.log('[FileSystemPlugin] Plugin deactivated successfully')
  }

  /**
     * 插件卸载生命周期
     */
  override async onUnload(): Promise<void> {
    console.log('[FileSystemPlugin] Unloading plugin...')

    // 保存配置
    await this.saveConfiguration()

    // 清理数据
    this.fileHistory = []

    console.log('[FileSystemPlugin] Plugin unloaded successfully')
  }

  /**
     * 检测文本是否为有效文件路径
     */
  private isValidPath(text: string): boolean {
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
     * 标准化文件路径
     */
  private normalizePath(path: string): string {
    let normalized = path.trim()

    // 处理引号包围的路径
    if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
            (normalized.startsWith('\'') && normalized.endsWith('\''))) {
      normalized = normalized.slice(1, -1)
    }

    // 统一路径分隔符（Windows）
    const isWindows = navigator.userAgent.includes('Windows')
    if (isWindows) {
      normalized = normalized.replace(/\//g, '\\')
    }

    return normalized
  }

  /**
     * 检查文件或文件夹是否存在
     */
  private async pathExists(path: string): Promise<boolean> {
    try {
      const { exists } = await import('@tauri-apps/plugin-fs')
      return await exists(path)
    } catch (error) {
      this.log('error', 'Failed to check if path exists:', error)
      return false
    }
  }

  /**
     * 获取文件信息
     */
  private async getFileInfo(path: string): Promise<FileInfo | null> {
    try {
      const { stat } = await import('@tauri-apps/plugin-fs')
      const stats = await stat(path)

      return {
        path,
        name: path.split(/[\\/]/).pop() || path,
        isDirectory: stats.isDirectory,
        isFile: stats.isFile,
        size: stats.size || 0,
        modified: stats.mtime ? new Date(stats.mtime) : new Date(),
      }
    } catch (error) {
      this.log('error', 'Failed to get file info:', error)
      return null
    }
  }

  /**
     * 使用系统默认程序打开文件或文件夹
     */
  private async openWithSystem(path: string): Promise<void> {
    try {
      const { open } = await import('@tauri-apps/plugin-shell')
      await open(path)
      this.log('info', `Opened with system default: ${path}`)

      const fileInfo = await this.getFileInfo(path)
      const isDirectory = fileInfo?.isDirectory || false

      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('success', {
          title: isDirectory ? '文件夹已打开' : '文件已打开',
          message: `已使用默认程序打开${isDirectory ? '文件夹' : '文件'}`,
        })
      }
    } catch (error) {
      this.log('error', 'Failed to open with system default:', error)
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('error', {
          title: '打开失败',
          message: '无法使用默认程序打开',
        })
      }
      throw error
    }
  }

  /**
     * 在文件管理器中显示文件或文件夹
     */
  private async showInFileExplorer(path: string): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      // 根据操作系统选择合适的命令
      const userAgent = navigator.userAgent
      if (userAgent.includes('Windows')) {
        // Windows: 使用 explorer 命令
        await invoke('execute_command', {
          command: 'explorer',
          args: ['/select,', path],
        })
      } else if (userAgent.includes('Macintosh')) {
        // macOS: 使用 open 命令
        await invoke('execute_command', {
          command: 'open',
          args: ['-R', path],
        })
      } else {
        // Linux: 使用文件管理器打开父目录
        const parentDir = path.replace(/[^/\\]+$/, '')
        await invoke('execute_command', {
          command: this.pluginConfig.customFileExplorer || 'xdg-open',
          args: [parentDir],
        })
      }
      this.log('info', `Showed in file explorer: ${path}`)

      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('success', {
          title: '已在文件管理器中显示',
          message: '文件位置已在文件管理器中显示',
        })
      }
    } catch (error) {
      this.log('error', 'Failed to show in file explorer:', error)
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('error', {
          title: '显示失败',
          message: '无法在文件管理器中显示文件',
        })
      }
      throw error
    }
  }

  /**
     * 使用文本编辑器打开文件
     */
  private async openWithEditor(path: string): Promise<void> {
    if (!this.pluginConfig.customTextEditor) {
      // 回退到系统默认程序
      await this.openWithSystem(path)
      return
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('execute_command', {
        command: this.pluginConfig.customTextEditor,
        args: [path],
      })
      this.log('info', `Opened with text editor: ${path}`)

      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('success', {
          title: '文件已打开',
          message: '已使用文本编辑器打开文件',
        })
      }
    } catch (error) {
      this.log('error', 'Failed to open with text editor:', error)
      // 回退到系统默认程序
      await this.openWithSystem(path)
    }
  }

  /**
     * 根据配置打开文件或文件夹
     */
  async openPath(path: string, method?: 'system' | 'explorer' | 'custom'): Promise<void> {
    const normalizedPath = this.normalizePath(path)
    const openMethod = method || this.pluginConfig.defaultOpenMethod

    // 检查文件是否存在
    const exists = await this.pathExists(normalizedPath)
    if (!exists) {
      this.log('warn', `Path does not exist: ${normalizedPath}`)
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('warning', {
          title: '文件未找到',
          message: '指定的文件或文件夹不存在',
        })
      }
      return
    }

    try {
      switch (openMethod) {
      case 'system':
        await this.openWithSystem(normalizedPath)
        break
      case 'explorer':
        await this.showInFileExplorer(normalizedPath)
        break
      case 'custom':
        await this.openWithEditor(normalizedPath)
        break
      default:
        await this.openWithSystem(normalizedPath)
      }

      // 添加到历史记录
      if (this.pluginConfig.enableHistory) {
        await this.addToHistory(normalizedPath)
      }
    } catch (error) {
      this.log('error', 'Failed to open path:', error)
      throw error
    }
  }

  /**
     * 复制文件路径到剪贴板
     */
  private async copyPath(path: string): Promise<void> {
    try {
      // 使用浏览器 API 复制文本
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(path)
      } else {
        // 回退方案：创建临时输入框
        const textArea = document.createElement('textarea')
        textArea.value = path
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      this.log('info', `Copied path to clipboard: ${path}`)

      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('info', {
          title: '路径已复制',
          message: '文件路径已复制到剪贴板',
        })
      }
    } catch (error) {
      this.log('error', 'Failed to copy path to clipboard:', error)
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification('error', {
          title: '复制失败',
          message: '无法复制路径到剪贴板',
        })
      }
    }
  }

  /**
     * 添加文件到历史记录
     */
  private async addToHistory(path: string): Promise<void> {
    const fileInfo = await this.getFileInfo(path)
    if (!fileInfo) return

    const entry: FileHistoryEntry = {
      id: Date.now().toString(),
      path,
      name: fileInfo.name,
      isDirectory: fileInfo.isDirectory,
      size: fileInfo.size,
      accessTime: new Date(),
      accessCount: 1,
    }

    // 检查是否已存在
    const existingIndex = this.fileHistory.findIndex(item => item.path === path)
    if (existingIndex >= 0 && this.fileHistory[existingIndex]) {
      this.fileHistory[existingIndex].accessCount += 1
      this.fileHistory[existingIndex].accessTime = new Date()
    } else {
      this.fileHistory.unshift(entry)
    }

    // 限制历史记录数量
    if (this.fileHistory.length > this.pluginConfig.maxHistoryEntries) {
      this.fileHistory = this.fileHistory.slice(0, this.pluginConfig.maxHistoryEntries)
    }

    await this.saveHistory()
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
          this.pluginConfig = { ...this.pluginConfig, ...savedConfig }
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
      const storage = this.getStorage()
      if (storage && typeof storage === 'object' && 'get' in storage) {
        const savedHistory = await (storage as any).get('history')
        if (savedHistory && Array.isArray(savedHistory)) {
          this.fileHistory = savedHistory
        }
      }
    } catch (error) {
      this.log('error', 'Failed to load history:', error)
    }
  }

  /**
     * 保存历史记录
     */
  private async saveHistory(): Promise<void> {
    try {
      const storage = this.getStorage()
      if (storage && typeof storage === 'object' && 'set' in storage) {
        await (storage as any).set('history', this.fileHistory)
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
    this.registerCommand('fileSystem.openSystem', (data: any) => {
      if (data?.path) {
        this.openPath(data.path, 'system')
      } else if (this.currentSelection) {
        this.openPath(this.currentSelection, 'system')
      }
    })

    this.registerCommand('fileSystem.openExplorer', (data: any) => {
      if (data?.path) {
        this.openPath(data.path, 'explorer')
      } else if (this.currentSelection) {
        this.openPath(this.currentSelection, 'explorer')
      }
    })

    this.registerCommand('fileSystem.openEditor', (data: any) => {
      if (data?.path) {
        this.openPath(data.path, 'custom')
      } else if (this.currentSelection) {
        this.openPath(this.currentSelection, 'custom')
      }
    })

    this.registerCommand('fileSystem.copyPath', (data: any) => {
      if (data?.path) {
        this.copyPath(data.path)
      } else if (this.currentSelection) {
        this.copyPath(this.currentSelection)
      }
    })

    this.registerCommand('fileSystem.viewHistory', () => {
      this.showFileHistoryPanel()
    })
  }

  /**
     * 注册命令（简化版本）
     */
  private registerCommand(command: string, handler: (data?: any) => void): void {
    // 实际实现中会通过API注册命令
    console.log(`[FileSystemPlugin] Registered command: ${command}`)
  }

  /**
     * 快速打开选中的文件或文件夹
     */
  private quickOpenSelected(): void {
    if (this.currentSelection && this.isValidPath(this.currentSelection)) {
      this.openPath(this.currentSelection)
    } else {
      this.log('info', 'No valid file path selected')
    }
  }

  /**
     * 在文件管理器中显示选中项
     */
  private showInExplorer(): void {
    if (this.currentSelection && this.isValidPath(this.currentSelection)) {
      this.openPath(this.currentSelection, 'explorer')
    } else {
      this.log('info', 'No valid file path selected')
    }
  }

  /**
     * 切换文件历史记录面板
     */
  private toggleFileHistoryPanel(): void {
    this.log('info', 'Toggling file history panel...')
    this.showFileHistoryPanel()
  }

  /**
     * 显示文件历史记录面板
     */
  private showFileHistoryPanel(): void {
    this.log('info', 'Showing file history panel...')
    console.log('File History:', this.fileHistory)
  }

  /**
     * 事件处理器 - 搜索查询
     */
  private onSearchQuery(query: string): void {
    if (!query) return

    this.log('info', `Search query received: ${query}`)

    // 检查查询是否为有效文件路径
    if (this.isValidPath(query)) {
      this.log('info', 'Query is a valid file path')
      this.handlePathDetected(query)
    }
  }

  /**
     * 事件处理器 - 选择变化
     */
  private onSelectionChanged(selection: string): void {
    this.currentSelection = selection
    this.log('info', `Selection changed: ${selection}`)

    if (this.isValidPath(selection)) {
      this.log('info', 'Selection is a valid file path')
    }
  }

  /**
     * 事件处理器 - 文件拖放
     */
  private onFileDropped(dropInfo: FileDropInfo): void {
    this.log('info', `File dropped: ${dropInfo.path}`)
    if (dropInfo.path) {
      this.addToHistory(dropInfo.path)
    }
  }

  /**
     * 处理检测到的文件路径
     */
  private handlePathDetected(path: string): void {
    this.log('info', `File path detected: ${path}`)
    // 实际实现中可以显示文件操作UI
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
  getHistory(): FileHistoryEntry[] {
    return [...this.fileHistory]
  }

  /**
     * 清空历史记录
     */
  async clearHistory(): Promise<void> {
    this.fileHistory = []
    await this.saveHistory()
    this.log('info', 'File history cleared')
  }

  /**
     * 获取文件类型图标
     */
  getFileTypeIcon(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase()

    switch (extension) {
    case 'txt': case 'log': case 'md':
      return 'pi pi-file'
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp':
      return 'pi pi-image'
    case 'mp4': case 'avi': case 'mkv': case 'mov':
      return 'pi pi-video'
    case 'mp3': case 'wav': case 'flac': case 'aac':
      return 'pi pi-volume-up'
    case 'pdf':
      return 'pi pi-file-pdf'
    case 'doc': case 'docx':
      return 'pi pi-file-word'
    case 'xls': case 'xlsx':
      return 'pi pi-file-excel'
    case 'zip': case 'rar': case '7z':
      return 'pi pi-box'
    case 'exe': case 'msi':
      return 'pi pi-cog'
    default:
      return 'pi pi-file'
    }
  }
}

/**
 * 文件信息接口
 */
interface FileInfo {
    path: string
    name: string
    isDirectory: boolean
    isFile: boolean
    size: number
    modified: Date
}

/**
 * 文件历史记录条目接口
 */
interface FileHistoryEntry {
    id: string
    path: string
    name: string
    isDirectory: boolean
    size: number
    accessTime: Date
    accessCount: number
}

/**
 * 文件拖放信息接口
 */
interface FileDropInfo {
    path: string
    name: string
    type: string
}

// 导出插件工厂函数
export default function createFileSystemPlugin() {
  return new FileSystemPlugin()
}

// 插件元数据
export const metadata = {
  id: 'file-system-plugin',
  name: '文件系统插件',
  version: '1.0.0',
  description: '智能识别和处理文件与文件夹路径，提供多种打开方式选项',
  author: 'Mira Launcher Team',
}
