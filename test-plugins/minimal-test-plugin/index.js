/**
 * 超简单测试插件 - 不依赖任何外部导入
 */
class MinimalTestPlugin {
  constructor() {
    this.id = 'minimal-test-plugin'
    this.name = '超简单测试插件'
    this.version = '1.0.0'
    this.description = '用于测试基本插件功能的最简单插件'
    this.author = 'Mira Launcher Team'
    this.dependencies = []
    this.minAppVersion = '1.0.0'
    this.permissions = ['storage', 'notification']
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
      minAppVersion: this.minAppVersion,
    }
  }

  async onLoad() {
    console.log('[MinimalTestPlugin] Plugin loaded!')
  }

  async onActivate() {
    console.log('[MinimalTestPlugin] Plugin activated!')
  }

  async onDeactivate() {
    console.log('[MinimalTestPlugin] Plugin deactivated')
  }

  async onUnload() {
    console.log('[MinimalTestPlugin] Plugin unloaded')
  }

  getMetadata() {
    return this.metadata
  }

  // Add compatibility method for PluginManager
  _setAPI(api) {
    this.api = api
    console.log('[MinimalTestPlugin] API set:', Object.keys(api || {}))
  }
}

// Export the plugin
export default MinimalTestPlugin
export { MinimalTestPlugin }

// CommonJS 兼容性
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MinimalTestPlugin
  module.exports.MinimalTestPlugin = MinimalTestPlugin
  module.exports.default = MinimalTestPlugin
}

// 全局变量导出（用于 eval 环境）
if (typeof window !== 'undefined') {
  window.MinimalTestPlugin = MinimalTestPlugin
  window.createMinimalTestPlugin = () => new MinimalTestPlugin()
} else if (typeof global !== 'undefined') {
  global.MinimalTestPlugin = MinimalTestPlugin
  global.createMinimalTestPlugin = () => new MinimalTestPlugin()
}

