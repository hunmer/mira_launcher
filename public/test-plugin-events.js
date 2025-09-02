/**
 * 插件窗口管理系统测试脚本
 * 用于测试新的事件传递机制
 */

// 模拟发送不同类型的 plugin:launch 事件
function testPluginLaunchEvents() {
  console.log('=== 开始测试插件启动事件 ===')

  // 测试设置页面启动
  setTimeout(() => {
    console.log('\n🧪 测试1: 启动设置页面')
    const settingsEvent = {
      pluginId: 'window-test-plugin',
      action: 'settings',
      route: 'general',
      params: { theme: 'dark', language: 'zh-CN' },
      windowOptions: { width: 700, height: 500 },
    }
    
    // 假设通过 PluginWindowManager 调用
    if (window.pluginWindowManager) {
      window.pluginWindowManager.handlePluginLaunch(settingsEvent)
    } else {
      console.log('PluginWindowManager 不可用，模拟调用插件方法')
      // 直接调用插件的 handleLaunchEvent 方法
      if (window.__pluginInstances?.['window-test-plugin']?.handleLaunchEvent) {
        window.__pluginInstances['window-test-plugin'].handleLaunchEvent(settingsEvent)
      }
    }
  }, 1000)

  // 测试配置页面启动
  setTimeout(() => {
    console.log('\n🧪 测试2: 启动配置页面')
    const configEvent = {
      pluginId: 'window-test-plugin',
      action: 'config',
      route: 'advanced',
      params: { mode: 'expert' },
      windowOptions: { width: 900, height: 700, resizable: true },
    }
    
    if (window.pluginWindowManager) {
      window.pluginWindowManager.handlePluginLaunch(configEvent)
    } else if (window.__pluginInstances?.['window-test-plugin']?.handleLaunchEvent) {
      window.__pluginInstances['window-test-plugin'].handleLaunchEvent(configEvent)
    }
  }, 2000)

  // 测试自定义动作
  setTimeout(() => {
    console.log('\n🧪 测试3: 启动自定义动作')
    const customEvent = {
      pluginId: 'window-test-plugin',
      action: 'data-viewer',
      route: 'charts',
      params: { dataType: 'analytics', period: '7days' },
      windowOptions: { 
        title: '数据查看器',
        width: 1200, 
        height: 800, 
        resizable: true,
        alwaysOnTop: false,
      },
    }
    
    if (window.pluginWindowManager) {
      window.pluginWindowManager.handlePluginLaunch(customEvent)
    } else if (window.__pluginInstances?.['window-test-plugin']?.handleLaunchEvent) {
      window.__pluginInstances['window-test-plugin'].handleLaunchEvent(customEvent)
    }
  }, 3000)

  // 测试帮助页面
  setTimeout(() => {
    console.log('\n🧪 测试4: 启动帮助页面')
    const helpEvent = {
      pluginId: 'window-test-plugin',
      action: 'help',
      route: 'getting-started',
      params: { section: 'basics', version: '1.0.0' },
    }
    
    if (window.pluginWindowManager) {
      window.pluginWindowManager.handlePluginLaunch(helpEvent)
    } else if (window.__pluginInstances?.['window-test-plugin']?.handleLaunchEvent) {
      window.__pluginInstances['window-test-plugin'].handleLaunchEvent(helpEvent)
    }
  }, 4000)

  // 测试功能测试
  setTimeout(() => {
    console.log('\n🧪 测试5: 运行所有功能测试')
    const testEvent = {
      pluginId: 'window-test-plugin',
      action: 'test',
      params: { runAll: true },
    }
    
    if (window.pluginWindowManager) {
      window.pluginWindowManager.handlePluginLaunch(testEvent)
    } else if (window.__pluginInstances?.['window-test-plugin']?.handleLaunchEvent) {
      window.__pluginInstances['window-test-plugin'].handleLaunchEvent(testEvent)
    }
  }, 5000)

  console.log('📋 所有测试已排队，将在5秒内依次执行')
}

// 检查插件实例状态
function checkPluginStatus() {
  console.log('\n=== 插件状态检查 ===')
  
  if (typeof window.__pluginInstances === 'object') {
    console.log('✅ __pluginInstances 可用')
    
    const testPlugin = window.__pluginInstances['window-test-plugin']
    if (testPlugin) {
      console.log('✅ window-test-plugin 实例已找到')
      console.log('   - 类型:', typeof testPlugin)
      console.log('   - 有 handleLaunchEvent 方法:', typeof testPlugin.handleLaunchEvent === 'function')
      console.log('   - 插件 ID:', testPlugin.id)
      console.log('   - 插件名称:', testPlugin.name)
    } else {
      console.log('❌ window-test-plugin 实例未找到')
    }
  } else {
    console.log('❌ __pluginInstances 不可用')
  }
  
  if (window.pluginWindowManager) {
    console.log('✅ PluginWindowManager 可用')
    console.log('   - 类型:', typeof window.pluginWindowManager)
    console.log('   - 有 handlePluginLaunch 方法:', typeof window.pluginWindowManager.handlePluginLaunch === 'function')
  } else {
    console.log('❌ PluginWindowManager 不可用')
  }
}

// 在控制台提供测试函数
window.testPluginEvents = testPluginLaunchEvents
window.checkPluginStatus = checkPluginStatus

// 自动运行状态检查
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 插件窗口管理系统测试脚本已加载')
  console.log('📝 可用的测试函数:')
  console.log('   - testPluginEvents(): 测试插件启动事件')
  console.log('   - checkPluginStatus(): 检查插件状态')
  
  // 延迟执行状态检查，确保插件已加载
  setTimeout(checkPluginStatus, 1000)
})

export { checkPluginStatus, testPluginLaunchEvents }

