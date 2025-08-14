<!--
  下载管理页面
  集成下载进度组件和下载控制功能
-->

<template>
    <div class="download-page">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-content">
                <h1 class="page-title">
                    <i class="pi pi-download"></i>
                    下载管理
                </h1>
                <p class="page-description">
                    管理您的下载任务，查看进度和状态
                </p>
            </div>

            <div class="header-actions">
                <Button label="添加下载" icon="pi pi-plus" @click="showAddDialog = true" severity="primary" />
                <Button label="设置" icon="pi pi-cog" @click="showSettingsDialog = true" outlined />
            </div>
        </div>

        <!-- 下载统计卡片 -->
        <div class="stats-cards">
            <div class="stat-card">
                <div class="stat-icon downloading">
                    <i class="pi pi-download"></i>
                </div>
                <div class="stat-info">
                    <span class="stat-value">{{ downloadStore.activeTasks.length }}</span>
                    <span class="stat-label">进行中</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon completed">
                    <i class="pi pi-check-circle"></i>
                </div>
                <div class="stat-info">
                    <span class="stat-value">{{ downloadStore.completedTasks.length }}</span>
                    <span class="stat-label">已完成</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon failed">
                    <i class="pi pi-exclamation-triangle"></i>
                </div>
                <div class="stat-info">
                    <span class="stat-value">{{ downloadStore.failedTasks.length }}</span>
                    <span class="stat-label">失败</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon total">
                    <i class="pi pi-list"></i>
                </div>
                <div class="stat-info">
                    <span class="stat-value">{{ downloadStore.tasks.length }}</span>
                    <span class="stat-label">总计</span>
                </div>
            </div>
        </div>

        <!-- 下载进度组件 -->
        <DownloadProgress :show-completed="showCompleted" :show-failed="showFailed" :page-size="pageSize"
            @add-download="showAddDialog = true" @task-click="handleTaskClick" />

        <!-- 添加下载对话框 -->
        <Dialog v-model:visible="showAddDialog" header="添加下载" :modal="true" :style="{ width: '500px' }"
            class="add-download-dialog">
            <div class="dialog-content">
                <div class="form-field">
                    <label for="download-url" class="field-label">下载链接</label>
                    <InputText id="download-url" v-model="newDownload.url" placeholder="请输入下载链接" class="w-full"
                        :invalid="urlError !== ''" />
                    <small v-if="urlError" class="error-message">{{ urlError }}</small>
                </div>

                <div class="form-field">
                    <label for="download-filename" class="field-label">文件名（可选）</label>
                    <InputText id="download-filename" v-model="newDownload.fileName" placeholder="自动从链接中提取"
                        class="w-full" />
                </div>

                <div class="form-field">
                    <label for="download-path" class="field-label">保存路径</label>
                    <div class="path-input">
                        <InputText id="download-path" v-model="newDownload.savePath" placeholder="选择保存位置" readonly
                            class="flex-1" />
                        <Button label="浏览" icon="pi pi-folder-open" @click="browseSavePath" outlined />
                    </div>
                </div>

                <div class="form-field">
                    <div class="checkbox-field">
                        <Checkbox id="start-immediately" v-model="newDownload.startImmediately" binary />
                        <label for="start-immediately" class="checkbox-label">
                            立即开始下载
                        </label>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="取消" severity="secondary" @click="showAddDialog = false" text />
                <Button label="添加" @click="addDownload" :disabled="!isValidDownload" autofocus />
            </template>
        </Dialog>

        <!-- 设置对话框 -->
        <Dialog v-model:visible="showSettingsDialog" header="下载设置" :modal="true" :style="{ width: '600px' }"
            class="settings-dialog">
            <div class="settings-content">
                <div class="settings-section">
                    <h3>显示选项</h3>
                    <div class="setting-item">
                        <Checkbox id="show-completed" v-model="showCompleted" binary />
                        <label for="show-completed">显示已完成的任务</label>
                    </div>
                    <div class="setting-item">
                        <Checkbox id="show-failed" v-model="showFailed" binary />
                        <label for="show-failed">显示失败的任务</label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>分页设置</h3>
                    <div class="setting-item">
                        <label for="page-size">每页显示数量</label>
                        <Dropdown id="page-size" v-model="pageSize" :options="pageSizeOptions" option-label="label"
                            option-value="value" class="w-full" />
                    </div>
                </div>

                <div class="settings-section">
                    <h3>下载设置</h3>
                    <div class="setting-item">
                        <label for="max-concurrent">最大并发下载</label>
                        <InputNumber id="max-concurrent" v-model="maxConcurrentDownloads" :min="1" :max="10"
                            show-buttons class="w-full" />
                    </div>
                    <div class="setting-item">
                        <label for="default-path">默认保存路径</label>
                        <div class="path-input">
                            <InputText id="default-path" v-model="defaultSavePath" readonly class="flex-1" />
                            <Button label="浏览" icon="pi pi-folder-open" @click="browseDefaultPath" outlined />
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="取消" severity="secondary" @click="showSettingsDialog = false" text />
                <Button label="保存" @click="saveSettings" />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { DownloadProgress } from '@/components/business'
import type { DownloadTask } from '@/stores/download'
import { useDownloadStore } from '@/stores/download'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { computed, reactive, ref } from 'vue'

// Store
const downloadStore = useDownloadStore()
const toast = useToast()

// 响应式数据
const showAddDialog = ref(false)
const showSettingsDialog = ref(false)
const showCompleted = ref(true)
const showFailed = ref(true)
const pageSize = ref(20)
const maxConcurrentDownloads = ref(3)
const defaultSavePath = ref('')

// 新下载表单
const newDownload = reactive({
    url: '',
    fileName: '',
    savePath: '',
    startImmediately: true
})

const urlError = ref('')

// 计算属性
const isValidDownload = computed(() => {
    return newDownload.url.trim() !== '' &&
        newDownload.savePath.trim() !== '' &&
        urlError.value === ''
})

const pageSizeOptions = [
    { label: '10 项', value: 10 },
    { label: '20 项', value: 20 },
    { label: '50 项', value: 50 },
    { label: '100 项', value: 100 }
]

// 方法
const validateUrl = (url: string): boolean => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

const addDownload = async () => {
    // 验证 URL
    if (!validateUrl(newDownload.url)) {
        urlError.value = '请输入有效的下载链接'
        return
    }

    urlError.value = ''

    try {
        // 如果没有指定文件名，从 URL 中提取
        let fileName = newDownload.fileName.trim()
        if (!fileName) {
            const url = new URL(newDownload.url)
            fileName = url.pathname.split('/').pop() || 'download'
        }

        // 添加下载任务
        const taskId = downloadStore.addTask({
            url: newDownload.url,
            fileName: fileName,
            savePath: newDownload.savePath,
            fileSize: 0,
            state: newDownload.startImmediately ? 'pending' : 'paused',
            priority: 1,
            maxRetries: 3
        })

        toast.add({
            severity: 'success',
            summary: '下载已添加',
            detail: `任务 "${fileName}" 已成功添加到下载队列`,
            life: 3000
        })

        // 重置表单
        Object.assign(newDownload, {
            url: '',
            fileName: '',
            savePath: defaultSavePath.value,
            startImmediately: true
        })

        showAddDialog.value = false
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: '添加失败',
            detail: error instanceof Error ? error.message : '添加下载任务时发生错误',
            life: 5000
        })
    }
}

const browseSavePath = async () => {
    // 这里应该调用 Tauri 的文件选择器
    // 简化实现，使用默认路径
    if (!newDownload.savePath) {
        newDownload.savePath = defaultSavePath.value || './downloads'
    }

    toast.add({
        severity: 'info',
        summary: '提示',
        detail: '文件选择器功能需要 Tauri 支持',
        life: 3000
    })
}

const browseDefaultPath = async () => {
    // 这里应该调用 Tauri 的文件夹选择器
    defaultSavePath.value = './downloads'

    toast.add({
        severity: 'info',
        summary: '提示',
        detail: '文件夹选择器功能需要 Tauri 支持',
        life: 3000
    })
}

const saveSettings = () => {
    // 保存设置到本地存储或配置文件
    localStorage.setItem('download-settings', JSON.stringify({
        showCompleted: showCompleted.value,
        showFailed: showFailed.value,
        pageSize: pageSize.value,
        maxConcurrentDownloads: maxConcurrentDownloads.value,
        defaultSavePath: defaultSavePath.value
    }))

    toast.add({
        severity: 'success',
        summary: '设置已保存',
        detail: '下载设置已成功保存',
        life: 3000
    })

    showSettingsDialog.value = false
}

const handleTaskClick = (task: DownloadTask) => {
    console.log('点击任务:', task)
    // 可以在这里实现任务详情查看等功能
}

// 初始化
const initializeSettings = () => {
    try {
        const saved = localStorage.getItem('download-settings')
        if (saved) {
            const settings = JSON.parse(saved)
            showCompleted.value = settings.showCompleted ?? true
            showFailed.value = settings.showFailed ?? true
            pageSize.value = settings.pageSize ?? 20
            maxConcurrentDownloads.value = settings.maxConcurrentDownloads ?? 3
            defaultSavePath.value = settings.defaultSavePath ?? './downloads'
        }
    } catch (error) {
        console.warn('Failed to load download settings:', error)
    }

    // 设置新下载的默认保存路径
    newDownload.savePath = defaultSavePath.value
}

// 组件挂载时初始化设置
initializeSettings()
</script>

<style scoped>
.download-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    min-height: 100vh;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}

.header-content h1.page-title {
    font-size: 2rem;
    font-weight: 700;
    color: rgb(17, 24, 39);
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.dark .header-content h1.page-title {
    color: rgb(255, 255, 255);
}

.page-description {
    color: rgb(107, 114, 128);
    margin: 0;
    font-size: 1rem;
}

.dark .page-description {
    color: rgb(156, 163, 175);
}

.header-actions {
    display: flex;
    gap: 0.75rem;
}

.stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.stat-card {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid rgb(229, 231, 235);
    backdrop-filter: blur(8px);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease-in-out;
}

.dark .stat-card {
    background: rgba(31, 41, 55, 0.9);
    border-color: rgb(55, 65, 81);
}

.stat-card:hover {
    transform: translateY(-2px);
}

.stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
}

.stat-icon.downloading {
    background: linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235));
}

.stat-icon.completed {
    background: linear-gradient(135deg, rgb(34, 197, 94), rgb(21, 128, 61));
}

.stat-icon.failed {
    background: linear-gradient(135deg, rgb(239, 68, 68), rgb(220, 38, 38));
}

.stat-icon.total {
    background: linear-gradient(135deg, rgb(107, 114, 128), rgb(75, 85, 99));
}

.stat-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: rgb(17, 24, 39);
    line-height: 1;
}

.dark .stat-value {
    color: rgb(255, 255, 255);
}

.stat-label {
    font-size: 0.875rem;
    color: rgb(107, 114, 128);
    font-weight: 500;
}

.dark .stat-label {
    color: rgb(156, 163, 175);
}

.dialog-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-label {
    font-weight: 500;
    color: rgb(55, 65, 81);
    font-size: 0.875rem;
}

.dark .field-label {
    color: rgb(209, 213, 219);
}

.path-input {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.checkbox-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.checkbox-label {
    font-size: 0.875rem;
    color: rgb(55, 65, 81);
}

.dark .checkbox-label {
    color: rgb(209, 213, 219);
}

.error-message {
    color: rgb(220, 38, 38);
    font-size: 0.75rem;
}

.dark .error-message {
    color: rgb(248, 113, 113);
}

.settings-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.settings-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.settings-section h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: rgb(17, 24, 39);
    margin: 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgb(229, 231, 235);
}

.dark .settings-section h3 {
    color: rgb(255, 255, 255);
    border-bottom-color: rgb(55, 65, 81);
}

.setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.setting-item label {
    font-size: 0.875rem;
    color: rgb(55, 65, 81);
    flex: 1;
}

.dark .setting-item label {
    color: rgb(209, 213, 219);
}

.setting-item :deep(.p-dropdown),
.setting-item :deep(.p-inputnumber) {
    min-width: 150px;
}
</style>
