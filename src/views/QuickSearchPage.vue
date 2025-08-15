<template>
    <div
        class="quick-search-page min-h-screen bg-black bg-opacity-50 backdrop-blur-sm flex items-start justify-center pt-20">
        <!-- 快速搜索组件 -->
        <QuickSearch ref="quickSearchRef" :use-portal="false" :always-visible="true" class="w-full max-w-2xl mx-4"
            @result-select="handleResultSelect" />
    </div>
</template>

<script setup lang="ts">
import QuickSearch from '@/components/business/QuickSearch.vue'
import type { SearchResult } from '@/utils/search'
import { closeQuickSearchWindow } from '@/utils/window-manager'
import { onMounted, ref } from 'vue'

const quickSearchRef = ref<InstanceType<typeof QuickSearch>>()

/**
 * 处理搜索结果选择
 */
const handleResultSelect = (result: SearchResult) => {
    console.log('选择搜索结果:', result)
    // 选择结果后关闭窗口
    handleClose()
}

/**
 * 关闭快速搜索窗口
 */
const handleClose = async () => {
    try {
        await closeQuickSearchWindow()
    } catch (error) {
        console.error('关闭快速搜索窗口失败:', error)
        // 备用方案：直接关闭当前窗口
        try {
            if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
                const { getCurrentWindow } = await import('@tauri-apps/api/window')
                const currentWindow = getCurrentWindow()
                await currentWindow.close()
            } else {
                window.close()
            }
        } catch (fallbackError) {
            console.error('备用关闭方案也失败:', fallbackError)
        }
    }
}/**
 * 监听键盘事件
 */
const handleKeyDown = (event: KeyboardEvent) => {
    // ESC 键关闭窗口
    if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
    }
}

onMounted(() => {
    // 自动聚焦到搜索框
    if (quickSearchRef.value) {
        quickSearchRef.value.show()
    }

    // 监听键盘事件
    window.addEventListener('keydown', handleKeyDown)

    // 组件卸载时清理事件监听器
    return () => {
        window.removeEventListener('keydown', handleKeyDown)
    }
})
</script>

<style scoped>
.quick-search-page {
    /* 确保页面覆盖整个窗口 */
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
}

/* 移除默认的布局边距 */
:deep(.quick-search-panel) {
    margin: 0;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
</style>
