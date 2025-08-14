/**
 * 任务调度器和并发控制器测试示例
 * 用于验证 TaskScheduler 和 ConcurrencyController 的实现
 */

import {
    ConcurrencyController,
    TaskScheduler,
    type Task
} from '@/plugins/core'
import type {
    SchedulerConfig
} from './TaskScheduler'

/**
 * 创建测试任务
 */
function createTestTask(id: string, priority: number = 5, duration: number = 1000): Task {
    return {
        id,
        priority,
        execute: async () => {
            console.log(`开始执行任务 ${id} (优先级: ${priority})`)
            await new Promise(resolve => setTimeout(resolve, duration))
            return `任务 ${id} 执行完成`
        },
        onSuccess: (result) => {
            console.log(`✅ 任务 ${id} 成功:`, result)
        },
        onError: (error) => {
            console.error(`❌ 任务 ${id} 失败:`, error)
        },
        metadata: {
            category: 'test',
            duration
        }
    }
}

/**
 * 创建会失败的测试任务
 */
function createFailingTask(id: string, errorMessage: string = '模拟错误'): Task {
    return {
        id,
        priority: 3,
        execute: async () => {
            console.log(`开始执行失败任务 ${id}`)
            await new Promise(resolve => setTimeout(resolve, 500))
            throw new Error(errorMessage)
        },
        onError: (error) => {
            console.error(`❌ 任务 ${id} 预期失败:`, error.message)
        }
    }
}

/**
 * 测试串行执行模式
 */
export async function testSerialMode() {
    console.log('\n=== 测试串行执行模式 ===')

    const config: Partial<SchedulerConfig> = {
        mode: 'serial',
        maxConcurrency: 1,
        rateLimit: {
            windowMs: 10000,
            maxTasks: 50
        },
        enableCancellation: true
    }

    const scheduler = new TaskScheduler('test-serial', config)
    await scheduler.start()

    // 添加多个任务，应该按顺序执行
    const tasks = [
        createTestTask('serial-1', 1, 800),
        createTestTask('serial-2', 5, 600),
        createTestTask('serial-3', 10, 400)
    ]

    const startTime = Date.now()
    const taskIds = []

    for (const task of tasks) {
        const taskId = await scheduler.scheduleTask(task)
        taskIds.push(taskId)
    }

    // 等待所有任务完成
    await new Promise(resolve => setTimeout(resolve, 3000))

    const endTime = Date.now()
    console.log(`串行执行总耗时: ${endTime - startTime}ms`)
    console.log('调度器统计:', scheduler.getStats())

    await scheduler.destroy()
}

/**
 * 测试并行执行模式
 */
export async function testParallelMode() {
    console.log('\n=== 测试并行执行模式 ===')

    const config: Partial<SchedulerConfig> = {
        mode: 'parallel',
        maxConcurrency: 3,
        rateLimit: {
            windowMs: 10000,
            maxTasks: 50
        },
        enableCancellation: true
    }

    const scheduler = new TaskScheduler('test-parallel', config)
    await scheduler.start()

    // 添加多个任务，应该并行执行
    const tasks = [
        createTestTask('parallel-1', 1, 1000),
        createTestTask('parallel-2', 5, 1000),
        createTestTask('parallel-3', 10, 1000),
        createTestTask('parallel-4', 3, 500),
        createTestTask('parallel-5', 8, 500)
    ]

    const startTime = Date.now()
    const taskIds = []

    for (const task of tasks) {
        const taskId = await scheduler.scheduleTask(task)
        taskIds.push(taskId)
    }

    // 等待所有任务完成
    await new Promise(resolve => setTimeout(resolve, 2500))

    const endTime = Date.now()
    console.log(`并行执行总耗时: ${endTime - startTime}ms`)
    console.log('调度器统计:', scheduler.getStats())

    await scheduler.destroy()
}

/**
 * 测试混合执行模式
 */
export async function testMixedMode() {
    console.log('\n=== 测试混合执行模式 ===')

    const config: Partial<SchedulerConfig> = {
        mode: 'mixed',
        maxConcurrency: 3,
        rateLimit: {
            windowMs: 10000,
            maxTasks: 50
        },
        enableCancellation: true
    }

    const scheduler = new TaskScheduler('test-mixed', config)
    await scheduler.start()

    // 添加不同优先级的任务
    const tasks = [
        createTestTask('mixed-low-1', 1, 800),     // 低优先级，串行
        createTestTask('mixed-high-1', 9, 600),    // 高优先级，并行
        createTestTask('mixed-medium-1', 5, 400),  // 中等优先级，根据负载决定
        createTestTask('mixed-low-2', 2, 500),     // 低优先级，串行
        createTestTask('mixed-high-2', 8, 700)     // 高优先级，并行
    ]

    const startTime = Date.now()

    for (const task of tasks) {
        await scheduler.scheduleTask(task)
        // 稍微间隔一下，观察负载变化
        await new Promise(resolve => setTimeout(resolve, 200))
    }

    // 等待所有任务完成
    await new Promise(resolve => setTimeout(resolve, 3000))

    const endTime = Date.now()
    console.log(`混合执行总耗时: ${endTime - startTime}ms`)
    console.log('调度器统计:', scheduler.getStats())

    await scheduler.destroy()
}

/**
 * 测试任务取消功能
 */
export async function testTaskCancellation() {
    console.log('\n=== 测试任务取消功能 ===')

    const scheduler = new TaskScheduler('test-cancel', {
        mode: 'parallel',
        maxConcurrency: 2,
        enableCancellation: true
    })

    await scheduler.start()

    // 创建长时间运行的任务
    const longTask1 = createTestTask('cancel-1', 5, 3000)
    const longTask2 = createTestTask('cancel-2', 5, 3000)
    const shortTask = createTestTask('cancel-3', 5, 500)

    const taskId1 = await scheduler.scheduleTask(longTask1)
    const taskId2 = await scheduler.scheduleTask(longTask2)
    const taskId3 = await scheduler.scheduleTask(shortTask)

    console.log('已调度3个任务，2个长任务(3秒)，1个短任务(0.5秒)')

    // 等待一秒后取消第一个任务
    setTimeout(async () => {
        const cancelled = await scheduler.cancelTask(taskId1)
        console.log(`取消任务 ${taskId1}: ${cancelled ? '成功' : '失败'}`)
    }, 1000)

    // 等待所有任务完成或被取消
    await new Promise(resolve => setTimeout(resolve, 4000))

    console.log('任务取消测试统计:', scheduler.getStats())

    await scheduler.destroy()
}

/**
 * 测试限流功能
 */
export async function testRateLimit() {
    console.log('\n=== 测试限流功能 ===')

    const scheduler = new TaskScheduler('test-ratelimit', {
        mode: 'parallel',
        maxConcurrency: 5,
        rateLimit: {
            windowMs: 5000, // 5秒窗口
            maxTasks: 3     // 最多3个任务
        }
    })

    await scheduler.start()

    try {
        // 尝试快速添加多个任务，应该在第4个任务时触发限流
        for (let i = 1; i <= 6; i++) {
            try {
                const task = createTestTask(`ratelimit-${i}`, 5, 300)
                const taskId = await scheduler.scheduleTask(task)
                console.log(`✅ 成功调度任务 ${i}: ${taskId}`)
            } catch (error) {
                console.log(`❌ 任务 ${i} 被限流阻止:`, (error as Error).message)
            }
        }
    } catch (error) {
        console.error('限流测试出错:', error)
    }

    // 等待限流窗口重置
    console.log('等待限流窗口重置...')
    await new Promise(resolve => setTimeout(resolve, 6000))

    // 再次尝试添加任务
    try {
        const task = createTestTask('ratelimit-after-reset', 5, 300)
        const taskId = await scheduler.scheduleTask(task)
        console.log(`✅ 限流重置后成功调度任务: ${taskId}`)
    } catch (error) {
        console.log(`❌ 限流重置后仍然失败:`, (error as Error).message)
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('限流测试统计:', scheduler.getStats())

    await scheduler.destroy()
}

/**
 * 测试并发控制器
 */
export async function testConcurrencyController() {
    console.log('\n=== 测试并发控制器 ===')

    const controller = new ConcurrencyController('test-controller', {
        strategy: 'adaptive',
        baseConcurrency: 2,
        minConcurrency: 1,
        maxConcurrency: 5,
        resourceMonitor: {
            memoryThreshold: 80,
            cpuThreshold: 70,
            checkInterval: 2000,
            enableAutoAdjustment: true
        }
    })

    // 创建多个调度器
    const schedulers = [
        new TaskScheduler('scheduler-1', { mode: 'parallel', maxConcurrency: 2 }),
        new TaskScheduler('scheduler-2', { mode: 'parallel', maxConcurrency: 2 })
    ]

    // 注册调度器到控制器
    for (const scheduler of schedulers) {
        controller.registerScheduler(scheduler)
        await scheduler.start()
    }

    console.log('初始并发配置:', controller.getStats())

    // 模拟高负载情况
    const tasks = []
    for (let i = 1; i <= 8; i++) {
        const task = createTestTask(`controlled-${i}`, 5, 1500)
        tasks.push(task)
    }

    // 分配任务到不同调度器
    for (let i = 0; i < tasks.length; i++) {
        const scheduler = schedulers[i % schedulers.length]
        const task = tasks[i]
        if (scheduler && task) {
            await scheduler.scheduleTask(task)
        }
    }

    // 观察并发控制器的自适应调整
    const monitorInterval = setInterval(() => {
        console.log('并发控制器状态:', controller.getStats())
    }, 3000)

    // 等待任务完成
    await new Promise(resolve => setTimeout(resolve, 8000))

    clearInterval(monitorInterval)

    console.log('最终控制器统计:', controller.getStats())

    // 清理
    for (const scheduler of schedulers) {
        await scheduler.destroy()
    }
    controller.destroy()
}

/**
 * 测试模式切换
 */
export async function testModeSwitch() {
    console.log('\n=== 测试执行模式切换 ===')

    const scheduler = new TaskScheduler('test-switch', {
        mode: 'serial',
        maxConcurrency: 3
    })

    await scheduler.start()

    // 串行模式下添加任务
    console.log('当前模式: 串行')
    await scheduler.scheduleTask(createTestTask('switch-1', 5, 800))
    await scheduler.scheduleTask(createTestTask('switch-2', 5, 800))

    await new Promise(resolve => setTimeout(resolve, 1000))

    // 切换到并行模式
    console.log('切换到并行模式')
    await scheduler.switchMode('parallel')

    // 并行模式下添加任务
    await scheduler.scheduleTask(createTestTask('switch-3', 5, 800))
    await scheduler.scheduleTask(createTestTask('switch-4', 5, 800))
    await scheduler.scheduleTask(createTestTask('switch-5', 5, 800))

    await new Promise(resolve => setTimeout(resolve, 2000))

    // 切换到混合模式
    console.log('切换到混合模式')
    await scheduler.switchMode('mixed')

    // 混合模式下添加不同优先级的任务
    await scheduler.scheduleTask(createTestTask('switch-6', 2, 500))  // 低优先级
    await scheduler.scheduleTask(createTestTask('switch-7', 9, 500))  // 高优先级

    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('模式切换测试统计:', scheduler.getStats())

    await scheduler.destroy()
}

/**
 * 运行所有测试
 */
export async function runSchedulerTests() {
    console.log('🚀 开始任务调度器系统测试...')

    try {
        await testSerialMode()
        await testParallelMode()
        await testMixedMode()
        await testTaskCancellation()
        await testRateLimit()
        await testConcurrencyController()
        await testModeSwitch()

        console.log('\n✅ 所有调度器测试完成!')
    } catch (error) {
        console.error('❌ 测试失败:', error)
    }
}

// 如果在开发环境中，延迟运行测试
if (import.meta.env.DEV) {
    // 延迟运行测试，确保系统初始化完成
    setTimeout(() => {
        console.log('🎯 准备运行任务调度器测试...')
        // runSchedulerTests() // 取消注释以自动运行测试
    }, 3000)
}
