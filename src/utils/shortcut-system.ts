import { createShortcutManager, type ShortcutManager } from '@/plugins/api/ShortcutAPI'
import router from '@/router'
import { useSettingsStore } from '@/stores/settings'
import { openQuickSearchWindow } from '@/utils/window-manager'

/**
 * 全局快捷键系统管理器
 * 负责应用启动时的快捷键初始化和全局快捷键处理
 */
class ShortcutSystemManager {
    private shortcutManager: ShortcutManager | null = null
    private isInitialized = false

    /**
     * 初始化快捷键系统
     */
    async initialize(): Promise<void> {
        try {
            console.log('[ShortcutSystem] Initializing shortcut system...')

            // 如果已经初始化过，先清理
            if (this.isInitialized) {
                console.log('[ShortcutSystem] Cleaning up existing shortcut system...')
                await this.destroy()
            }

            // 创建快捷键管理器
            this.shortcutManager = createShortcutManager({})

            // 注册系统动作
            this.registerSystemActions()

            // 加载设置并注册快捷键
            await this.loadAndRegisterShortcuts()

            this.isInitialized = true
            console.log('[ShortcutSystem] Shortcut system initialized successfully')
        } catch (error) {
            console.error('[ShortcutSystem] Failed to initialize:', error)
            throw error
        }
    }

    /**
     * 注册系统动作
     */
    private registerSystemActions(): void {
        if (!this.shortcutManager) return

        // 注册默认系统动作
        this.shortcutManager.loadDefaultShortcuts()

        // 注册应用特定的动作
        this.shortcutManager.registerAction({
            id: 'app.toggle-window',
            name: '显示/隐藏窗口',
            description: '切换应用窗口的显示状态',
            category: 'system',
            handler: this.handleToggleWindow
        })

        this.shortcutManager.registerAction({
            id: 'app.focus-search',
            name: '聚焦搜索',
            description: '将焦点设置到搜索框',
            category: 'system',
            handler: this.handleFocusSearch
        })

        this.shortcutManager.registerAction({
            id: 'app.open-settings',
            name: '打开设置',
            description: '导航到设置页面',
            category: 'system',
            handler: this.handleOpenSettings
        })

        this.shortcutManager.registerAction({
            id: 'app.reload-plugins',
            name: '重新加载插件',
            description: '重新加载所有插件',
            category: 'system',
            handler: this.handleReloadPlugins
        })

        // 添加更多常用快捷键动作
        this.shortcutManager.registerAction({
            id: 'app.open-quick-search',
            name: '打开快速搜索',
            description: '显示快速搜索面板',
            category: 'system',
            handler: this.handleOpenQuickSearch
        })

        this.shortcutManager.registerAction({
            id: 'app.navigate-home',
            name: '首页',
            description: '导航到首页',
            category: 'system',
            handler: () => this.handleNavigate('/')
        })

        this.shortcutManager.registerAction({
            id: 'app.navigate-applications',
            name: '应用管理',
            description: '导航到应用管理页面',
            category: 'system',
            handler: () => this.handleNavigate('/applications')
        })

        this.shortcutManager.registerAction({
            id: 'app.navigate-downloads',
            name: '下载管理',
            description: '导航到下载管理页面',
            category: 'system',
            handler: () => this.handleNavigate('/downloads')
        })

        this.shortcutManager.registerAction({
            id: 'app.navigate-plugins',
            name: '插件管理',
            description: '导航到插件管理页面',
            category: 'system',
            handler: () => this.handleNavigate('/plugins')
        })

        this.shortcutManager.registerAction({
            id: 'app.navigate-plugin-store',
            name: '插件商城',
            description: '导航到插件商城页面',
            category: 'system',
            handler: () => this.handleNavigate('/plugin-store')
        })

        console.log('[ShortcutSystem] System actions registered')
    }

    /**
     * 加载设置并注册快捷键
     */
    private async loadAndRegisterShortcuts(): Promise<void> {
        if (!this.shortcutManager) return

        try {
            const settingsStore = useSettingsStore()
            await settingsStore.loadSettings()

            // 注册系统快捷键
            const systemShortcuts = settingsStore.settings.shortcuts
            await this.registerSystemShortcuts(systemShortcuts)

            // 注册自定义快捷键
            const customShortcuts = settingsStore.getEnabledCustomShortcuts()
            await this.registerCustomShortcuts(customShortcuts)

            console.log('[ShortcutSystem] Shortcuts loaded and registered')
        } catch (error) {
            console.error('[ShortcutSystem] Failed to load shortcuts:', error)
        }
    }

    /**
     * 注册系统快捷键
     */
    private async registerSystemShortcuts(shortcuts: any): Promise<void> {
        if (!this.shortcutManager) return

        const systemMappings = [
            { key: shortcuts.globalHotkey, actionId: 'app.toggle-window', type: 'global' as const },
            { key: shortcuts.searchHotkey, actionId: 'app.focus-search', type: 'application' as const },
            { key: shortcuts.quickSearchHotkey, actionId: 'app.open-quick-search', type: 'application' as const },
            { key: shortcuts.settingsHotkey, actionId: 'app.open-settings', type: 'application' as const },
            { key: shortcuts.homeHotkey, actionId: 'app.navigate-home', type: 'application' as const },
            { key: shortcuts.applicationsHotkey, actionId: 'app.navigate-applications', type: 'application' as const },
            { key: shortcuts.pluginsHotkey, actionId: 'app.navigate-plugins', type: 'application' as const },
            { key: shortcuts.exitHotkey, actionId: 'system.exit', type: 'global' as const }
        ]

        for (const mapping of systemMappings) {
            if (mapping.key) {
                try {
                    this.shortcutManager.registerShortcutWithAction(mapping.key, mapping.actionId, {
                        shortcutType: mapping.type,
                        priority: 0 // 系统快捷键最高优先级
                    })
                } catch (error) {
                    console.warn(`[ShortcutSystem] Failed to register system shortcut ${mapping.key}:`, error)
                }
            }
        }
    }

    /**
     * 注册自定义快捷键
     */
    private async registerCustomShortcuts(customShortcuts: any[]): Promise<void> {
        if (!this.shortcutManager) return

        for (const shortcut of customShortcuts) {
            try {
                this.shortcutManager.registerShortcutWithAction(shortcut.key, shortcut.actionId, {
                    shortcutType: shortcut.type,
                    priority: 1
                })
            } catch (error) {
                console.warn(`[ShortcutSystem] Failed to register custom shortcut ${shortcut.key}:`, error)
            }
        }
    }

    /**
     * 动作处理器 - 切换窗口显示
     */
    private handleToggleWindow = async (): Promise<void> => {
        try {
            if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
                const { getCurrentWindow } = await import('@tauri-apps/api/window')
                const currentWindow = getCurrentWindow()
                const isVisible = await currentWindow.isVisible()

                if (isVisible) {
                    await currentWindow.hide()
                } else {
                    await currentWindow.show()
                    await currentWindow.setFocus()
                }

                console.log('[ShortcutSystem] Window toggled')
            } else {
                console.warn('[ShortcutSystem] Toggle window not available in web environment')
            }
        } catch (error) {
            console.error('[ShortcutSystem] Failed to toggle window:', error)
        }
    }

    /**
     * 动作处理器 - 聚焦搜索
     */
    private handleFocusSearch = (): void => {
        try {
            // 尝试找到搜索输入框并聚焦
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="搜索"], .search-input') as HTMLInputElement
            if (searchInput) {
                searchInput.focus()
                searchInput.select()
                console.log('[ShortcutSystem] Search focused')
            } else {
                console.warn('[ShortcutSystem] Search input not found')
            }
        } catch (error) {
            console.error('[ShortcutSystem] Failed to focus search:', error)
        }
    }

    /**
     * 动作处理器 - 打开设置
     */
    private handleOpenSettings = (): void => {
        try {
            router.push('/settings')
            console.log('[ShortcutSystem] Navigated to settings')
        } catch (error) {
            console.error('[ShortcutSystem] Failed to open settings:', error)
        }
    }

    /**
     * 动作处理器 - 重新加载插件
     */
    private handleReloadPlugins = (): void => {
        try {
            // TODO: 实现插件重新加载逻辑
            console.log('[ShortcutSystem] Plugin reload requested (not implemented)')
        } catch (error) {
            console.error('[ShortcutSystem] Failed to reload plugins:', error)
        }
    }

    /**
     * 动作处理器 - 打开快速搜索
     */
    private handleOpenQuickSearch = async (): Promise<void> => {
        try {
            await openQuickSearchWindow()
            console.log('[ShortcutSystem] Quick search window requested')
        } catch (error) {
            console.error('[ShortcutSystem] Failed to open quick search:', error)
        }
    }

    /**
     * 动作处理器 - 导航到指定路由
     */
    private handleNavigate = (path: string): void => {
        try {
            router.push(path)
            console.log(`[ShortcutSystem] Navigated to ${path}`)
        } catch (error) {
            console.error(`[ShortcutSystem] Failed to navigate to ${path}:`, error)
        }
    }

    /**
     * 重新加载快捷键配置
     */
    async reloadShortcuts(): Promise<void> {
        if (!this.shortcutManager || !this.isInitialized) {
            console.warn('[ShortcutSystem] System not initialized')
            return
        }

        try {
            // 清除现有快捷键
            this.shortcutManager.clear()

            // 重新加载并注册
            await this.loadAndRegisterShortcuts()

            console.log('[ShortcutSystem] Shortcuts reloaded')
        } catch (error) {
            console.error('[ShortcutSystem] Failed to reload shortcuts:', error)
        }
    }

    /**
     * 获取快捷键管理器实例
     */
    getShortcutManager(): ShortcutManager | null {
        return this.shortcutManager
    }

    /**
     * 获取系统统计信息
     */
    getStats() {
        if (!this.shortcutManager) return null
        return this.shortcutManager.getStatsWithActions()
    }

    /**
     * 销毁快捷键系统
     */
    async destroy(): Promise<void> {
        if (this.shortcutManager) {
            await this.shortcutManager.destroy()
            this.shortcutManager = null
        }
        this.isInitialized = false
        console.log('[ShortcutSystem] System destroyed')
    }
}

// 创建全局实例
export const globalShortcutSystem = new ShortcutSystemManager()

/**
 * 初始化快捷键系统的便捷函数
 */
export async function initializeShortcutSystem(): Promise<void> {
    await globalShortcutSystem.initialize()
}

/**
 * 获取全局快捷键系统实例
 */
export function getShortcutSystem(): ShortcutSystemManager {
    return globalShortcutSystem
}
