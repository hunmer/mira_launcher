<template>
    <div class="plugin-settings">
        <SettingPlan :default-value="['0', '1', '2', '3']">
            <SettingCard
                value="0"
                title="插件路径配置"
                icon="pi pi-folder"
                icon-color="text-blue-600 dark:text-blue-400"
            >
                <SettingItem
                    v-model="pluginPath"
                    title="插件目录路径"
                    tooltip="插件将从此目录加载。默认为应用程序目录下的 plugins 文件夹"
                    type="text"
                    placeholder="选择插件目录路径"
                    readonly
                />

                <SettingItem
                    title="浏览插件目录"
                    tooltip="选择自定义的插件目录位置"
                    type="button"
                    button-label="浏览"
                    button-icon="pi pi-folder-open"
                    @button-click="selectPluginDirectory"
                />
            </SettingCard>

            <SettingCard
                value="1"
                title="插件加载设置"
                icon="pi pi-cog"
                icon-color="text-green-600 dark:text-green-400"
            >
                <SettingItem
                    v-model="autoLoadPlugins"
                    title="自动加载插件"
                    tooltip="启动时自动加载插件目录中的所有插件"
                    type="text"
                    right-control="switch"
                    readonly
                />

                <SettingItem
                    v-model="hotReloadEnabled"
                    title="开发模式热重载"
                    tooltip="开发环境下监听插件文件变化并自动重载"
                    type="text"
                    right-control="switch"
                    readonly
                />

                <SettingItem
                    v-model="showPluginErrors"
                    title="插件错误处理"
                    tooltip="插件加载失败时显示详细错误信息"
                    type="text"
                    right-control="switch"
                    readonly
                />
            </SettingCard>

            <SettingCard
                value="2"
                title="插件安全设置"
                icon="pi pi-shield"
                icon-color="text-orange-600 dark:text-orange-400"
            >
                <SettingItem
                    v-model="verifySignature"
                    title="验证插件签名"
                    tooltip="只加载经过数字签名验证的插件"
                    type="text"
                    right-control="switch"
                    readonly
                />

                <SettingItem
                    v-model="sandboxMode"
                    title="沙箱模式"
                    tooltip="在受限环境中运行插件，增强安全性"
                    type="text"
                    right-control="switch"
                    readonly
                />
            </SettingCard>

            <SettingCard
                value="3"
                title="插件管理操作"
                icon="pi pi-wrench"
                icon-color="text-purple-600 dark:text-purple-400"
            >
                <SettingItem
                    title="重新扫描插件"
                    tooltip="重新扫描插件目录，发现新安装的插件"
                    type="button"
                    button-label="重新扫描"
                    button-icon="pi pi-refresh"
                    @button-click="rescanPlugins"
                />

                <SettingItem
                    title="应用设置"
                    tooltip="保存当前的插件设置配置"
                    type="button"
                    button-label="应用设置"
                    button-icon="pi pi-check"
                    button-severity="primary"
                    @button-click="applySettings"
                />

                <SettingItem
                    title="重置为默认值"
                    tooltip="重置所有插件设置为默认值"
                    type="button"
                    button-label="重置"
                    button-icon="pi pi-undo"
                    button-severity="secondary"
                    @button-click="resetToDefaults"
                />

                <SettingItem
                    title="插件统计"
                    tooltip="当前插件系统的状态统计"
                    type="text"
                    :model-value="`总计: ${pluginStats.total} | 活跃: ${pluginStats.active} | 错误: ${pluginStats.errors}`"
                    readonly
                />
            </SettingCard>
        </SettingPlan>
    </div>
</template>

<script setup lang="ts">
import { SettingCard, SettingItem, SettingPlan } from '@/components/settings'
import { computed, onMounted, ref } from 'vue'

// 插件设置状态
const pluginPath = ref('')
const autoLoadPlugins = ref(true)
const hotReloadEnabled = ref(true)
const showPluginErrors = ref(true)
const verifySignature = ref(false)
const sandboxMode = ref(false)

// 模拟插件统计（如果没有插件系统可用）
const pluginStats = computed(() => {
    return {
        total: 0,
        active: 0,
        inactive: 0,
        errors: 0,
    }
})

// 选择插件目录
const selectPluginDirectory = async () => {
    try {
        console.log('选择插件目录')
    // 这里可以实现目录选择逻辑
    } catch (error) {
        console.error('Failed to select directory:', error)
    }
}

// 应用设置
const applySettings = async () => {
    try {
        console.log('应用插件设置:', {
            pluginPath: pluginPath.value,
            autoLoadPlugins: autoLoadPlugins.value,
            hotReloadEnabled: hotReloadEnabled.value,
            showPluginErrors: showPluginErrors.value,
            verifySignature: verifySignature.value,
            sandboxMode: sandboxMode.value,
        })
    } catch (error) {
        console.error('Failed to apply settings:', error)
    }
}

// 重置为默认值
const resetToDefaults = () => {
    pluginPath.value = ''
    autoLoadPlugins.value = true
    hotReloadEnabled.value = true
    showPluginErrors.value = true
    verifySignature.value = false
    sandboxMode.value = false

    console.log('插件设置已重置为默认值')
}

// 重新扫描插件
const rescanPlugins = async () => {
    try {
        console.log('重新扫描插件')
    // 这里可以实现插件扫描逻辑
    } catch (error) {
        console.error('Failed to rescan plugins:', error)
    }
}

// 加载保存的设置
const loadSettings = () => {
    try {
        // 这里可以实现从配置文件加载设置的逻辑
        console.log('加载插件设置')
    } catch (error) {
        console.error('Failed to load settings:', error)
    }
}

onMounted(() => {
    loadSettings()
})
</script>

<style scoped>
.plugin-settings {
  max-width: 800px;
}
</style>