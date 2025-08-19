// 测试插件 - 用于验证 eval() 加载方式
// 由于在 eval 环境中，BasePlugin 会通过 SDK 注入，我们先检查它是否可用

function createTestEvalPlugin() {
  // 获取 BasePlugin（应该已经通过 SDK 注入）
  const BasePluginClass = (typeof window !== 'undefined' && window.BasePlugin) || 
                          (typeof global !== 'undefined' && global.BasePlugin) ||
                          class BasePlugin {
                            constructor() {
                              this.id = ''
                              this.name = ''
                              this.version = ''
                              this.description = ''
                              this.author = ''
                              this.dependencies = []
                              this.minAppVersion = '1.0.0'
                              this.permissions = []
                            }
                            async onLoad() {}
                            async onActivate() {}
                            async onDeactivate() {}
                            getMetadata() {
                              return {
                                id: this.id,
                                name: this.name,
                                version: this.version,
                                description: this.description,
                                author: this.author,
                                dependencies: this.dependencies,
                                minAppVersion: this.minAppVersion,
                                permissions: this.permissions,
                              }
                            }
                          }

  class TestEvalPlugin extends BasePluginClass {
    constructor() {
      super()
      this.id = 'com.mira.test-eval-plugin'
      this.name = '测试 Eval 插件'
      this.version = '1.0.0'
      this.description = '用于测试 eval() 加载方式的插件'
      this.author = 'Mira Launcher Team'
      this.dependencies = []
      this.minAppVersion = '1.0.0'
      this.permissions = ['storage', 'notification']
    }

    async onLoad() {
      console.log('[TestEvalPlugin] Plugin loaded via eval()')
    }

    async onActivate() {
      console.log('[TestEvalPlugin] Plugin activated')
    }

    async onDeactivate() {
      console.log('[TestEvalPlugin] Plugin deactivated')
    }

    getMetadata() {
      return {
        id: this.id,
        name: this.name,
        version: this.version,
        description: this.description,
        author: this.author,
        dependencies: this.dependencies,
        minAppVersion: this.minAppVersion,
        permissions: this.permissions,
      }
    }
  }

  return TestEvalPlugin
}

// 创建插件类
const TestEvalPlugin = createTestEvalPlugin()

// CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestEvalPlugin
  module.exports.default = TestEvalPlugin
}

// ES6 导出 (对于 eval 环境)
if (typeof window !== 'undefined') {
  window.TestEvalPlugin = TestEvalPlugin
  window.default = TestEvalPlugin
}
