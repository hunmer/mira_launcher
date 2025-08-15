/**
 * 插件设置服务
 * 管理插件相关的配置设置，包括插件路径、加载选项等
 */
export interface PluginSettings {
    pluginPath: string
    autoLoadPlugins: boolean
    hotReloadEnabled: boolean
    showPluginErrors: boolean
    verifySignature: boolean
    sandboxMode: boolean
    maxPlugins?: number
    loadTimeout?: number
}

export class PluginSettingsService {
    private static readonly STORAGE_KEY = 'pluginSettings'
    private static readonly DEFAULT_SETTINGS: PluginSettings = {
        pluginPath: '',
        autoLoadPlugins: true,
        hotReloadEnabled: true,
        showPluginErrors: true,
        verifySignature: false,
        sandboxMode: false,
        maxPlugins: 50,
        loadTimeout: 10000
    }

    /**
     * 获取插件设置
     */
    static getSettings(): PluginSettings {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                return { ...this.DEFAULT_SETTINGS, ...parsed }
            }
        } catch (error) {
            console.error('Failed to load plugin settings:', error)
        }
        return { ...this.DEFAULT_SETTINGS }
    }

    /**
     * 保存插件设置
     */
    static saveSettings(settings: Partial<PluginSettings>): void {
        try {
            const current = this.getSettings()
            const updated = { ...current, ...settings }
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated))
        } catch (error) {
            console.error('Failed to save plugin settings:', error)
        }
    }

    /**
     * 获取插件目录路径列表
     */
    static getPluginDirectories(): string[] {
        const settings = this.getSettings()
        const directories: string[] = []

        // 如果用户设置了自定义路径，使用它
        if (settings.pluginPath) {
            directories.push(settings.pluginPath)
        }

        // 添加默认路径
        directories.push('plugins')

        // 添加备用路径
        if (!settings.pluginPath) {
            directories.push('extensions')
        }

        // 去重
        return [...new Set(directories)]
    }

    /**
     * 获取插件发现配置
     */
    static getDiscoveryConfig() {
        const settings = this.getSettings()
        return {
            pluginDirectories: this.getPluginDirectories(),
            recursive: true,
            maxDepth: 3,
            validate: true,
            verifySignature: settings.verifySignature
        }
    }

    /**
     * 获取插件加载配置
     */
    static getLoaderConfig() {
        const settings = this.getSettings()
        return {
            enableCache: true,
            validatePluginClass: true,
            loadTimeout: settings.loadTimeout || 10000,
            enableSandbox: settings.sandboxMode,
            hotReload: settings.hotReloadEnabled,
            allowedPermissions: [
                'storage',
                'notification',
                'menu',
                'component',
                'filesystem',
                'shell',
                'system'
            ]
        }
    }

    /**
     * 重置为默认设置
     */
    static resetToDefaults(): void {
        localStorage.removeItem(this.STORAGE_KEY)
    }

    /**
     * 检查是否启用自动加载
     */
    static isAutoLoadEnabled(): boolean {
        return this.getSettings().autoLoadPlugins
    }

    /**
     * 检查是否显示插件错误
     */
    static shouldShowErrors(): boolean {
        return this.getSettings().showPluginErrors
    }
}
