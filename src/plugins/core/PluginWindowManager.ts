/**
 * 插件窗口管理器
 * 负责插件窗口的创建、管理和生命周期
 * 新版本：移除通用模板，让插件自行管理窗口内容
 */
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { LogicalSize, LogicalPosition } from '@tauri-apps/api/dpi'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import type { PluginWindow, PluginWindowOptions } from '../../../plugins/plugin-sdk'

interface PluginWindowInstance {
  id: string
  label: string
  pluginId: string
  webviewWindow: WebviewWindow
  options: PluginWindowOptions
  created: Date
}

export class PluginWindowManager {
  private windows: Map<string, PluginWindowInstance> = new Map()
  private windowCounter = 0

  constructor() {
    console.log('[PluginWindowManager] Initializing new window manager...')
  }

  /**
   * 创建基于HTML内容的窗口
   */
  async createHTMLWindow(pluginId: string, options: PluginWindowOptions & { html: string }): Promise<PluginWindow> {
    console.log(`[PluginWindowManager] createHTMLWindow called for plugin: ${pluginId}`)
    
    const windowId = `plugin-${pluginId}-${++this.windowCounter}`
    const label = `${pluginId}-${this.windowCounter}`
    
    console.log(`[PluginWindowManager] Generated window ID: ${windowId}, label: ${label}`)

    // 创建临时HTML文件URL
    const htmlBlob = new Blob([options.html], { type: 'text/html' })
    const htmlUrl = URL.createObjectURL(htmlBlob)
    
    console.log(`[PluginWindowManager] Created HTML blob URL: ${htmlUrl}`)

    try {
      console.log(`[PluginWindowManager] Creating WebviewWindow with label: ${label}`)
      const webviewWindow = new WebviewWindow(label, {
        url: htmlUrl,
        title: options.title,
        width: options.width || 800,
        height: options.height || 600,
        ...(options.x !== undefined && { x: options.x }),
        ...(options.y !== undefined && { y: options.y }),
        ...(options.minWidth !== undefined && { minWidth: options.minWidth }),
        ...(options.minHeight !== undefined && { minHeight: options.minHeight }),
        ...(options.maxWidth !== undefined && { maxWidth: options.maxWidth }),
        ...(options.maxHeight !== undefined && { maxHeight: options.maxHeight }),
        resizable: options.resizable !== false,
        center: options.center !== false,
        alwaysOnTop: options.alwaysOnTop || false,
        skipTaskbar: options.skipTaskbar || false,
        decorations: options.decorations !== false,
        transparent: options.transparent || false,
        ...(options.parent && { parent: options.parent }),
        ...(options.devTools !== undefined && { devtools: options.devTools }),
      })

      // 创建插件窗口实例
      console.log(`[PluginWindowManager] Creating plugin window instance for: ${windowId}`)
      const pluginWindow = this.createPluginWindowInstance(windowId, label, pluginId, webviewWindow, options)
      
      console.log('[PluginWindowManager] Plugin window instance created:', pluginWindow?.id)
      
      // 存储窗口实例
      this.windows.set(windowId, {
        id: windowId,
        label,
        pluginId,
        webviewWindow,
        options,
        created: new Date(),
      })

      console.log(`[PluginWindowManager] Created HTML window: ${windowId}`)
      return pluginWindow
    } catch (error) {
      URL.revokeObjectURL(htmlUrl)
      throw new Error(`Failed to create HTML window: ${error}`)
    }
  }

  /**
   * 创建基于URL的窗口
   */
  async createURLWindow(pluginId: string, options: PluginWindowOptions & { url: string }): Promise<PluginWindow> {
    const windowId = `plugin-${pluginId}-${++this.windowCounter}`
    const label = `${pluginId}-${this.windowCounter}`

    try {
      const webviewWindow = new WebviewWindow(label, {
        url: options.url,
        title: options.title,
        width: options.width || 800,
        height: options.height || 600,
        ...(options.x !== undefined && { x: options.x }),
        ...(options.y !== undefined && { y: options.y }),
        ...(options.minWidth !== undefined && { minWidth: options.minWidth }),
        ...(options.minHeight !== undefined && { minHeight: options.minHeight }),
        ...(options.maxWidth !== undefined && { maxWidth: options.maxWidth }),
        ...(options.maxHeight !== undefined && { maxHeight: options.maxHeight }),
        resizable: options.resizable !== false,
        center: options.center !== false,
        alwaysOnTop: options.alwaysOnTop || false,
        skipTaskbar: options.skipTaskbar || false,
        decorations: options.decorations !== false,
        transparent: options.transparent || false,
        ...(options.parent && { parent: options.parent }),
        ...(options.devTools !== undefined && { devtools: options.devTools }),
      })

      // 创建插件窗口实例
      const pluginWindow = this.createPluginWindowInstance(windowId, label, pluginId, webviewWindow, options)
      
      // 存储窗口实例
      this.windows.set(windowId, {
        id: windowId,
        label,
        pluginId,
        webviewWindow,
        options,
        created: new Date(),
      })

      console.log(`[PluginWindowManager] Created URL window: ${windowId}`)
      return pluginWindow
    } catch (error) {
      throw new Error(`Failed to create URL window: ${error}`)
    }
  }

  /**
   * 创建简单窗口（向后兼容）
   */
  async createWindow(pluginId: string, options: PluginWindowOptions): Promise<PluginWindow> {
    console.log(`[PluginWindowManager] createWindow called for plugin: ${pluginId}`, options)
    
    // 如果提供了HTML内容，使用HTML窗口
    if ('html' in options && typeof options.html === 'string') {
      console.log(`[PluginWindowManager] Using HTML window for plugin: ${pluginId}`)
      return this.createHTMLWindow(pluginId, options as PluginWindowOptions & { html: string })
    }

    // 如果提供了URL，使用URL窗口
    if ('url' in options && typeof options.url === 'string') {
      console.log(`[PluginWindowManager] Using URL window for plugin: ${pluginId}`)
      return this.createURLWindow(pluginId, options as PluginWindowOptions & { url: string })
    }
    return this.createHTMLWindow(pluginId, { ...options, html: '<h1>Hello world!</h1>' })
  }

  /**
   * 创建 PluginWindow 实例
   */
  private createPluginWindowInstance(windowId: string, label: string, _pluginId: string, webviewWindow: WebviewWindow, _options: PluginWindowOptions): PluginWindow {
    return {
      id: windowId,
      label,
      
      async close() {
        try {
          await webviewWindow.close()
        } catch (error) {
          console.error(`[PluginWindow] Failed to close window ${windowId}:`, error)
        }
      },

      async focus() {
        try {
          await webviewWindow.setFocus()
        } catch (error) {
          console.error(`[PluginWindow] Failed to focus window ${windowId}:`, error)
        }
      },

      async hide() {
        try {
          await webviewWindow.hide()
        } catch (error) {
          console.error(`[PluginWindow] Failed to hide window ${windowId}:`, error)
        }
      },

      async show() {
        try {
          await webviewWindow.show()
        } catch (error) {
          console.error(`[PluginWindow] Failed to show window ${windowId}:`, error)
        }
      },

      async minimize() {
        try {
          await webviewWindow.minimize()
        } catch (error) {
          console.error(`[PluginWindow] Failed to minimize window ${windowId}:`, error)
        }
      },

      async maximize() {
        try {
          await webviewWindow.maximize()
        } catch (error) {
          console.error(`[PluginWindow] Failed to maximize window ${windowId}:`, error)
        }
      },

      async unmaximize() {
        try {
          await webviewWindow.unmaximize()
        } catch (error) {
          console.error(`[PluginWindow] Failed to unmaximize window ${windowId}:`, error)
        }
      },

      async isMaximized() {
        try {
          return await webviewWindow.isMaximized()
        } catch (error) {
          console.error(`[PluginWindow] Failed to check if window ${windowId} is maximized:`, error)
          return false
        }
      },

      async isMinimized() {
        try {
          return await webviewWindow.isMinimized()
        } catch (error) {
          console.error(`[PluginWindow] Failed to check if window ${windowId} is minimized:`, error)
          return false
        }
      },

      async isVisible() {
        try {
          return await webviewWindow.isVisible()
        } catch (error) {
          console.error(`[PluginWindow] Failed to check if window ${windowId} is visible:`, error)
          return false
        }
      },

      async setTitle(title: string) {
        try {
          await webviewWindow.setTitle(title)
        } catch (error) {
          console.error(`[PluginWindow] Failed to set title for window ${windowId}:`, error)
        }
      },

      async setSize(width: number, height: number) {
        try {
          await webviewWindow.setSize(new LogicalSize(width, height))
        } catch (error) {
          console.error(`[PluginWindow] Failed to set size for window ${windowId}:`, error)
        }
      },

      async setPosition(x: number, y: number) {
        try {
          await webviewWindow.setPosition(new LogicalPosition(x, y))
        } catch (error) {
          console.error(`[PluginWindow] Failed to set position for window ${windowId}:`, error)
        }
      },

      async setAlwaysOnTop(alwaysOnTop: boolean) {
        try {
          await webviewWindow.setAlwaysOnTop(alwaysOnTop)
        } catch (error) {
          console.error(`[PluginWindow] Failed to set always on top for window ${windowId}:`, error)
        }
      },

      async setResizable(resizable: boolean) {
        try {
          await webviewWindow.setResizable(resizable)
        } catch (error) {
          console.error(`[PluginWindow] Failed to set resizable for window ${windowId}:`, error)
        }
      },

      async emit(event: string, data?: unknown) {
        try {
          await webviewWindow.emit(event, data)
        } catch (error) {
          console.error(`[PluginWindow] Failed to emit event ${event} from window ${windowId}:`, error)
        }
      },

      async listen(event: string, handler: (data?: unknown) => void) {
        try {
          return await webviewWindow.listen(event, handler)
        } catch (error) {
          console.error(`[PluginWindow] Failed to listen to event ${event} in window ${windowId}:`, error)
          return () => {}
        }
      },

      async once(event: string, handler: (data?: unknown) => void) {
        try {
          return await webviewWindow.once(event, handler)
        } catch (error) {
          console.error(`[PluginWindow] Failed to listen once to event ${event} in window ${windowId}:`, error)
          return () => {}
        }
      },
    }
  }

  /**
   * 显示模态对话框
   */
  async showModal(options: {
    title: string
    content: string
    buttons?: Array<{
      label: string
      action: 'confirm' | 'cancel' | string
      primary?: boolean
    }>
  }): Promise<string> {
    const buttons = options.buttons || [
      { label: '确定', action: 'confirm', primary: true },
      { label: '取消', action: 'cancel' },
    ]

    const modalHtml = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .modal {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            min-width: 300px;
            max-width: 500px;
            margin: 20px;
          }
          .modal-header {
            padding: 20px 20px 10px;
            border-bottom: 1px solid #eee;
          }
          .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
          }
          .modal-content {
            padding: 20px;
            color: #555;
            line-height: 1.5;
          }
          .modal-buttons {
            padding: 10px 20px 20px;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }
          .btn {
            padding: 8px 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          }
          .btn:hover {
            background: #f8f9fa;
          }
          .btn.primary {
            background: #007acc;
            color: white;
            border-color: #007acc;
          }
          .btn.primary:hover {
            background: #0056b3;
          }
        </style>
      </head>
      <body>
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">${options.title}</h3>
          </div>
          <div class="modal-content">
            ${options.content}
          </div>
          <div class="modal-buttons">
            ${buttons.map(btn => 
              `<button class="btn ${btn.primary ? 'primary' : ''}" data-action="${btn.action}">${btn.label}</button>`,
            ).join('')}
          </div>
        </div>

        <script>
          document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const action = btn.dataset.action;
              if (window.__TAURI__) {
                window.__TAURI__.event.emit('modal-result', action).then(() => {
                  window.__TAURI__.window.getCurrentWindow().close();
                });
              } else {
                window.close();
              }
            });
          });

          // ESC键关闭
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              if (window.__TAURI__) {
                window.__TAURI__.event.emit('modal-result', 'cancel').then(() => {
                  window.__TAURI__.window.getCurrentWindow().close();
                });
              } else {
                window.close();
              }
            }
          });
        </script>
      </body>
      </html>
    `

    return new Promise((resolve) => {
      this.createHTMLWindow('system', {
        title: options.title,
        html: modalHtml,
        width: 400,
        height: 300,
        center: true,
        resizable: false,
        alwaysOnTop: true,
        decorations: false,
        transparent: true,
        modal: true,
      }).then(modalWindow => {
        modalWindow.listen('modal-result', (data) => {
          resolve(data as string)
          modalWindow.close()
        })
      })
    })
  }

  /**
   * 显示文件选择对话框
   */
  async showFileDialog(options: {
    title?: string
    filters?: Array<{ name: string; extensions: string[] }>
    multiple?: boolean
    directory?: boolean
  }): Promise<string | string[] | null> {
    try {
      const result = await openDialog({
        ...(options.title && { title: options.title }),
        ...(options.filters && { filters: options.filters }),
        ...(options.multiple !== undefined && { multiple: options.multiple }),
        ...(options.directory !== undefined && { directory: options.directory }),
      })
      return result
    } catch (error) {
      console.error('[PluginWindowManager] Failed to show file dialog:', error)
      return null
    }
  }

  /**
   * 获取窗口
   */
  getWindow(id: string): PluginWindow | null {
    const windowInstance = this.windows.get(id)
    if (!windowInstance) {
      return null
    }
    
    return this.createPluginWindowInstance(
      windowInstance.id, 
      windowInstance.label, 
      windowInstance.pluginId, 
      windowInstance.webviewWindow, 
      windowInstance.options,
    )
  }

  /**
   * 获取所有窗口
   */
  getAllWindows(): PluginWindow[] {
    return Array.from(this.windows.values()).map(instance => 
      this.createPluginWindowInstance(
        instance.id, 
        instance.label, 
        instance.pluginId, 
        instance.webviewWindow, 
        instance.options,
      ),
    )
  }

  /**
   * 关闭所有窗口
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.windows.values()).map(async (instance) => {
      try {
        await instance.webviewWindow.close()
      } catch (error) {
        console.error(`[PluginWindowManager] Failed to close window ${instance.id}:`, error)
      }
    })

    await Promise.all(closePromises)
    this.windows.clear()
    console.log('[PluginWindowManager] All windows closed')
  }

  /**
   * 清理窗口实例
   */
  removeWindow(id: string): void {
    this.windows.delete(id)
  }

  /**
   * 获取插件的 WindowAPI 实现
   */
  getWindowAPI(pluginId: string) {
    return {
      createWindow: (options: PluginWindowOptions) => {
        console.log(`[PluginWindowManager] Creating window for plugin: ${pluginId}`, options)
        return this.createWindow(pluginId, options)
      },
      createHTMLWindow: (options: PluginWindowOptions & { html: string }) => this.createHTMLWindow(pluginId, options),
      createURLWindow: (options: PluginWindowOptions & { url: string }) => this.createURLWindow(pluginId, options),
      getCurrentWindow: () => null, // 插件窗口中可以通过其他方式获取
      getAllWindows: () => this.getAllWindows().filter(w => w.id.includes(pluginId)),
      getWindow: (id: string) => this.getWindow(id),
      closeAll: () => this.closeAllPluginWindows(pluginId),
      showModal: (options: Parameters<PluginWindowManager['showModal']>[0]) => this.showModal(options),
      showFileDialog: (options: Parameters<PluginWindowManager['showFileDialog']>[0]) => this.showFileDialog(options),
    }
  }

  /**
   * 关闭特定插件的所有窗口
   */
  private async closeAllPluginWindows(pluginId: string): Promise<void> {
    const pluginWindows = Array.from(this.windows.entries())
      .filter(([, instance]) => instance.pluginId === pluginId)

    const closePromises = pluginWindows.map(async ([id, instance]) => {
      try {
        await instance.webviewWindow.close()
        this.windows.delete(id)
      } catch (error) {
        console.error(`[PluginWindowManager] Failed to close plugin window ${id}:`, error)
      }
    })

    await Promise.all(closePromises)
  }
}

// 创建全局实例
export const pluginWindowManager = new PluginWindowManager()
