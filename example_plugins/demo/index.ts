import { BasePlugin, PluginAPI, PluginMetadata } from '@/plugins/core'
import DemoWidget from './components/DemoWidget.vue'
import DemoPage from './components/DemoPage.vue'
import DemoModal from './components/DemoModal.vue'

export default class DemoPlugin extends BasePlugin {
  private menuItemId?: string
  private shortcutRegistered = false
  private themeRegistered = false
  private storageWatcher?: () => void

  constructor(metadata: PluginMetadata, api: PluginAPI) {
    super(metadata, api)
  }

  async onActivate(): Promise<void> {
    console.log('🚀 Demo Plugin activated!')
    
    try {
      // 1. 注册菜单项
      this.registerMenuItems()
      
      // 2. 注册网格项目类型
      this.registerGridItems()
      
      // 3. 注册快捷键
      this.registerShortcuts()
      
      // 4. 注册页面
      this.registerPages()
      
      // 5. 注册主题
      this.registerTheme()
      
      // 6. 设置存储监听
      this.setupStorageWatcher()
      
      // 7. 显示激活通知
      this.api.notifications.show(
        '插件示例已激活！按 Ctrl+Shift+D 打开演示',
        'success',
        {
          duration: 5000,
          actions: [
            {
              label: '查看演示',
              action: () => this.showDemoModal()
            }
          ]
        }
      )
      
    } catch (error) {
      console.error('Demo Plugin activation failed:', error)
      this.api.notifications.show('插件示例激活失败', 'error')
      throw error
    }
  }

  async onDeactivate(): Promise<void> {
    console.log('🛑 Demo Plugin deactivated!')
    
    try {
      // 清理菜单项
      if (this.menuItemId) {
        this.api.menu.removeMenuItem(this.menuItemId)
      }

      // 清理快捷键
      if (this.shortcutRegistered) {
        this.api.shortcuts.unregisterAll()
      }

      // 清理网格项目类型
      this.api.grid.unregisterItemType('demo-widget')

      // 清理页面
      this.api.page.unregisterPage('demo-page')

      // 清理主题
      if (this.themeRegistered) {
        this.api.theme.deactivate('demo-theme')
      }

      // 清理存储监听
      if (this.storageWatcher) {
        this.storageWatcher()
      }

      this.api.notifications.show('插件示例已停用', 'info')
      
    } catch (error) {
      console.error('Demo Plugin deactivation failed:', error)
    }
  }

  private registerMenuItems() {
    this.menuItemId = this.api.menu.addMenuItem({
      id: 'demo-plugin-menu',
      label: '插件示例',
      icon: 'pi pi-star',
      submenu: [
        {
          id: 'demo-widget-action',
          label: '添加演示组件',
          icon: 'pi pi-plus',
          action: () => this.addDemoWidget()
        },
        {
          id: 'demo-page-action',
          label: '打开演示页面',
          icon: 'pi pi-window-maximize',
          action: () => this.openDemoPage()
        },
        {
          id: 'demo-theme-action',
          label: '切换演示主题',
          icon: 'pi pi-palette',
          action: () => this.toggleDemoTheme()
        },
        {
          id: 'demo-storage-action',
          label: '存储演示',
          icon: 'pi pi-database',
          action: () => this.demonstrateStorage()
        },
        {
          id: 'demo-notifications-action',
          label: '通知演示',
          icon: 'pi pi-bell',
          action: () => this.demonstrateNotifications()
        }
      ]
    })
  }

  private registerGridItems() {
    this.api.grid.registerItemType(
      'demo-widget',
      DemoWidget,
      (data) => data && typeof data.title === 'string',
      {
        title: '演示组件',
        content: '这是一个插件演示组件',
        color: '#3B82F6',
        counter: 0
      }
    )
  }

  private registerShortcuts() {
    // 主演示快捷键
    this.api.shortcuts.register('ctrl+shift+d', () => {
      this.showDemoModal()
    })

    // 快速添加组件
    this.api.shortcuts.register('ctrl+alt+w', () => {
      this.addDemoWidget()
    })

    // 通知演示
    this.api.shortcuts.register('ctrl+alt+n', () => {
      this.demonstrateNotifications()
    })

    this.shortcutRegistered = true
  }

  private registerPages() {
    this.api.page.registerPage('demo-page', DemoPage, {
      title: '插件演示页面',
      description: '展示插件系统功能的演示页面',
      icon: 'pi pi-star',
    })
  }

  private registerTheme() {
    this.api.theme.register({
      name: 'demo-theme',
      mode: 'auto',
      cssVariables: {
        'demo-primary': 'light-dark(#3B82F6, #60A5FA)',
        'demo-secondary': 'light-dark(#10B981, #34D399)',
        'demo-accent': 'light-dark(#F59E0B, #FBBF24)',
        'demo-background': 'light-dark(#FFFFFF, #1F2937)',
        'demo-surface': 'light-dark(#F9FAFB, #374151)',
        'demo-text': 'light-dark(#111827, #F9FAFB)',
        'demo-border': 'light-dark(#E5E7EB, #4B5563)',
      },
      styles: {
        '.demo-widget': `
          background: var(--demo-background);
          color: var(--demo-text);
          border: 2px solid var(--demo-border);
          border-radius: 12px;
          transition: all 0.3s ease;
        `,
        '.demo-widget:hover': `
          border-color: var(--demo-primary);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        `,
        '.demo-page': `
          background: linear-gradient(135deg, var(--demo-primary), var(--demo-secondary));
          min-height: 100vh;
        `
      }
    })
    this.themeRegistered = true
  }

  private setupStorageWatcher() {
    // 监听存储变化
    this.storageWatcher = this.api.storage.watch('demo-counter', (value) => {
      console.log('Demo counter changed:', value)
      this.api.notifications.show(
        `计数器更新为: ${value || 0}`,
        'info',
        { duration: 2000 }
      )
    })
  }

  private async addDemoWidget() {
    try {
      const counter = await this.api.storage.get('demo-widget-count') || 0
      const newCount = counter + 1
      
      await this.api.grid.addItem({
        type: 'demo-widget',
        data: {
          title: `演示组件 #${newCount}`,
          content: `这是第 ${newCount} 个演示组件`,
          color: this.getRandomColor(),
          counter: newCount
        }
      })
      
      await this.api.storage.set('demo-widget-count', newCount)
      
      this.api.notifications.show(
        `已添加演示组件 #${newCount}`,
        'success'
      )
    } catch (error) {
      console.error('Failed to add demo widget:', error)
      this.api.notifications.show('添加组件失败', 'error')
    }
  }

  private openDemoPage() {
    this.api.page.activate('demo-page')
    this.api.notifications.show('已打开演示页面', 'success')
  }

  private toggleDemoTheme() {
    if (this.api.theme.isActive('demo-theme')) {
      this.api.theme.deactivate('demo-theme')
      this.api.notifications.show('已关闭演示主题', 'info')
    } else {
      this.api.theme.activate('demo-theme')
      this.api.notifications.show('已激活演示主题', 'success')
    }
  }

  private async demonstrateStorage() {
    try {
      const currentValue = await this.api.storage.get('demo-counter') || 0
      const newValue = currentValue + 1
      
      await this.api.storage.set('demo-counter', newValue)
      
      const allData = {
        counter: newValue,
        timestamp: new Date().toISOString(),
        pluginId: this.metadata.id
      }
      
      await this.api.storage.set('demo-data', allData)
      
      this.api.notifications.show(
        `存储演示完成！计数器: ${newValue}`,
        'success',
        {
          actions: [
            {
              label: '查看数据',
              action: async () => {
                const data = await this.api.storage.get('demo-data')
                console.log('Demo storage data:', data)
                this.api.notifications.show(
                  `存储数据: ${JSON.stringify(data, null, 2)}`,
                  'info',
                  { duration: 8000 }
                )
              }
            }
          ]
        }
      )
    } catch (error) {
      console.error('Storage demonstration failed:', error)
      this.api.notifications.show('存储演示失败', 'error')
    }
  }

  private demonstrateNotifications() {
    const notifications = [
      { type: 'info', message: '这是一个信息通知' },
      { type: 'success', message: '这是一个成功通知' },
      { type: 'warning', message: '这是一个警告通知' },
      { type: 'error', message: '这是一个错误通知' }
    ] as const

    let index = 0
    const showNext = () => {
      if (index < notifications.length) {
        const notif = notifications[index]
        this.api.notifications.show(
          notif.message,
          notif.type,
          {
            duration: 3000,
            actions: index === notifications.length - 1 ? [] : [
              {
                label: '下一个',
                action: () => {
                  index++
                  setTimeout(showNext, 500)
                }
              }
            ]
          }
        )
        if (index === 0) {
          index++
          setTimeout(showNext, 3500)
        }
      }
    }

    showNext()
  }

  private showDemoModal() {
    // 这里可以触发显示模态框的逻辑
    console.log('Show demo modal')
    this.api.notifications.show(
      '演示模态框功能（开发中）',
      'info',
      {
        actions: [
          {
            label: '了解更多',
            action: () => {
              console.log('Learn more about demo plugin')
            }
          }
        ]
      }
    )
  }

  private getRandomColor(): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
      '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
      '#EC4899', '#6366F1'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // 公共方法供外部调用
  public async getPluginInfo() {
    return {
      metadata: this.metadata,
      state: this.getState(),
      statistics: {
        widgetsCreated: await this.api.storage.get('demo-widget-count') || 0,
        counterValue: await this.api.storage.get('demo-counter') || 0,
        isThemeActive: this.api.theme.isActive('demo-theme')
      }
    }
  }
}
