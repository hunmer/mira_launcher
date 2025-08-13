import type { App } from 'vue'

/**
 * 性能监控插件
 * 用于开发环境下的性能分析和优化建议
 */
export function setupPerformanceMonitor(app: App) {
    if (import.meta.env.DEV) {
        // 启用 Vue 性能追踪
        app.config.performance = true

        // 组件渲染性能监控
        let renderCount = 0

        app.mixin({
            mounted() {
                renderCount++
                if (renderCount % 10 === 0) {
                    console.log(`[Performance] Rendered ${renderCount} components`)
                }
            }
        })

        // 路由切换性能监控
        const startTimes = new Map<string, number>()

        // 监听路由变化
        window.addEventListener('beforeunload', () => {
            console.log(`[Performance] Total components rendered: ${renderCount}`)
        })

        console.log('[Performance Monitor] Initialized for development environment')
    }
}

/**
 * 内存使用监控
 */
export function monitorMemoryUsage() {
    if (import.meta.env.DEV && 'memory' in performance) {
        const memory = (performance as any).memory

        console.log('[Memory Usage]', {
            used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
        })
    }
}

/**
 * 包大小分析
 */
export function analyzeBundleSize() {
    if (import.meta.env.PROD) {
        // 生产环境下的包大小报告
        const scripts = document.querySelectorAll('script[src]')
        const links = document.querySelectorAll('link[rel="stylesheet"]')

        console.log('[Bundle Analysis]', {
            scripts: scripts.length,
            stylesheets: links.length
        })
    }
}
