import { BasePlugin } from '../plugin-sdk'

/**
 * 简单测试插件 - 用于验证插件加载系统
 */
export class SimpleTestPlugin extends BasePlugin {
    readonly id = 'simple-test-plugin'
    readonly name = '简单测试插件'
    readonly version = '1.0.0'
    readonly description = '用于测试基本插件功能的简单插件'
    readonly author = 'Mira Launcher Team'
    readonly dependencies = []
    readonly minAppVersion = '1.0.0'
    readonly permissions = ['storage', 'notification']

    override async onLoad(): Promise<void> {
        this.log('info', 'Simple test plugin loaded successfully!')
    }

    override async onActivate(): Promise<void> {
        this.log('info', 'Simple test plugin activated!')

        if (this.sendNotification) {
            this.sendNotification('success', {
                title: '测试插件已激活',
                message: '简单测试插件现已正常工作'
            })
        }
    }

    override async onDeactivate(): Promise<void> {
        this.log('info', 'Simple test plugin deactivated')
    }
}

// Export the plugin
export default SimpleTestPlugin
