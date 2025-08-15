import { TestPlugin } from '../../../plugins/examples/test-plugin/index'
import { PluginTestFramework } from './PluginTestFramework'

/**
 * 运行测试插件的完整测试套件
 */
export async function runTestPluginTests(): Promise<void> {
    console.log('🧪 Starting Test Plugin Test Suite...')

    const framework = new PluginTestFramework()

    try {
        // 初始化测试环境
        await framework.initialize()

        // 创建测试插件实例
        const testPlugin = new TestPlugin()

        // 运行测试套件
        const result = await framework.runTestSuite(testPlugin)

        // 生成测试报告
        const report = framework.generateReport(result)
        console.log('\n📊 Test Report:')
        console.log(report)

        // 输出测试结果摘要
        console.log('\n📈 Test Summary:')
        console.log(`Plugin: ${result.pluginName}`)
        console.log(`Duration: ${result.endTime - result.startTime}ms`)
        console.log(`Tests: ${result.passedTests}/${result.totalTests} passed`)
        console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`)

        if (!result.success) {
            console.log('\n❌ Failed Tests:')
            result.results
                .filter(r => !r.success)
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`))
        }

    } catch (error) {
        console.error('❌ Test suite execution failed:', error)
    } finally {
        // 清理测试环境
        await framework.cleanup()
    }
}

/**
 * 验证插件系统完整功能
 */
export async function validatePluginSystem(): Promise<boolean> {
    console.log('🔍 Validating Plugin System...')

    const framework = new PluginTestFramework()
    let success = false

    try {
        await framework.initialize()

        const testPlugin = new TestPlugin()
        const result = await framework.runTestSuite(testPlugin)

        success = result.success && result.passedTests >= 10 // 至少通过10个测试

        console.log(`Validation ${success ? 'passed' : 'failed'}: ${result.passedTests}/${result.totalTests} tests passed`)

    } catch (error) {
        console.error('Validation failed:', error)
        success = false
    } finally {
        await framework.cleanup()
    }

    return success
}

/**
 * 测试真实应用数据集成
 */
export async function testRealDataIntegration(): Promise<void> {
    console.log('🔄 Testing Real Data Integration...')

    try {
        const testPlugin = new TestPlugin()

        // 模拟搜索查询测试
        console.log('Testing search functionality...')
        const searchQueries = [
            'test:example',
            'demo.test.js',
            'sample.spec.ts',
            'vscode',
            'chrome'
        ]

        for (const query of searchQueries) {
            const matches = testPlugin.search_regexps.some(pattern => {
                const regex = new RegExp(pattern, 'i')
                return regex.test(query)
            })

            console.log(`Query "${query}": ${matches ? '✅ matched' : '❌ no match'}`)
        }

        // 测试配置系统
        console.log('\nTesting configuration system...')
        const configs = testPlugin.configs
        if (configs && configs.properties) {
            Object.entries(configs.properties).forEach(([key, config]) => {
                console.log(`Config "${key}": type=${config.type}, default=${configs.defaults?.[key]}`)
            })
        }

        // 测试扩展功能
        console.log('\nTesting extended features...')
        console.log(`Context menus: ${testPlugin.contextMenus?.length || 0}`)
        console.log(`Hotkeys: ${testPlugin.hotkeys?.length || 0}`)
        console.log(`Subscriptions: ${testPlugin.subscriptions?.length || 0}`)
        console.log(`Storage config: ${testPlugin.storage ? '✅' : '❌'}`)
        console.log(`Queue config: ${testPlugin.queue ? '✅' : '❌'}`)
        console.log(`Builder function: ${typeof testPlugin.builder === 'function' ? '✅' : '❌'}`)

        console.log('✅ Real data integration test completed')

    } catch (error) {
        console.error('❌ Real data integration test failed:', error)
    }
}

/**
 * 性能基准测试
 */
export async function runPerformanceBenchmark(): Promise<void> {
    console.log('⚡ Running Performance Benchmark...')

    const iterations = 1000
    const testPlugin = new TestPlugin()

    // 测试插件创建性能
    console.log(`Creating ${iterations} plugin instances...`)
    const startCreate = Date.now()
    for (let i = 0; i < iterations; i++) {
        new TestPlugin()
    }
    const createTime = Date.now() - startCreate
    console.log(`Plugin creation: ${createTime}ms (${(createTime / iterations).toFixed(2)}ms per instance)`)

    // 测试元数据访问性能
    console.log(`Accessing metadata ${iterations} times...`)
    const startMetadata = Date.now()
    for (let i = 0; i < iterations; i++) {
        testPlugin.metadata
    }
    const metadataTime = Date.now() - startMetadata
    console.log(`Metadata access: ${metadataTime}ms (${(metadataTime / iterations).toFixed(2)}ms per access)`)

    // 测试搜索正则性能
    const queries = ['test:example', 'demo.js', 'sample.spec.ts']
    console.log(`Testing search regex ${iterations * queries.length} times...`)
    const startSearch = Date.now()
    for (let i = 0; i < iterations; i++) {
        queries.forEach(query => {
            testPlugin.search_regexps.forEach(pattern => {
                new RegExp(pattern, 'i').test(query)
            })
        })
    }
    const searchTime = Date.now() - startSearch
    console.log(`Search regex: ${searchTime}ms (${(searchTime / (iterations * queries.length)).toFixed(2)}ms per test)`)

    console.log('⚡ Performance benchmark completed')
}

// 导出主要测试函数
export { runTestPluginTests as default }
