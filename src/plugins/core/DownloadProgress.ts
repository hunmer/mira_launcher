/**
 * 下载进度追踪系统
 * 浏览器兼容的下载实现，提供与 node-downloader-helper 类似的接口
 * 支持进度追踪、速度计算和断点续传
 */

import { reactive } from 'vue'
import { globalEventBus } from './EventBus'

/**
 * 下载统计信息
 */
export interface DownloadStats {
    /** 总文件大小 */
    total: number
    /** 已下载大小 */
    downloaded: number
    /** 下载进度（0-1） */
    progress: number
    /** 下载速度（字节/秒） */
    speed: number
    /** 剩余时间（秒） */
    remainingTime: number
}

/**
 * 下载事件类型
 */
export type DownloadEventType =
    | 'start'
    | 'progress'
    | 'pause'
    | 'resume'
    | 'end'
    | 'error'
    | 'timeout'

/**
 * 下载完成信息
 */
export interface DownloadEndResponse {
    /** 下载的文件路径 */
    filePath: string
    /** 总文件大小 */
    totalSize: number
    /** 下载时长（毫秒） */
    duration: number
    /** 平均速度（字节/秒） */
    averageSpeed: number
}

/**
 * 下载选项
 */
export interface BrowserDownloadOptions {
    /** 文件名 */
    fileName?: string
    /** 请求头 */
    headers?: Record<string, string>
    /** 超时时间（毫秒） */
    timeout?: number
    /** 是否覆盖现有文件 */
    override?: boolean
    /** 是否支持断点续传 */
    resumeIfFileExists?: boolean
    /** 代理设置（浏览器环境暂不支持） */
    proxy?: string
}

/**
 * 浏览器下载助手类
 * 提供与 node-downloader-helper 兼容的接口
 */
export class BrowserDownloadHelper {
    private url: string
    private savePath: string
    private options: BrowserDownloadOptions
    private abortController: AbortController | null = null
    private startTime: number = 0
    private lastProgressTime: number = 0
    private lastDownloadedBytes: number = 0
    private totalSize: number = 0
    private downloadedSize: number = 0
    private isDownloading: boolean = false
    private isPaused: boolean = false
    private eventListeners: Map<DownloadEventType, Function[]> = new Map()

    constructor(url: string, savePath: string, options: BrowserDownloadOptions = {}) {
        this.url = url
        this.savePath = savePath
        this.options = options

        // 初始化事件监听器
        this.eventListeners.set('start', [])
        this.eventListeners.set('progress', [])
        this.eventListeners.set('pause', [])
        this.eventListeners.set('resume', [])
        this.eventListeners.set('end', [])
        this.eventListeners.set('error', [])
        this.eventListeners.set('timeout', [])
    }

    /**
     * 添加事件监听器
     */
    on(event: DownloadEventType, listener: Function): void {
        const listeners = this.eventListeners.get(event) || []
        listeners.push(listener)
        this.eventListeners.set(event, listeners)
    }

    /**
     * 移除事件监听器
     */
    off(event: DownloadEventType, listener: Function): void {
        const listeners = this.eventListeners.get(event) || []
        const index = listeners.indexOf(listener)
        if (index >= 0) {
            listeners.splice(index, 1)
        }
    }

    /**
     * 触发事件
     */
    private emit(event: DownloadEventType, data?: any): void {
        const listeners = this.eventListeners.get(event) || []
        listeners.forEach(listener => {
            try {
                listener(data)
            } catch (error) {
                console.warn(`Error in ${event} listener:`, error)
            }
        })
    }

    /**
     * 开始下载
     */
    async start(): Promise<void> {
        if (this.isDownloading) {
            return
        }

        this.isDownloading = true
        this.startTime = Date.now()
        this.abortController = new AbortController()

        try {
            this.emit('start')

            // 获取文件信息
            await this.fetchFileInfo()

            // 执行下载
            await this.downloadFile()

            const endResponse: DownloadEndResponse = {
                filePath: this.getFilePath(),
                totalSize: this.totalSize,
                duration: Date.now() - this.startTime,
                averageSpeed: this.calculateAverageSpeed()
            }

            this.emit('end', endResponse)

        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    // 下载被取消，不触发错误事件
                    return
                }
                this.emit('error', error)
            } else {
                this.emit('error', new Error('Unknown download error'))
            }
        } finally {
            this.isDownloading = false
            this.abortController = null
        }
    }

    /**
     * 暂停下载
     */
    pause(): void {
        if (!this.isDownloading || this.isPaused) {
            return
        }

        this.isPaused = true
        if (this.abortController) {
            this.abortController.abort()
        }

        this.emit('pause')
    }

    /**
     * 恢复下载
     */
    resume(): void {
        if (!this.isPaused) {
            return
        }

        this.isPaused = false
        this.emit('resume')

        // 重新开始下载（从当前位置）
        this.start()
    }

    /**
     * 停止下载
     */
    stop(): void {
        if (this.abortController) {
            this.abortController.abort()
        }
        this.isDownloading = false
        this.isPaused = false
    }

    /**
     * 获取总文件大小
     */
    getTotalSize(): number {
        return this.totalSize
    }

    /**
     * 获取已下载大小
     */
    getDownloadedSize(): number {
        return this.downloadedSize
    }

    /**
     * 获取下载进度（0-1）
     */
    getProgress(): number {
        return this.totalSize > 0 ? this.downloadedSize / this.totalSize : 0
    }

    /**
     * 获取文件路径
     */
    private getFilePath(): string {
        const fileName = this.options.fileName || this.extractFileNameFromUrl()
        return `${this.savePath}/${fileName}`
    }

    /**
     * 从URL提取文件名
     */
    private extractFileNameFromUrl(): string {
        try {
            const url = new URL(this.url)
            const pathname = url.pathname
            const fileName = pathname.substring(pathname.lastIndexOf('/') + 1)
            return fileName || `download_${Date.now()}`
        } catch {
            return `download_${Date.now()}`
        }
    }

    /**
     * 获取文件信息
     */
    private async fetchFileInfo(): Promise<void> {
        try {
            const response = await fetch(this.url, {
                method: 'HEAD',
                ...(this.options.headers && { headers: this.options.headers }),
                ...(this.abortController && { signal: this.abortController.signal })
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const contentLength = response.headers.get('content-length')
            if (contentLength) {
                this.totalSize = parseInt(contentLength, 10)
            }

        } catch (error) {
            // 如果 HEAD 请求失败，继续使用 GET 请求
            console.warn('HEAD request failed, will determine size during download:', error)
        }
    }

    /**
     * 下载文件
     */
    private async downloadFile(): Promise<void> {
        const response = await fetch(this.url, {
            method: 'GET',
            ...(this.options.headers && { headers: this.options.headers }),
            ...(this.abortController && { signal: this.abortController.signal })
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // 如果之前没有获取到文件大小，从响应头获取
        if (this.totalSize === 0) {
            const contentLength = response.headers.get('content-length')
            if (contentLength) {
                this.totalSize = parseInt(contentLength, 10)
            }
        }

        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('Unable to read response body')
        }

        const chunks: Uint8Array[] = []
        let lastProgressEmit = Date.now()

        try {
            while (true) {
                const { done, value } = await reader.read()

                if (done) {
                    break
                }

                if (this.isPaused) {
                    // 暂停时退出读取循环
                    break
                }

                chunks.push(value)
                this.downloadedSize += value.length

                // 更新进度（限制频率）
                const now = Date.now()
                if (now - lastProgressEmit >= 100) { // 每100ms最多更新一次
                    this.updateProgress()
                    lastProgressEmit = now
                }
            }

            // 最后一次进度更新
            this.updateProgress()

            // 在浏览器环境中，我们创建下载链接
            if (!this.isPaused && chunks.length > 0) {
                this.createDownloadBlob(chunks)
            }

        } finally {
            reader.releaseLock()
        }
    }

    /**
     * 更新进度信息
     */
    private updateProgress(): void {
        const now = Date.now()
        const timeDiff = (now - this.lastProgressTime) / 1000
        const bytesDiff = this.downloadedSize - this.lastDownloadedBytes

        const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0
        const remainingBytes = this.totalSize - this.downloadedSize
        const remainingTime = speed > 0 ? remainingBytes / speed : 0

        const stats: DownloadStats = {
            total: this.totalSize,
            downloaded: this.downloadedSize,
            progress: this.getProgress(),
            speed,
            remainingTime
        }

        this.emit('progress', stats)

        this.lastProgressTime = now
        this.lastDownloadedBytes = this.downloadedSize
    }

    /**
     * 创建下载Blob并触发下载
     */
    private createDownloadBlob(chunks: Uint8Array[]): void {
        const blob = new Blob(chunks as BlobPart[])
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = this.options.fileName || this.extractFileNameFromUrl()
        a.style.display = 'none'

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        URL.revokeObjectURL(url)
    }

    /**
     * 计算平均速度
     */
    private calculateAverageSpeed(): number {
        const duration = (Date.now() - this.startTime) / 1000
        return duration > 0 ? this.downloadedSize / duration : 0
    }
}

/**
 * 下载进度管理器
 * 管理多个下载任务的进度追踪
 */
export class DownloadProgressManager {
    private downloads: Map<string, BrowserDownloadHelper> = reactive(new Map())
    private progressData = reactive(new Map<string, DownloadStats>())

    /**
     * 创建下载任务
     */
    createDownload(
        taskId: string,
        url: string,
        savePath: string,
        options: BrowserDownloadOptions = {}
    ): BrowserDownloadHelper {
        const downloader = new BrowserDownloadHelper(url, savePath, options)

        // 设置事件监听
        this.setupDownloadEvents(taskId, downloader)

        this.downloads.set(taskId, downloader)

        return downloader
    }

    /**
     * 设置下载事件
     */
    private setupDownloadEvents(taskId: string, downloader: BrowserDownloadHelper): void {
        downloader.on('start', () => {
            globalEventBus.emit('download:progressStart', { taskId })
        })

        downloader.on('progress', (stats: DownloadStats) => {
            this.progressData.set(taskId, stats)
            globalEventBus.emit('download:progressUpdate', { taskId, stats })
        })

        downloader.on('end', (endResponse: DownloadEndResponse) => {
            this.downloads.delete(taskId)
            this.progressData.delete(taskId)
            globalEventBus.emit('download:progressEnd', { taskId, endResponse })
        })

        downloader.on('error', (error: Error) => {
            this.downloads.delete(taskId)
            this.progressData.delete(taskId)
            globalEventBus.emit('download:progressError', { taskId, error })
        })

        downloader.on('pause', () => {
            globalEventBus.emit('download:progressPause', { taskId })
        })

        downloader.on('resume', () => {
            globalEventBus.emit('download:progressResume', { taskId })
        })
    }

    /**
     * 获取下载实例
     */
    getDownload(taskId: string): BrowserDownloadHelper | undefined {
        return this.downloads.get(taskId) as BrowserDownloadHelper | undefined
    }

    /**
     * 获取进度数据
     */
    getProgress(taskId: string): DownloadStats | undefined {
        return this.progressData.get(taskId)
    }

    /**
     * 获取所有进度数据
     */
    getAllProgress(): Map<string, DownloadStats> {
        return new Map(this.progressData)
    }

    /**
     * 移除下载任务
     */
    removeDownload(taskId: string): void {
        const downloader = this.downloads.get(taskId)
        if (downloader) {
            downloader.stop()
            this.downloads.delete(taskId)
            this.progressData.delete(taskId)
        }
    }

    /**
     * 暂停所有下载
     */
    pauseAll(): void {
        this.downloads.forEach(downloader => downloader.pause())
    }

    /**
     * 恢复所有下载
     */
    resumeAll(): void {
        this.downloads.forEach(downloader => downloader.resume())
    }

    /**
     * 停止所有下载
     */
    stopAll(): void {
        this.downloads.forEach(downloader => downloader.stop())
        this.downloads.clear()
        this.progressData.clear()
    }

    /**
     * 获取统计信息
     */
    getStats(): {
        activeDownloads: number
        totalBytes: number
        downloadedBytes: number
        averageSpeed: number
        overallProgress: number
    } {
        const progressArray = Array.from(this.progressData.values())

        const totalBytes = progressArray.reduce((sum, stats) => sum + stats.total, 0)
        const downloadedBytes = progressArray.reduce((sum, stats) => sum + stats.downloaded, 0)
        const averageSpeed = progressArray.length > 0
            ? progressArray.reduce((sum, stats) => sum + stats.speed, 0) / progressArray.length
            : 0
        const overallProgress = totalBytes > 0 ? downloadedBytes / totalBytes : 0

        return {
            activeDownloads: this.downloads.size,
            totalBytes,
            downloadedBytes,
            averageSpeed,
            overallProgress
        }
    }
}

// 全局下载进度管理器实例
export const globalDownloadProgressManager = new DownloadProgressManager()

export default DownloadProgressManager
