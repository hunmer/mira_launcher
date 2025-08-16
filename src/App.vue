<template>
    <NotificationContainer>
        <MainLayout
            @window-minimize="handleWindowEvent"
            @window-maximize="handleWindowEvent"
            @window-close="handleWindowEvent"
        />

        <!-- 快速搜索组件 -->
        <QuickSearch ref="quickSearchRef" />
    </NotificationContainer>
</template>

<script setup lang="ts">
import { PluginAutoStartService } from '@/plugins/core'
import { usePluginStore } from '@/stores/plugin'
import { useThemeStore } from '@/stores/theme'
import { getShortcutSystem } from '@/utils/shortcut-system'
import { onMounted, onUnmounted, ref } from 'vue'

// 布局组件导入
import MainLayout from '@/components/layout/MainLayout.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'

// Store
const themeStore = useThemeStore()
const pluginStore = usePluginStore()

// Plugin loading status for debugging
const pluginLoadingStatus = ref<any>(null)

// 窗口事件处理
const handleWindowEvent = () => {
    // 可以在这里添加额外的窗口事件处理逻辑
    console.log('窗口事件触发')
}

// 快速搜索事件处理
const handleShowQuickSearch = () => {
    // TODO:触发全局搜索
}

// 鍵盤快捷鍵處理
const handleKeydown = (event: KeyboardEvent) => {
    // Ctrl/Cmd + W: 關閉視窗
    if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
        event.preventDefault()
    // 窗口关闭事件会由 WindowControls 组件处理
    }

    // Ctrl/Cmd + M: 最小化視窗
    if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault()
    // 窗口最小化事件会由 WindowControls 组件处理
    }

    // F11: 全螢幕切換
    if (event.key === 'F11') {
        event.preventDefault()
    // 窗口最大化事件会由 WindowControls 组件处理
    }

    // Ctrl/Cmd + T: 切換主題
    if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        event.preventDefault()
        themeStore.toggleTheme()
    }
}

// 生命週期
onMounted(async () => {
    // 初始化主題
    themeStore.initTheme()

    // 註冊鍵盤事件
    window.addEventListener('keydown', handleKeydown)

    // 註冊快速搜索事件監聽
    window.addEventListener('show-quick-search', handleShowQuickSearch)

    // 監聽主題變化
    themeStore.applyTheme()

    // 初始化插件系统
    try {
        console.log('🔌 正在初始化插件系统...')
        await pluginStore.initialize({
            autoActivate: true,
            maxPlugins: 50,
        })
        console.log('✅ 插件系统初始化完成')

        // 自动发现和加载插件
        console.log('🔍 开始自动发现和加载插件...')
        const autoStartService = new PluginAutoStartService()
        const result = await autoStartService.discoverAndLoadPlugins()

        // Set the status for UI display
        pluginLoadingStatus.value = result

        console.log('📊 插件启动结果:', {
            发现: result.discovered,
            加载: result.loaded,
            注册: result.registered,
            激活: result.activated,
            错误数量: result.errors.length,
        })

        if (result.errors.length > 0) {
            console.warn('⚠️ 插件启动过程中的错误:', result.errors)
        }

    } catch (error) {
        console.error('❌ 插件系统初始化失败:', error)
    }

    console.log('🎉 Mira Launcher 初始化完成')
})

onUnmounted(async () => {
    // 清理鍵盤事件監聽器
    window.removeEventListener('keydown', handleKeydown)
    // 清理快速搜索事件監聽器
    window.removeEventListener('show-quick-search', handleShowQuickSearch)

    // 清理快捷键系统
    try {
        const shortcutSystem = getShortcutSystem()
        await shortcutSystem.destroy()
        console.log('🧹 快捷键系统已清理')
    } catch (error) {
        console.error('❌ 清理快捷键系统失败:', error)
    }
})
</script>
