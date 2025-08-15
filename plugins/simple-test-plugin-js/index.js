// Simple Test Plugin - JavaScript version for testing plugin loading
// This plugin will help us verify that the plugin system works before dealing with TypeScript compilation

class SimpleTestPlugin {
    constructor() {
        this.id = 'simple-test-plugin-js'
        this.name = '简单测试插件 JS'
        this.version = '1.0.0'
        this.description = '用于测试基本插件功能的JavaScript插件'
        this.author = 'Mira Launcher Team'
        this.dependencies = []
        this.minAppVersion = '1.0.0'
        this.permissions = ['storage', 'notification']

        // Plugin state
        this._state = {
            loaded: false,
            activated: false,
            error: null
        }
        this._api = null
    }

    get metadata() {
        return {
            id: this.id,
            name: this.name,
            version: this.version,
            description: this.description,
            author: this.author,
            dependencies: this.dependencies,
            permissions: this.permissions,
            minAppVersion: this.minAppVersion
        }
    }

    get state() {
        return { ...this._state }
    }

    initialize(api) {
        this._api = api
        this._state.loaded = true
    }

    // Add compatibility method for PluginManager
    _setAPI(api) {
        this._api = api
        console.log('[SimpleTestPlugin-JS] API set:', Object.keys(api || {}))
    }

    log(level, message, ...args) {
        if (this._api) {
            this._api.log(level, `[${this.name}] ${message}`, ...args)
        } else {
            console[level](`[${this.name}] ${message}`, ...args)
        }
    }

    sendNotification(type, options) {
        if (this._api) {
            this._api.sendNotification(type, options)
        }
    }

    async onLoad() {
        this.log('info', 'JavaScript plugin loaded successfully!')
        this._state.loaded = true
    }

    async onActivate() {
        this.log('info', 'JavaScript plugin activated!')
        this._state.activated = true

        this.sendNotification('success', {
            title: 'JS测试插件已激活',
            message: 'JavaScript测试插件现已正常工作'
        })
    }

    async onDeactivate() {
        this.log('info', 'JavaScript plugin deactivated')
        this._state.activated = false
    }

    async onUnload() {
        this.log('info', 'JavaScript plugin unloaded')
        this._state.loaded = false
    }

    getMetadata() {
        return this.metadata
    }
}

// Export the plugin
export default SimpleTestPlugin
export { SimpleTestPlugin }

