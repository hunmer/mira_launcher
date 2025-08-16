/**
 * Vue 通信适配器类
 * 简化版本，用于新的 Vue 应用程序
 */
class VueCommunicationAdapter {
  constructor() {
    this.isInitialized = false
    this.environment = 'unknown'
    this.searchData = []
  }

  async initialize() {
    try {
      // 检测环境
      this.environment = this.detectEnvironment()

      if (this.environment === 'tauri') {
        await this.initializeTauri()
      } else {
        await this.initializeWeb()
      }

      this.isInitialized = true
      console.log(`[通信适配器] 已初始化 (${this.environment})`)
    } catch (error) {
      console.error('[通信适配器] 初始化失败:', error)
      this.loadFallbackData()
    }
  }

  detectEnvironment() {
    if (typeof window !== 'undefined' && window.__TAURI__) {
      return 'tauri'
    }
    return 'web'
  }

  async initializeTauri() {
    if (!window.__TAURI__) {
      throw new Error('Tauri API not available')
    }

    const { event, webviewWindow } = window.__TAURI__
    const currentWindow = webviewWindow.getCurrentWebviewWindow()

    // 监听搜索数据更新
    await currentWindow.listen('search-data-updated', (eventData) => {
      this.searchData = eventData.payload || []
      console.log('[Tauri] 搜索数据已更新:', this.searchData.length, '项')
    })

    // 请求搜索数据
    await event.emit('request-search-data', {})
    console.log('[Tauri] 已请求搜索数据')
  }

  async initializeWeb() {
    // 监听来自父窗口的消息
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'search-data-updated') {
        this.searchData = event.data.payload || []
        console.log('[Web] 搜索数据已更新:', this.searchData.length, '项')
      }
    })

    // 请求搜索数据
    this.requestSearchDataWeb()
    console.log('[Web] 已请求搜索数据')
  }

  requestSearchDataWeb() {
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'request-search-data' }, '*')
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'request-search-data' }, '*')
      } else {
        document.dispatchEvent(new CustomEvent('request-search-data'))
      }
    } catch (error) {
      console.error('[Web] 请求搜索数据失败:', error)
    }
  }

  loadFallbackData() {
    this.searchData = [
      {
        type: 'system',
        title: 'Visual Studio Code',
        description: '代码编辑器',
        icon: 'pi pi-code',
        path: 'code.exe',
        category: '应用程序',
      },
      {
        type: 'system',
        title: '设置',
        description: '应用程序设置',
        icon: 'pi pi-cog',
        action: 'open-settings',
        category: '系统功能',
      },
    ]
    console.log('[通信适配器] 已加载降级数据')
  }

  async getSearchData() {
    // 等待初始化完成
    if (!this.isInitialized) {
      await new Promise(resolve => {
        const checkInit = () => {
          if (this.isInitialized || this.searchData.length > 0) {
            resolve()
          } else {
            setTimeout(checkInit, 100)
          }
        }
        checkInit()

        // 5秒超时
        setTimeout(() => {
          if (!this.isInitialized) {
            this.loadFallbackData()
            resolve()
          }
        }, 5000)
      })
    }

    return this.searchData
  }

  async executeItem(item) {
    try {
      if (this.environment === 'tauri') {
        await this.executeItemTauri(item)
      } else {
        await this.executeItemWeb(item)
      }
      console.log('[通信适配器] 已执行项目:', item)
    } catch (error) {
      console.error('[通信适配器] 执行项目失败:', error)
    }
  }

  async executeItemTauri(item) {
    const { event } = window.__TAURI__
    await event.emit('quick-search-result-selected', item)
  }

  async executeItemWeb(item) {
    const message = {
      type: 'quick-search-result-selected',
      data: item,
    }

    if (window.opener) {
      window.opener.postMessage(message, '*')
    } else if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*')
    } else {
      document.dispatchEvent(
        new CustomEvent('quick-search-result-selected', {
          detail: item,
        }),
      )
    }
  }

  getConnectionStatus() {
    return {
      isInitialized: this.isInitialized,
      environment: this.environment,
      dataCount: this.searchData.length,
      status: this.isInitialized ? 'connected' : 'disconnected',
    }
  }
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.VueCommunicationAdapter = VueCommunicationAdapter
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VueCommunicationAdapter
}
