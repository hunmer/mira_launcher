/**
 * 队列系统测试示例
 * 用于验证基础队列架构和任务执行器的实现
 */

import {
    QueueFactory,
    TaskExecutor,
    type Task
} from '@/plugins/core'

/**
 * 创建测试任务
 */
function createTestTask(id: string, priority: number = 0, delay: number = 0): Task {
    return {
        id,
        priority,
        execute: async () => {
            console.log(`Executing task ${id}`)
            await new Promise(resolve => setTimeout(resolve, 100)) // 模拟异步操作
            return `Task ${id} completed`
        },
        onSuccess: (result) => {
            console.log(`Task ${id} succeeded:`, result)
        },
        onError: (error) => {
            console.error(`Task ${id} failed:`, error)
        },
        metadata: { delay }
    }
}

/**
 * 测试 FIFO 队列
 */
export async function testFIFOQueue() {
    console.log('\n=== Testing FIFO Queue ===')

    const queue = QueueFactory.createQueue('test-fifo', 'fifo', {
        concurrency: 1,
        autostart: true
    })

    // 添加任务
    for (let i = 1; i <= 3; i++) {
        const task = createTestTask(`fifo-${i}`)
        await queue.push(task)
    }

    // 启动队列
    await queue.start()

    // 等待完成
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('FIFO Queue Stats:', queue.getStats())
    QueueFactory.destroyQueue('test-fifo')
}

/**
 * 测试优先级队列
 */
export async function testPriorityQueue() {
    console.log('\n=== Testing Priority Queue ===')

    const queue = QueueFactory.createQueue('test-priority', 'priority', {
        concurrency: 1,
        autostart: true
    })

    // 添加不同优先级的任务
    const tasks = [
        createTestTask('low-priority', 1),
        createTestTask('high-priority', 10),
        createTestTask('medium-priority', 5)
    ]

    for (const task of tasks) {
        await queue.push(task)
    }

    await queue.start()
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Priority Queue Stats:', queue.getStats())
    QueueFactory.destroyQueue('test-priority')
}

/**
 * 测试延迟队列
 */
export async function testDelayedQueue() {
    console.log('\n=== Testing Delayed Queue ===')

    const queue = QueueFactory.createQueue('test-delayed', 'delayed', {
        concurrency: 1,
        autostart: true
    })

    // 添加延迟任务
    const tasks = [
        createTestTask('immediate', 0, 0),
        createTestTask('delayed-500ms', 0, 500),
        createTestTask('delayed-200ms', 0, 200)
    ]

    for (const task of tasks) {
        await queue.push(task)
    }

    await queue.start()
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('Delayed Queue Stats:', queue.getStats())
    QueueFactory.destroyQueue('test-delayed')
}

/**
 * 测试任务执行器
 */
export async function testTaskExecutor() {
    console.log('\n=== Testing Task Executor ===')

    const executor = new TaskExecutor({
        defaultTimeout: 5000,
        enableResourceMonitoring: true
    })

    const task = createTestTask('executor-test', 0)

    try {
        const result = await executor.executeTask(task)
        console.log('Executor result:', result)
    } catch (error) {
        console.error('Executor error:', error)
    }

    console.log('Executor Stats:', executor.getStats())
    executor.destroy()
}

/**
 * 运行所有测试
 */
export async function runQueueTests() {
    console.log('Starting Queue System Tests...')

    try {
        await testFIFOQueue()
        await testPriorityQueue()
        await testDelayedQueue()
        await testTaskExecutor()

        console.log('\n=== Global Queue Stats ===')
        console.log(QueueFactory.getGlobalStats())

        console.log('\nAll tests completed successfully!')
    } catch (error) {
        console.error('Test failed:', error)
    } finally {
        // 清理所有队列
        QueueFactory.destroyAllQueues()
    }
}

// 如果在开发环境中，自动运行测试
if (import.meta.env.DEV) {
    // 延迟运行测试，确保系统初始化完成
    setTimeout(() => {
        runQueueTests()
    }, 2000)
}
