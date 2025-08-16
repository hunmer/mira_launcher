/**
 * 键盘快捷键工具
 * 处理键盘事件和快捷键
 */
class KeyboardManager {
  constructor() {
    this.listeners = new Map()
    this.globalListeners = []
    this.isEnabled = true
  }

  /**
     * 绑定键盘事件
     */
  bind(element = document) {
    element.addEventListener('keydown', this.handleKeyDown.bind(this))
    element.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  /**
     * 处理键盘按下事件
     */
  handleKeyDown(event) {
    if (!this.isEnabled) return

    const key = this.normalizeKey(event)
    const keyCombo = this.getKeyCombo(event)

    // 触发具体按键监听器
    this.emit(key, event)

    // 触发组合键监听器
    if (keyCombo !== key) {
      this.emit(keyCombo, event)
    }

    // 触发全局监听器
    this.globalListeners.forEach(listener => {
      try {
        listener(event, key, keyCombo)
      } catch (error) {
        console.error('[键盘管理器] 全局监听器执行失败:', error)
      }
    })
  }

  /**
     * 处理键盘释放事件
     */
  handleKeyUp(event) {
    if (!this.isEnabled) return

    const key = this.normalizeKey(event)
    this.emit(`${key}:up`, event)
  }

  /**
     * 标准化按键名称
     */
  normalizeKey(event) {
    // 特殊键映射
    const specialKeys = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'Enter': 'enter',
      'Escape': 'escape',
      'Tab': 'tab',
      'Backspace': 'backspace',
      'Delete': 'delete',
      'Home': 'home',
      'End': 'end',
      'PageUp': 'pageup',
      'PageDown': 'pagedown',
      ' ': 'space',
    }

    return specialKeys[event.key] || event.key.toLowerCase()
  }

  /**
     * 获取组合键
     */
  getKeyCombo(event) {
    const modifiers = []
    const key = this.normalizeKey(event)

    if (event.ctrlKey) modifiers.push('ctrl')
    if (event.altKey) modifiers.push('alt')
    if (event.shiftKey) modifiers.push('shift')
    if (event.metaKey) modifiers.push('meta')

    if (modifiers.length > 0) {
      return `${modifiers.join('+')}+${key}`
    }

    return key
  }

  /**
     * 监听按键事件
     */
  on(keys, callback) {
    if (typeof keys === 'string') {
      keys = [keys]
    }

    keys.forEach(key => {
      if (!this.listeners.has(key)) {
        this.listeners.set(key, [])
      }
      this.listeners.get(key).push(callback)
    })

    // 返回取消监听的函数
    return () => {
      keys.forEach(key => {
        const callbacks = this.listeners.get(key)
        if (callbacks) {
          const index = callbacks.indexOf(callback)
          if (index > -1) {
            callbacks.splice(index, 1)
          }
        }
      })
    }
  }

  /**
     * 监听所有按键事件
     */
  onAny(callback) {
    this.globalListeners.push(callback)

    // 返回取消监听的函数
    return () => {
      const index = this.globalListeners.indexOf(callback)
      if (index > -1) {
        this.globalListeners.splice(index, 1)
      }
    }
  }

  /**
     * 取消监听
     */
  off(key, callback) {
    const callbacks = this.listeners.get(key)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
     * 触发事件
     */
  emit(key, event) {
    const callbacks = this.listeners.get(key)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event, key)
        } catch (error) {
          console.error(`[键盘管理器] 按键回调执行失败 (${key}):`, error)
        }
      })
    }
  }

  /**
     * 启用键盘事件处理
     */
  enable() {
    this.isEnabled = true
  }

  /**
     * 禁用键盘事件处理
     */
  disable() {
    this.isEnabled = false
  }

  /**
     * 预定义的快捷键处理器
     */
  static createNavigationHandler(options = {}) {
    const {
      onUp = () => { },
      onDown = () => { },
      onEnter = () => { },
      onEscape = () => { },
      onTab = () => { },
      onPageUp = () => { },
      onPageDown = () => { },
      onHome = () => { },
      onEnd = () => { },
    } = options

    return {
      'up': (event) => {
        event.preventDefault()
        onUp(event)
      },
      'down': (event) => {
        event.preventDefault()
        onDown(event)
      },
      'enter': (event) => {
        event.preventDefault()
        onEnter(event)
      },
      'escape': (event) => {
        event.preventDefault()
        onEscape(event)
      },
      'tab': (event) => {
        event.preventDefault()
        onTab(event)
      },
      'pageup': (event) => {
        event.preventDefault()
        onPageUp(event)
      },
      'pagedown': (event) => {
        event.preventDefault()
        onPageDown(event)
      },
      'home': (event) => {
        event.preventDefault()
        onHome(event)
      },
      'end': (event) => {
        event.preventDefault()
        onEnd(event)
      },
    }
  }

  /**
     * 快捷键帮助信息
     */
  static getHelpInfo() {
    return {
      navigation: [
        { key: '↑/↓', description: '选择上一个/下一个结果' },
        { key: 'Enter', description: '执行选中的结果' },
        { key: 'Esc', description: '清除搜索或关闭窗口' },
        { key: 'Tab', description: '切换搜索模式' },
        { key: 'Page Up/Down', description: '快速导航' },
        { key: 'Home/End', description: '跳到第一个/最后一个结果' },
      ],
      editing: [
        { key: 'Ctrl+A', description: '全选文本' },
        { key: 'Ctrl+C', description: '复制' },
        { key: 'Ctrl+V', description: '粘贴' },
        { key: 'Ctrl+Z', description: '撤销' },
      ],
      application: [
        { key: 'Ctrl+,', description: '打开设置' },
        { key: 'Ctrl+R', description: '刷新数据' },
        { key: 'F1', description: '显示帮助' },
      ],
    }
  }
}

// 导出工具类
if (typeof window !== 'undefined') {
  window.KeyboardManager = KeyboardManager
}
