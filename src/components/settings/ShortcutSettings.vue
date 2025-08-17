<template>
    <div class="space-y-6">
        <SettingPlan :default-value="['0', '1', '2']">
            <!-- 系统快捷键设置 -->
            <SettingCard
                value="0"
                title="系统快捷键"
                icon="pi pi-key"
                icon-color="text-yellow-600 dark:text-yellow-400"
            >
                <!-- 自定义快捷键设置组件 -->
                <div class="space-y-4">
                    <ShortcutSettingItem
                        v-model="settingsStore.settings.shortcuts.globalHotkey"
                        title="全局唤醒快捷键"
                        tooltip="快速显示/隐藏启动器窗口的全局快捷键"
                        :shortcut-type="'global'"
                        :show-delete-button="true"
                        :is-built-in="true"
                        @change="saveShortcutSetting('globalHotkey', $event)"
                        @delete="saveShortcutSetting('globalHotkey', '')"
                    />

                    <ShortcutSettingItem
                        v-model="settingsStore.settings.shortcuts.searchHotkey"
                        title="搜索快捷键"
                        tooltip="启动搜索功能的快捷键"
                        :shortcut-type="'application'"
                        :show-delete-button="true"
                        :is-built-in="true"
                        @change="saveShortcutSetting('searchHotkey', $event)"
                        @delete="saveShortcutSetting('searchHotkey', '')"
                    />

                    <ShortcutSettingItem
                        v-model="settingsStore.settings.shortcuts.quickSearchHotkey"
                        title="快速搜索快捷键"
                        tooltip="打开快速搜索面板"
                        :shortcut-type="'application'"
                        :show-delete-button="true"
                        :is-built-in="true"
                        @change="saveShortcutSetting('quickSearchHotkey', $event)"
                        @delete="saveShortcutSetting('quickSearchHotkey', '')"
                    />

                    <ShortcutSettingItem
                        v-model="settingsStore.settings.shortcuts.settingsHotkey"
                        title="设置页面快捷键"
                        tooltip="打开设置页面的快捷键"
                        :shortcut-type="'application'"
                        :show-delete-button="true"
                        :is-built-in="true"
                        @change="saveShortcutSetting('settingsHotkey', $event)"
                        @delete="saveShortcutSetting('settingsHotkey', '')"
                    />

                    <ShortcutSettingItem
                        v-model="settingsStore.settings.shortcuts.homeHotkey"
                        title="首页快捷键"
                        tooltip="快速跳转到首页"
                        :shortcut-type="'application'"
                        :show-delete-button="true"
                        :is-built-in="true"
                        @change="saveShortcutSetting('homeHotkey', $event)"
                        @delete="saveShortcutSetting('homeHotkey', '')"
                    />

                    <ShortcutSettingItem
                        v-model="settingsStore.settings.shortcuts.applicationsHotkey"
                        title="应用管理快捷键"
                        tooltip="快速跳转到应用管理页面"
                        :shortcut-type="'application'"
                        :show-delete-button="true"
                        :is-built-in="true"
                        @change="saveShortcutSetting('applicationsHotkey', $event)"
                        @delete="saveShortcutSetting('applicationsHotkey', '')"
                    />

                    <ShortcutSettingItem
                        v-model="settingsStore.settings.shortcuts.pluginsHotkey"
                        title="插件管理快捷键"
                        tooltip="快速跳转到插件管理页面"
                        :shortcut-type="'application'"
                        :show-delete-button="true"
                        :is-built-in="true"
                        @change="saveShortcutSetting('pluginsHotkey', $event)"
                        @delete="saveShortcutSetting('pluginsHotkey', '')"
                    />

                    <ShortcutSettingItem
                        v-model="settingsStore.settings.shortcuts.exitHotkey"
                        title="退出应用快捷键"
                        tooltip="退出应用程序的快捷键"
                        :shortcut-type="'global'"
                        :show-delete-button="true"
                        :is-built-in="true"
                        @change="saveShortcutSetting('exitHotkey', $event)"
                        @delete="saveShortcutSetting('exitHotkey', '')"
                    />
                </div>
            </SettingCard>

            <!-- 自定义快捷键管理 -->
            <SettingCard
                value="1"
                title="自定义快捷键"
                icon="pi pi-plus"
                icon-color="text-blue-600 dark:text-blue-400"
            >
                <!-- 添加新快捷键按钮 -->
                <div class="mb-4">
                    <Button
                        label="添加自定义快捷键"
                        icon="pi pi-plus"
                        size="small"
                        @click="showAddShortcutDialog = true"
                    />
                </div>

                <!-- 自定义快捷键列表 -->
                <div
                    v-if="customShortcuts.length === 0"
                    class="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                    <i class="pi pi-keyboard text-3xl mb-2" />
                    <p>暂无自定义快捷键</p>
                    <p class="text-sm">
                        点击上方按钮添加您的第一个自定义快捷键
                    </p>
                </div>

                <div v-else class="space-y-4">
                    <ShortcutSettingItem
                        v-for="(shortcut, index) in customShortcuts"
                        :key="shortcut.id"
                        v-model="shortcut.key"
                        :title="getActionName(shortcut.actionId)"
                        :tooltip="shortcut.description || '自定义快捷键'"
                        :shortcut-type="shortcut.type"
                        :show-delete-button="true"
                        @change="updateCustomShortcut(index, $event)"
                        @delete="removeShortcut(index)"
                    />
                </div>
            </SettingCard>

            <!-- 鼠标设置 -->
            <SettingCard
                value="2"
                title="鼠标设置"
                icon="pi pi-mouse"
                icon-color="text-teal-600 dark:text-teal-400"
            >
                <SettingItem
                    v-model="doubleClickToLaunch"
                    title="双击启动应用"
                    tooltip="双击应用图标启动应用程序"
                    type="text"
                    right-control="switch"
                    @update:model-value="saveDoubleClickToLaunch"
                />

                <SettingItem
                    v-model="enableContextMenu"
                    title="右键菜单"
                    tooltip="启用应用图标的右键上下文菜单"
                    type="text"
                    right-control="switch"
                    @update:model-value="saveEnableContextMenu"
                />
            </SettingCard>
        </SettingPlan>

        <!-- 添加快捷键对话框 -->
        <ShortcutDialog
            v-model:visible="showAddShortcutDialog"
            mode="add"
            title="添加自定义快捷键"
            :available-actions="availableActions"
            :conflict-checker="key => checkShortcutConflict(key, 'application')"
            @save="handleAddShortcut"
            @cancel="cancelAddShortcut"
        />

        <!-- 编辑快捷键对话框 -->
        <ShortcutDialog
            v-model:visible="showEditShortcutDialog"
            mode="edit"
            title="编辑自定义快捷键"
            :initial-data="editingShortcut"
            :available-actions="availableActions"
            :conflict-checker="
                key => checkShortcutConflictForEdit(key, editingShortcut.type)
            "
            @save="handleSaveEditShortcut"
            @cancel="cancelEditShortcut"
        />
    </div>
</template>

<script setup lang="ts">
import { SettingCard, SettingItem, SettingPlan } from '@/components/settings'
import { type ShortcutAction } from '@/plugins/api/ShortcutAPI'
import { useSettingsStore } from '@/stores/settings'
import { getShortcutSystem } from '@/utils/shortcut-system'
import Button from 'primevue/button'
import { onMounted, ref } from 'vue'
import ShortcutDialog from './ShortcutDialog.vue'
import ShortcutSettingItem from './ShortcutSettingItem.vue'

const settingsStore = useSettingsStore()

// 获取全局快捷键系统
const shortcutSystem = getShortcutSystem()
let shortcutManager = shortcutSystem.getShortcutManager()

// 鼠标设置
const doubleClickToLaunch = ref(true)
const enableContextMenu = ref(true)

// 自定义快捷键
const customShortcuts = ref<
    Array<{
        id: string
        key: string
        actionId: string
        type: 'global' | 'application'
        description?: string
    }>
>([])

// 对话框状态
const showAddShortcutDialog = ref(false)
const showEditShortcutDialog = ref(false)
const editingShortcut = ref({
    id: '',
    key: '',
    actionId: '',
    type: 'application' as 'global' | 'application',
    description: '',
})
const editingIndex = ref(-1)

// 可用的动作列表
const availableActions = ref<ShortcutAction[]>([])

/**
 * 确保快捷键管理器可用
 */
const ensureShortcutManager = async (): Promise<boolean> => {
    if (!shortcutManager) {
        shortcutManager = shortcutSystem.getShortcutManager()

        if (!shortcutManager) {
            console.log('[ShortcutSettings] Initializing shortcut system...')
            await shortcutSystem.initialize()
            shortcutManager = shortcutSystem.getShortcutManager()
        }
    }

    return shortcutManager !== null
}

// 快捷键类型选项
const shortcutTypes = [
    { label: '应用内', value: 'application' },
    { label: '全局', value: 'global' },
]

/**
 * 检查快捷键冲突
 */
const checkShortcutConflict = (
    key: string,
    type: 'global' | 'application',
): string | null => {
    if (!key) return null

    try {
        // 检查系统快捷键冲突
        const systemShortcuts = settingsStore.settings.shortcuts
        for (const [name, value] of Object.entries(systemShortcuts)) {
            if (value === key) {
                return `与系统快捷键 "${name}" 冲突`
            }
        }

        // 检查自定义快捷键冲突
        const conflict = customShortcuts.value.find(
            shortcut => shortcut.key === key && shortcut.type === type,
        )
        if (conflict) {
            return '与自定义快捷键冲突'
        }

        // 使用快捷键管理器检查冲突
        if (shortcutManager && shortcutManager.hasConflict(key)) {
            return '快捷键已被其他功能使用'
        }

        return null
    } catch (error) {
        console.error('检查快捷键冲突时出错:', error)
        return null
    }
}

/**
 * 获取动作名称
 */
const getActionName = (actionId: string): string => {
    const action = availableActions.value.find(a => a.id === actionId)
    return action?.name || actionId
}

/**
 * 保存系统快捷键设置
 */
const saveShortcutSetting = async (
    key: keyof typeof settingsStore.settings.shortcuts,
    value: string,
) => {
    try {
        settingsStore.settings.shortcuts[key] = value
        await settingsStore.saveSettings()

        // 重新加载快捷键系统配置
        await shortcutSystem.reloadShortcuts()

        console.log(`保存快捷键设置 ${key}:`, value)
    } catch (error) {
        console.error('保存快捷键设置失败:', error)
    }
}

/**
 * 处理添加快捷键
 */
const handleAddShortcut = async (data: any) => {
    if (!(await ensureShortcutManager())) {
        console.error(
            '[ShortcutSettings] Cannot add shortcut: shortcut manager not available',
        )
        return
    }

    const conflict = checkShortcutConflict(data.key, data.type)
    if (conflict) {
        console.warn('快捷键冲突:', conflict)
        return
    }

    try {
        const shortcutId = shortcutManager!.registerShortcutWithAction(
            data.key,
            data.actionId,
            { shortcutType: data.type },
        )

        // 添加到 SettingsStore
        await settingsStore.addCustomShortcut({
            key: data.key,
            actionId: data.actionId,
            type: data.type,
            enabled: true,
            description: data.description,
        })

        customShortcuts.value.push({
            id: shortcutId,
            key: data.key,
            actionId: data.actionId,
            type: data.type,
            description: data.description,
        })

        // 关闭对话框
        showAddShortcutDialog.value = false

        console.log('添加自定义快捷键成功')
    } catch (error) {
        console.error('添加自定义快捷键失败:', error)
    }
}

/**
 * 处理保存编辑的快捷键
 */
const handleSaveEditShortcut = async (data: any) => {
    if (editingIndex.value === -1 || !(await ensureShortcutManager())) return

    const conflict = checkShortcutConflictForEdit(data.key, data.type)
    if (conflict) {
        console.warn('快捷键冲突:', conflict)
        return
    }

    try {
        const oldShortcut = customShortcuts.value[editingIndex.value]
        if (!oldShortcut) return

        // 注销旧快捷键
        shortcutManager!.unregister(oldShortcut.id)

        // 注册新快捷键
        const shortcutId = shortcutManager!.registerShortcutWithAction(
            data.key,
            data.actionId,
            { shortcutType: data.type },
        )

        // 更新 SettingsStore
        await settingsStore.removeCustomShortcut(oldShortcut.id)
        await settingsStore.addCustomShortcut({
            key: data.key,
            actionId: data.actionId,
            type: data.type,
            enabled: true,
            description: data.description,
        })

        // 更新本地数组
        customShortcuts.value[editingIndex.value] = {
            id: shortcutId,
            key: data.key,
            actionId: data.actionId,
            type: data.type,
            description: data.description,
        }

        // 关闭对话框
        showEditShortcutDialog.value = false
        editingIndex.value = -1

        console.log('编辑快捷键成功')
    } catch (error) {
        console.error('编辑快捷键失败:', error)
    }
}

/**
 * 更新自定义快捷键
 */
const updateCustomShortcut = async (index: number, newKey: string) => {
    const shortcut = customShortcuts.value[index]
    if (!shortcut || !(await ensureShortcutManager())) return

    // 检查冲突
    const conflict = checkShortcutConflict(newKey, shortcut.type)
    if (conflict) {
        console.warn('快捷键冲突:', conflict)
        return
    }

    try {
        // 注销旧快捷键
        shortcutManager!.unregister(shortcut.id)

        // 注册新快捷键
        const shortcutId = shortcutManager!.registerShortcutWithAction(
            newKey,
            shortcut.actionId,
            { shortcutType: shortcut.type },
        )

        // 更新 SettingsStore
        await settingsStore.removeCustomShortcut(shortcut.id)
        const updateData: any = {
            key: newKey,
            actionId: shortcut.actionId,
            type: shortcut.type,
            enabled: true,
        }
        if (shortcut.description) {
            updateData.description = shortcut.description
        }
        await settingsStore.addCustomShortcut(updateData)

        // 更新本地数组
        customShortcuts.value[index] = {
            ...shortcut,
            id: shortcutId,
            key: newKey,
        }

        console.log('更新自定义快捷键成功')
    } catch (error) {
        console.error('更新自定义快捷键失败:', error)
    }
}

/**
 * 编辑快捷键
 */
const editShortcut = (shortcut: any, index: number) => {
    editingShortcut.value = {
        id: shortcut.id,
        key: shortcut.key,
        actionId: shortcut.actionId,
        type: shortcut.type,
        description: shortcut.description || '',
    }
    editingIndex.value = index
    showEditShortcutDialog.value = true
}

/**
 * 取消添加快捷键
 */
const cancelAddShortcut = () => {
    showAddShortcutDialog.value = false
}

/**
 * 取消编辑快捷键
 */
const cancelEditShortcut = () => {
    showEditShortcutDialog.value = false
    editingShortcut.value = {
        id: '',
        key: '',
        actionId: '',
        type: 'application',
        description: '',
    }
    editingIndex.value = -1
}

/**
 * 保存编辑的快捷键
 */
const saveEditShortcut = async () => {
    if (!shortcutManager || editingIndex.value === -1) return

    const conflict = checkShortcutConflictForEdit(
        editingShortcut.value.key,
        editingShortcut.value.type,
    )
    if (conflict) {
        console.warn('快捷键冲突:', conflict)
        return
    }

    try {
        const oldShortcut = customShortcuts.value[editingIndex.value]
        if (!oldShortcut) return

        // 注销旧快捷键
        shortcutManager.unregister(oldShortcut.id)

        // 注册新快捷键
        const shortcutId = shortcutManager.registerShortcutWithAction(
            editingShortcut.value.key,
            editingShortcut.value.actionId,
            { shortcutType: editingShortcut.value.type },
        )

        // 更新 SettingsStore
        await settingsStore.removeCustomShortcut(oldShortcut.id)
        await settingsStore.addCustomShortcut({
            key: editingShortcut.value.key,
            actionId: editingShortcut.value.actionId,
            type: editingShortcut.value.type,
            enabled: true,
            description: editingShortcut.value.description,
        })

        // 更新本地数组
        customShortcuts.value[editingIndex.value] = {
            id: shortcutId,
            key: editingShortcut.value.key,
            actionId: editingShortcut.value.actionId,
            type: editingShortcut.value.type,
            description: editingShortcut.value.description,
        }

        // 关闭对话框
        showEditShortcutDialog.value = false
        editingIndex.value = -1

        console.log('编辑快捷键成功')
    } catch (error) {
        console.error('编辑快捷键失败:', error)
    }
}

/**
 * 检查编辑时的快捷键冲突（排除当前编辑的快捷键）
 */
const checkShortcutConflictForEdit = (
    key: string,
    type: 'global' | 'application',
): string | null => {
    if (!key) return null

    try {
        // 检查系统快捷键冲突
        const systemShortcuts = settingsStore.settings.shortcuts
        for (const [name, value] of Object.entries(systemShortcuts)) {
            if (value === key) {
                return `与系统快捷键 "${name}" 冲突`
            }
        }

        // 检查自定义快捷键冲突（排除当前编辑的快捷键）
        const conflict = customShortcuts.value.find(
            (shortcut, index) =>
                shortcut.key === key &&
                shortcut.type === type &&
                index !== editingIndex.value,
        )
        if (conflict) {
            return '与自定义快捷键冲突'
        }

        return null
    } catch (error) {
        console.error('检查快捷键冲突时出错:', error)
        return null
    }
}

/**
 * 删除快捷键
 */
const removeShortcut = async (index: number) => {
    const shortcut = customShortcuts.value[index]
    if (!shortcut || !(await ensureShortcutManager())) return

    try {
        shortcutManager!.unregister(shortcut.id)

        // 从 SettingsStore 中移除
        await settingsStore.removeCustomShortcut(shortcut.id)

        customShortcuts.value.splice(index, 1)
        console.log('删除快捷键成功')
    } catch (error) {
        console.error('删除快捷键失败:', error)
    }
}

/**
 * 保存鼠标设置
 */
const saveDoubleClickToLaunch = () => {
    console.log('保存双击启动设置:', doubleClickToLaunch.value)
}

const saveEnableContextMenu = () => {
    console.log('保存右键菜单设置:', enableContextMenu.value)
}

/**
 * 加载可用动作
 */
const loadAvailableActions = async () => {
    console.log('[ShortcutSettings] Loading available actions...')

    try {
        if (!(await ensureShortcutManager())) {
            console.error(
                '[ShortcutSettings] Shortcut manager is still null after initialization',
            )
            availableActions.value = []
            return
        }

        // 获取系统动作
        const systemActions = shortcutManager!.getAvailableActions()
        console.log(
            '[ShortcutSettings] System actions loaded:',
            systemActions.length,
        )

        availableActions.value = systemActions

        if (availableActions.value.length === 0) {
            console.warn(
                '[ShortcutSettings] No actions available, trying to reload defaults...',
            )
            // 尝试重新加载默认动作
            shortcutManager!.loadDefaultShortcuts()
            availableActions.value = shortcutManager!.getAvailableActions()
        }

        console.log('[ShortcutSettings] Available actions:', availableActions.value)
    } catch (error) {
        console.error('[ShortcutSettings] Failed to load available actions:', error)
        availableActions.value = []
    }
}

/**
 * 加载默认快捷键
 */
const loadDefaultShortcuts = async () => {
    try {
        if (await ensureShortcutManager()) {
            shortcutManager!.loadDefaultShortcuts()
        }
    } catch (error) {
        console.error('加载默认快捷键失败:', error)
    }
}

/**
 * 加载自定义快捷键
 */
const loadCustomShortcuts = () => {
    try {
        const enabledShortcuts = settingsStore.getEnabledCustomShortcuts()
        customShortcuts.value = enabledShortcuts.map(shortcut => {
            const item: {
                id: string
                key: string
                actionId: string
                type: 'global' | 'application'
                description?: string
            } = {
                id: shortcut.id || crypto.randomUUID(),
                key: shortcut.key,
                actionId: shortcut.actionId,
                type: shortcut.type,
            }

            if (shortcut.description) {
                item.description = shortcut.description
            }

            return item
        })
    } catch (error) {
        console.error('加载自定义快捷键失败:', error)
    }
}

// 组件挂载时加载设置
onMounted(async () => {
    console.log('[ShortcutSettings] Component mounted, loading settings...')

    try {
        await settingsStore.loadSettings()
        console.log('[ShortcutSettings] Settings loaded')

        await loadAvailableActions()
        console.log(
            '[ShortcutSettings] Available actions:',
            availableActions.value.length,
        )

        loadDefaultShortcuts()
        loadCustomShortcuts()

        console.log('[ShortcutSettings] All settings loaded successfully')
    } catch (error) {
        console.error(
            '[ShortcutSettings] Error during component initialization:',
            error,
        )
    }
})
</script>

<style scoped>
/* 设置项样式通过组件实现，不需要额外样式 */
</style>

<style scoped></style>
