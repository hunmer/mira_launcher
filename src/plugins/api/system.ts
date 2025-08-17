/**
 * 系统API封装
 * 提供文件和网页操作的统一接口
 */

/**
 * 网页操作API
 */
export class WebAPI {
  /**
   * 使用默认浏览器打开链接
   */
  static async openUrl(url: string): Promise<void> {
    try {
      const { open } = await import('@tauri-apps/plugin-shell')
      await open(url)
    } catch (error) {
      console.error('Failed to open URL:', error)
      throw error
    }
  }

  /**
   * 检查URL是否有效
   */
  static isValidUrl(text: string): boolean {
    try {
      new URL(text)
      return true
    } catch {
      // 检查是否为域名格式
      const domainPattern =
        /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/.*)?$/
      return domainPattern.test(text)
    }
  }

  /**
   * 标准化URL
   */
  static normalizeUrl(url: string): string {
    let normalized = url.trim()

    if (!normalized.match(/^https?:\/\//i)) {
      if (normalized.startsWith('www.') || normalized.includes('.')) {
        normalized = `https://${normalized}`
      }
    }

    return normalized
  }
}

/**
 * 文件系统操作API
 */
export class FileSystemAPI {
  /**
   * 检查文件或文件夹是否存在
   */
  static async exists(path: string): Promise<boolean> {
    try {
      const { exists } = await import('@tauri-apps/plugin-fs')
      return await exists(path)
    } catch (error) {
      console.error('Failed to check file existence:', error)
      return false
    }
  }

  /**
   * 获取文件统计信息
   */
  static async stat(path: string): Promise<FileStats | null> {
    try {
      const { stat } = await import('@tauri-apps/plugin-fs')
      const stats = await stat(path)
      return {
        isFile: stats.isFile,
        isDirectory: stats.isDirectory,
        size: stats.size || 0,
        mtime: stats.mtime ? new Date(stats.mtime) : new Date(),
        atime: stats.atime ? new Date(stats.atime) : new Date(),
      }
    } catch (error) {
      console.error('Failed to get file stats:', error)
      return null
    }
  }

  /**
   * 使用默认程序打开文件或文件夹
   */
  static async openPath(path: string): Promise<void> {
    try {
      const { open } = await import('@tauri-apps/plugin-shell')
      await open(path)
    } catch (error) {
      console.error('Failed to open path:', error)
      throw error
    }
  }

  /**
   * 在文件管理器中显示文件
   */
  static async showInExplorer(path: string): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')

      // 简化处理，默认使用跨平台方式
      await invoke('show_in_file_manager', { path })
    } catch (error) {
      console.error('Failed to show in explorer:', error)
      // 回退到直接打开文件夹
      try {
        await this.openPath(path)
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        throw error
      }
    }
  }

  /**
   * 检查路径是否为有效文件路径
   */
  static isValidPath(text: string): boolean {
    if (!text) return false

    const pathPatterns = [
      /^[A-Za-z]:[\\\/].*/, // Windows 绝对路径
      /^\/[^\/\s]*/, // Unix 绝对路径
      /^~\/.*/, // Home 目录路径
      /^\.{1,2}[\\\/].*/, // 相对路径
      /.*\.(txt|doc|docx|pdf|xls|xlsx|ppt|pptx|jpg|png|gif|mp4|mp3|exe|msi|zip|rar|7z)$/i, // 文件扩展名
    ]

    return pathPatterns.some(pattern => pattern.test(text.trim()))
  }

  /**
   * 标准化文件路径
   */
  static normalizePath(path: string): string {
    let normalized = path.trim()

    // 移除引号
    if (
      (normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith('\'') && normalized.endsWith('\''))
    ) {
      normalized = normalized.slice(1, -1)
    }

    // 简化处理，不依赖process.platform
    return normalized
  }

  /**
   * 读取目录内容
   */
  static async readDir(path: string): Promise<DirEntry[]> {
    try {
      const { readDir } = await import('@tauri-apps/plugin-fs')
      const entries = await readDir(path)
      return entries.map(entry => ({
        name: entry.name,
        path: `${path}/${entry.name}`, // 构建完整路径
        isDirectory: entry.isDirectory,
        isFile: entry.isFile,
      }))
    } catch (error) {
      console.error('Failed to read directory:', error)
      throw error
    }
  }
}

/**
 * 剪贴板操作API
 */
export class ClipboardAPI {
  /**
   * 复制文本到剪贴板
   */
  static async writeText(text: string): Promise<void> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // 回退方案
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.error('Failed to copy text to clipboard:', error)
      throw error
    }
  }

  /**
   * 从剪贴板读取文本
   */
  static async readText(): Promise<string> {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        return await navigator.clipboard.readText()
      } else {
        throw new Error('Clipboard API not available')
      }
    } catch (error) {
      console.error('Failed to read text from clipboard:', error)
      throw error
    }
  }
}

/**
 * 执行命令API
 */
export class CommandAPI {
  /**
   * 执行系统命令
   */
  static async executeCommand(
    command: string,
    args: string[] = [],
  ): Promise<string> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const result = await invoke('execute_command', {
        command,
        args,
      })
      return result as string
    } catch (error) {
      console.error('Failed to execute command:', error)
      throw error
    }
  }

  /**
   * 异步执行命令（不等待结果）
   */
  static async executeCommandAsync(
    command: string,
    args: string[] = [],
  ): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('execute_command_async', {
        command,
        args,
      })
    } catch (error) {
      console.error('Failed to execute command async:', error)
      throw error
    }
  }
}

/**
 * 通知API
 */
export class NotificationAPI {
  /**
   * 显示系统通知
   */
  static async showNotification(
    title: string,
    body: string,
    icon?: string,
  ): Promise<void> {
    try {
      if ('Notification' in window) {
        // 检查权限
        if (Notification.permission === 'granted') {
          const options: NotificationOptions = { body }
          if (icon) {
            options.icon = icon
          }
          new Notification(title, options)
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            const options: NotificationOptions = { body }
            if (icon) {
              options.icon = icon
            }
            new Notification(title, options)
          }
        }
      }
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }
}

/**
 * 文件统计信息接口
 */
export interface FileStats {
  isFile: boolean
  isDirectory: boolean
  size: number
  mtime: Date
  atime: Date
}

/**
 * 目录条目接口
 */
export interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
}

/**
 * 系统信息API
 */
export class SystemAPI {
  /**
   * 获取操作系统信息（简化版本）
   */
  static getPlatform(): string {
    // 通过用户代理字符串简单判断
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('win')) return 'win32'
    if (userAgent.includes('mac')) return 'darwin'
    if (userAgent.includes('linux')) return 'linux'
    return 'unknown'
  }

  /**
   * 检查是否为Windows系统
   */
  static isWindows(): boolean {
    return this.getPlatform() === 'win32'
  }

  /**
   * 检查是否为macOS系统
   */
  static isMacOS(): boolean {
    return this.getPlatform() === 'darwin'
  }

  /**
   * 检查是否为Linux系统
   */
  static isLinux(): boolean {
    return this.getPlatform() === 'linux'
  }
}

// 导出所有API
export const SystemAPIs = {
  Web: WebAPI,
  FileSystem: FileSystemAPI,
  Clipboard: ClipboardAPI,
  Command: CommandAPI,
  Notification: NotificationAPI,
  System: SystemAPI,
}
