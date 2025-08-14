<!--
  下载进度显示组件
  提供下载任务的可视化进度条和状态显示
  集成现有的UI设计风格和组件系统
-->

<template>
    <div class="download-progress">
        <!-- 下载任务列表 -->
        <div v-if="downloadTasks.length > 0" class="download-tasks">
            <div class="tasks-header">
                <h3 class="header-title">
                    <i class="pi pi-download"></i>
                    下载管理 ({{ activeTasks.length }}/{{ downloadTasks.length }})
                </h3>

                <div class="header-actions">
                    <!-- 批量操作模式切换 -->
                    <Button v-if="!isBatchMode" icon="pi pi-check-square" text @click="enterBatchMode"
                        :disabled="downloadTasks.length === 0" title="进入批量模式" />
                    <Button v-else icon="pi pi-times" text @click="exitBatchMode" title="退出批量模式" />

                    <!-- 批量操作按钮 -->
                    <template v-if="isBatchMode && selectedTasks.length > 0">
                        <Button icon="pi pi-play" severity="success" text @click="batchResume"
                            :disabled="!canBatchResume" title="批量恢复" />
                        <Button icon="pi pi-pause" severity="warning" text @click="batchPause"
                            :disabled="!canBatchPause" title="批量暂停" />
                        <Button icon="pi pi-refresh" severity="info" text @click="batchRetry" :disabled="!canBatchRetry"
                            title="批量重试" />
                        <Button icon="pi pi-times" severity="danger" text @click="batchCancel" title="批量取消" />
                    </template>

                    <!-- 全局操作 -->
                    <Button icon="pi pi-pause" text @click="pauseAll" :disabled="activeTasks.length === 0"
                        title="暂停全部" />
                    <Button icon="pi pi-play" text @click="resumeAll" :disabled="pausedTasks.length === 0"
                        title="恢复全部" />
                    <Button icon="pi pi-trash" text @click="clearCompleted" :disabled="completedTasks.length === 0"
                        title="清理已完成" />
                </div>
            </div>

            <!-- 批量模式全选 -->
            <div v-if="isBatchMode" class="batch-controls">
                <Checkbox v-model="isAllSelected" @change="toggleSelectAll" binary />
                <span class="batch-info">
                    已选择 {{ selectedTasks.length }} / {{ downloadTasks.length }} 项
                </span>
            </div>

            <!-- 任务列表 -->
            <div class="task-list">
                <div v-for="task in displayTasks" :key="task.id" class="task-item" :class="{
                    'task-active': isActiveTask(task),
                    'task-completed': task.state === 'completed',
                    'task-failed': task.state === 'failed',
                    'task-selected': isBatchMode && selectedTaskIds.has(task.id)
                }">
                    <!-- 批量模式选择框 -->
                    <Checkbox v-if="isBatchMode" :model-value="selectedTaskIds.has(task.id)"
                        @change="toggleTaskSelection(task.id)" binary class="task-checkbox" />

                    <!-- 任务信息 -->
                    <div class="task-info">
                        <div class="task-header">
                            <span class="task-name" :title="task.fileName">
                                {{ task.fileName }}
                            </span>
                            <div class="task-actions">
                                <!-- 任务控制按钮 -->
                                <Button v-if="task.state === 'downloading' || task.state === 'starting'"
                                    icon="pi pi-pause" text size="small" @click="pauseTask(task.id)" title="暂停" />
                                <Button v-else-if="task.state === 'paused'" icon="pi pi-play" text size="small"
                                    @click="resumeTask(task.id)" title="恢复" />
                                <Button v-else-if="task.state === 'failed'" icon="pi pi-refresh" text size="small"
                                    @click="retryTask(task.id)" title="重试" />
                                <Button v-if="!['completed'].includes(task.state)" icon="pi pi-times" text size="small"
                                    severity="danger" @click="cancelTask(task.id)" title="取消" />
                                <Button icon="pi pi-trash" text size="small" severity="danger"
                                    @click="removeTask(task.id)" :disabled="isActiveTask(task)" title="删除" />
                            </div>
                        </div>

                        <!-- 进度条 -->
                        <div class="task-progress">
                            <ProgressBar :value="task.progress" :show-value="false" class="progress-bar" :class="{
                                'progress-success': task.state === 'completed',
                                'progress-error': task.state === 'failed',
                                'progress-warning': task.state === 'paused'
                            }" />
                            <span class="progress-text">
                                {{ Math.round(task.progress) }}%
                            </span>
                        </div>

                        <!-- 详细信息 -->
                        <div class="task-details">
                            <div class="detail-row">
                                <span class="detail-label">状态:</span>
                                <Tag :value="getStateLabel(task.state)" :severity="getStateSeverity(task.state)"
                                    size="small" />
                            </div>

                            <div class="detail-row">
                                <span class="detail-label">大小:</span>
                                <span class="detail-value">
                                    {{ formatBytes(task.downloadedSize) }} / {{ formatBytes(task.fileSize) }}
                                </span>
                            </div>

                            <div v-if="isActiveTask(task)" class="detail-row">
                                <span class="detail-label">速度:</span>
                                <span class="detail-value">{{ formatSpeed(task.speed) }}</span>
                            </div>

                            <div v-if="isActiveTask(task) && task.remainingTime > 0" class="detail-row">
                                <span class="detail-label">剩余:</span>
                                <span class="detail-value">{{ formatTime(task.remainingTime) }}</span>
                            </div>

                            <div v-if="task.error" class="detail-row">
                                <span class="detail-label">错误:</span>
                                <span class="detail-value error-text" :title="task.error">
                                    {{ task.error }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 分页 -->
            <Paginator v-if="downloadTasks.length > (props.pageSize || 20)" v-model:first="first"
                :rows="props.pageSize || 20" :total-records="downloadTasks.length" :rows-per-page-options="[10, 20, 50]"
                class="task-paginator" />
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
            <i class="pi pi-download empty-icon"></i>
            <h3>暂无下载任务</h3>
            <p>点击"添加下载"开始下载文件</p>
            <Button label="添加下载" icon="pi pi-plus" @click="$emit('add-download')" />
        </div>

        <!-- 全局统计信息 -->
        <div v-if="downloadTasks.length > 0" class="global-stats">
            <div class="stats-item">
                <span class="stats-label">总进度:</span>
                <ProgressBar :value="stats.overallProgress" :show-value="false" class="global-progress" />
                <span class="stats-value">{{ Math.round(stats.overallProgress) }}%</span>
            </div>

            <div class="stats-item">
                <span class="stats-label">总速度:</span>
                <span class="stats-value">{{ formatSpeed(stats.averageSpeed) }}</span>
            </div>

            <div class="stats-item">
                <span class="stats-label">成功率:</span>
                <span class="stats-value">{{ Math.round(stats.successRate) }}%</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { DownloadTask } from '@/stores/download'
import { useDownloadStore } from '@/stores/download'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Paginator from 'primevue/paginator'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import { computed, ref, watch } from 'vue'

// Props
interface Props {
    /** 是否显示已完成的任务 */
    showCompleted?: boolean
    /** 是否显示失败的任务 */
    showFailed?: boolean
    /** 每页显示数量 */
    pageSize?: number
    /** 最大显示任务数 */
    maxTasks?: number
}

const props = withDefaults(defineProps<Props>(), {
    showCompleted: true,
    showFailed: true,
    pageSize: 20,
    maxTasks: 100
})

// Emits
const emit = defineEmits<{
    'add-download': []
    'task-click': [task: DownloadTask]
}>()

// Store
const downloadStore = useDownloadStore()

// 响应式数据
const first = ref(0)

// 计算属性
const downloadTasks = computed(() => {
    let tasks = downloadStore.tasks

    // 过滤条件
    if (!props.showCompleted) {
        tasks = tasks.filter(task => task.state !== 'completed')
    }
    if (!props.showFailed) {
        tasks = tasks.filter(task => task.state !== 'failed')
    }

    // 限制最大数量
    if (props.maxTasks > 0 && tasks.length > props.maxTasks) {
        tasks = tasks.slice(0, props.maxTasks)
    }

    return tasks
})

const displayTasks = computed(() => {
    const startIndex = first.value
    const endIndex = startIndex + (props.pageSize || 20)
    return downloadTasks.value.slice(startIndex, endIndex)
})

const activeTasks = computed(() => downloadStore.activeTasks)
const pausedTasks = computed(() =>
    downloadTasks.value.filter(task => task.state === 'paused')
)
const completedTasks = computed(() => downloadStore.completedTasks)
const stats = computed(() => downloadStore.stats)

// 批量操作相关
const isBatchMode = computed(() => downloadStore.isBatchMode)
const selectedTaskIds = computed(() => downloadStore.selectedTaskIds)
const selectedTasks = computed(() => downloadStore.selectedTasks)

const isAllSelected = computed({
    get: () => selectedTaskIds.value.size === downloadTasks.value.length && downloadTasks.value.length > 0,
    set: () => toggleSelectAll()
})

const canBatchPause = computed(() =>
    selectedTasks.value.some(task => ['downloading', 'starting', 'retrying'].includes(task.state))
)

const canBatchResume = computed(() =>
    selectedTasks.value.some(task => task.state === 'paused')
)

const canBatchRetry = computed(() =>
    selectedTasks.value.some(task => task.state === 'failed')
)

// 方法
const isActiveTask = (task: DownloadTask): boolean => {
    return ['starting', 'downloading', 'retrying'].includes(task.state)
}

const getStateLabel = (state: string): string => {
    const stateLabels: Record<string, string> = {
        pending: '等待中',
        starting: '启动中',
        downloading: '下载中',
        paused: '已暂停',
        completed: '已完成',
        failed: '已失败',
        cancelled: '已取消',
        retrying: '重试中'
    }
    return stateLabels[state] || state
}

const getStateSeverity = (state: string): string => {
    const severities: Record<string, string> = {
        pending: 'info',
        starting: 'info',
        downloading: 'success',
        paused: 'warning',
        completed: 'success',
        failed: 'danger',
        cancelled: 'secondary',
        retrying: 'warning'
    }
    return severities[state] || 'info'
}

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s'
}

const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '未知'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else if (minutes > 0) {
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    } else {
        return `${secs}秒`
    }
}

// 任务操作方法
const pauseTask = (taskId: string) => {
    downloadStore.pauseTask(taskId)
}

const resumeTask = (taskId: string) => {
    downloadStore.resumeTask(taskId)
}

const retryTask = (taskId: string) => {
    downloadStore.retryTask(taskId)
}

const cancelTask = (taskId: string) => {
    downloadStore.cancelTask(taskId)
}

const removeTask = (taskId: string) => {
    downloadStore.removeTask(taskId)
}

// 批量操作方法
const enterBatchMode = () => {
    downloadStore.enterBatchMode()
}

const exitBatchMode = () => {
    downloadStore.exitBatchMode()
}

const toggleTaskSelection = (taskId: string) => {
    downloadStore.toggleTaskSelection(taskId)
}

const toggleSelectAll = () => {
    downloadStore.toggleSelectAll()
}

const batchPause = () => {
    downloadStore.batchPause()
}

const batchResume = () => {
    downloadStore.batchResume()
}

const batchRetry = () => {
    downloadStore.batchRetry()
}

const batchCancel = () => {
    downloadStore.batchCancel()
}

// 全局操作方法
const pauseAll = () => {
    activeTasks.value.forEach(task => pauseTask(task.id))
}

const resumeAll = () => {
    pausedTasks.value.forEach(task => resumeTask(task.id))
}

const clearCompleted = () => {
    downloadStore.clearCompletedTasks()
}

// 监听器
watch(() => downloadTasks.value.length, (newLength, oldLength) => {
    // 如果任务数量减少且当前页没有数据，跳转到上一页
    if (newLength < oldLength && first.value >= newLength && first.value > 0) {
        first.value = Math.max(0, Math.floor((newLength - 1) / (props.pageSize || 20)) * (props.pageSize || 20))
    }
})
</script>

<style scoped>
.download-progress {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.download-tasks {
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    border: 1px solid rgb(229, 231, 235);
    overflow: hidden;
    backdrop-filter: blur(8px);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.dark .download-tasks {
    background-color: rgba(31, 41, 55, 0.9);
    border-color: rgb(55, 65, 81);
}

.tasks-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid rgb(229, 231, 235);
    background-color: rgba(249, 250, 251, 0.8);
}

.dark .tasks-header {
    border-bottom-color: rgb(55, 65, 81);
    background-color: rgba(17, 24, 39, 0.8);
}

.header-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: rgb(17, 24, 39);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.dark .header-title {
    color: rgb(255, 255, 255);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.batch-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background-color: rgba(239, 246, 255, 0.8);
    border-bottom: 1px solid rgb(229, 231, 235);
}

.dark .batch-controls {
    background-color: rgba(30, 64, 175, 0.2);
    border-bottom-color: rgb(55, 65, 81);
}

.batch-info {
    font-size: 0.875rem;
    color: rgb(29, 78, 216);
}

.dark .batch-info {
    color: rgb(147, 197, 253);
}

.task-list {
    border-top: none;
}

.task-item {
    padding: 1rem;
    border-bottom: 1px solid rgb(229, 231, 235);
    transition: background-color 0.2s ease-in-out;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.dark .task-item {
    border-bottom-color: rgb(55, 65, 81);
}

.task-item:hover {
    background-color: rgba(249, 250, 251, 0.8);
}

.dark .task-item:hover {
    background-color: rgba(55, 65, 81, 0.5);
}

.task-item.task-active {
    background-color: rgba(239, 246, 255, 0.6);
}

.dark .task-item.task-active {
    background-color: rgba(30, 64, 175, 0.2);
}

.task-item.task-completed {
    background-color: rgba(240, 253, 244, 0.6);
}

.dark .task-item.task-completed {
    background-color: rgba(6, 78, 59, 0.2);
}

.task-item.task-failed {
    background-color: rgba(254, 242, 242, 0.6);
}

.dark .task-item.task-failed {
    background-color: rgba(127, 29, 29, 0.2);
}

.task-item.task-selected {
    background-color: rgba(219, 234, 254, 0.8);
}

.dark .task-item.task-selected {
    background-color: rgba(30, 64, 175, 0.3);
}

.task-checkbox {
    margin-right: 0.75rem;
    flex-shrink: 0;
}

.task-info {
    flex: 1;
    min-width: 0;
}

.task-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.task-name {
    font-weight: 500;
    color: rgb(17, 24, 39);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    margin-right: 1rem;
}

.dark .task-name {
    color: rgb(255, 255, 255);
}

.task-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
}

.task-progress {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.progress-bar {
    flex: 1;
}

.progress-bar.progress-success :deep(.p-progressbar-value) {
    background-color: rgb(34, 197, 94);
}

.progress-bar.progress-error :deep(.p-progressbar-value) {
    background-color: rgb(239, 68, 68);
}

.progress-bar.progress-warning :deep(.p-progressbar-value) {
    background-color: rgb(245, 158, 11);
}

.progress-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgb(107, 114, 128);
    min-width: 3rem;
    text-align: right;
}

.dark .progress-text {
    color: rgb(156, 163, 175);
}

.task-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem 1rem;
    font-size: 0.875rem;
}

.detail-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.detail-label {
    color: rgb(107, 114, 128);
    min-width: 3rem;
    flex-shrink: 0;
}

.dark .detail-label {
    color: rgb(156, 163, 175);
}

.detail-value {
    color: rgb(17, 24, 39);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dark .detail-value {
    color: rgb(255, 255, 255);
}

.error-text {
    color: rgb(220, 38, 38);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dark .error-text {
    color: rgb(248, 113, 113);
}

.task-paginator {
    border-top: 1px solid rgb(229, 231, 235);
}

.dark .task-paginator {
    border-top-color: rgb(55, 65, 81);
}

.empty-state {
    text-align: center;
    padding: 3rem 1rem;
}

.empty-icon {
    font-size: 4rem;
    color: rgb(156, 163, 175);
    margin-bottom: 1rem;
}

.dark .empty-icon {
    color: rgb(75, 85, 99);
}

.empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: rgb(55, 65, 81);
    margin-bottom: 0.5rem;
}

.dark .empty-state h3 {
    color: rgb(209, 213, 219);
}

.empty-state p {
    color: rgb(107, 114, 128);
    margin-bottom: 1.5rem;
}

.dark .empty-state p {
    color: rgb(156, 163, 175);
}

.global-stats {
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    border: 1px solid rgb(229, 231, 235);
    padding: 1rem;
    backdrop-filter: blur(8px);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.dark .global-stats {
    background-color: rgba(31, 41, 55, 0.9);
    border-color: rgb(55, 65, 81);
}

.stats-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
}

.stats-label {
    font-size: 0.875rem;
    color: rgb(107, 114, 128);
    min-width: 4rem;
    flex-shrink: 0;
}

.dark .stats-label {
    color: rgb(156, 163, 175);
}

.global-progress {
    flex: 1;
}

.stats-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgb(17, 24, 39);
    min-width: 4rem;
    text-align: right;
    flex-shrink: 0;
}

.dark .stats-value {
    color: rgb(255, 255, 255);
}
</style>
