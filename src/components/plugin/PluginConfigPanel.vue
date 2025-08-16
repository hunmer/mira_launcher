<template>
    <div class="plugin-config-panel">
        <div class="config-header">
            <h3>{{ plugin.name }} 配置</h3>
            <p class="config-description">
                {{ plugin.description }}
            </p>
        </div>

        <div class="config-content">
            <div
                v-if="!plugin.configs?.properties"
                class="no-config"
            >
                <i class="pi pi-info-circle" />
                <span>此插件没有可配置的选项</span>
            </div>

            <div
                v-else
                class="config-form"
            >
                <div
                    v-for="(property, key) in plugin.configs.properties"
                    :key="key"
                    class="config-item"
                >
                    <label
                        :for="`config-${key}`"
                        class="config-label"
                    >
                        {{ property.title || key }}
                        <span
                            v-if="property.description"
                            class="config-hint"
                        >
                            <i
                                v-tooltip="property.description"
                                class="pi pi-question-circle"
                            />
                        </span>
                    </label>

                    <!-- Boolean 配置 -->
                    <div
                        v-if="property.type === 'boolean'"
                        class="config-input"
                    >
                        <InputSwitch
                            :id="`config-${key}`"
                            :model-value="Boolean(configValues[key])"
                            @update:model-value="onConfigChange(key, $event)"
                        />
                    </div>

                    <!-- Number 配置 -->
                    <div
                        v-else-if="property.type === 'number'"
                        class="config-input"
                    >
                        <InputNumber
                            :id="`config-${key}`"
                            :model-value="Number(configValues[key] ?? 0)"
                            :min="property.minimum"
                            :max="property.maximum"
                            class="w-full"
                            @update:model-value="onConfigChange(key, $event)"
                        />
                    </div>

                    <!-- String 配置（枚举选择） -->
                    <div
                        v-else-if="property.type === 'string' && property.enum"
                        class="config-input"
                    >
                        <Dropdown
                            :id="`config-${key}`"
                            :model-value="String(configValues[key] ?? '')"
                            :options="getEnumOptions(property.enum)"
                            option-label="label"
                            option-value="value"
                            class="w-full"
                            @update:model-value="onConfigChange(key, $event)"
                        />
                    </div>

                    <!-- String 配置（文本输入） -->
                    <div
                        v-else-if="property.type === 'string'"
                        class="config-input"
                    >
                        <InputText
                            :id="`config-${key}`"
                            :model-value="String(configValues[key] ?? '')"
                            class="w-full"
                            @update:model-value="onConfigChange(key, $event)"
                        />
                    </div>

                    <!-- 其他类型显示为只读 -->
                    <div
                        v-else
                        class="config-input"
                    >
                        <span class="readonly-value">{{ configValues[key] }}</span>
                        <small class="text-muted">({{ property.type }} 类型暂不支持编辑)</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="config-actions">
            <Button
                label="重置为默认值"
                severity="secondary"
                icon="pi pi-refresh"
                :disabled="!hasChanges"
                @click="resetToDefaults"
            />
            <Button
                label="保存配置"
                icon="pi pi-check"
                :disabled="!hasChanges"
                @click="saveConfig"
            />
        </div>

        <div
            v-if="showTestSection"
            class="config-test"
        >
            <Divider />
            <h4>配置测试</h4>
            <div class="test-actions">
                <Button
                    label="测试配置"
                    icon="pi pi-play"
                    :loading="testing"
                    @click="testConfig"
                />
                <Button
                    label="重置测试"
                    severity="secondary"
                    icon="pi pi-times"
                    :disabled="!testResult"
                    @click="resetTest"
                />
            </div>

            <div
                v-if="testResult"
                class="test-result"
                :class="testResult.success ? 'success' : 'error'"
            >
                <i :class="testResult.success ? 'pi pi-check-circle' : 'pi pi-times-circle'" />
                <span>{{ testResult.message }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BasePlugin } from '@/plugins/core/BasePlugin'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import { computed, onMounted, ref, watch } from 'vue'

interface Props {
    plugin: BasePlugin
    showTestSection?: boolean
}

interface Emits {
    (e: 'config-changed', config: Record<string, unknown>): void
    (e: 'config-saved', config: Record<string, unknown>): void
    (e: 'config-tested', result: { success: boolean; message: string }): void
}

const props = withDefaults(defineProps<Props>(), {
    showTestSection: true,
})

const emit = defineEmits<Emits>()

// 响应式状态
const configValues = ref<Record<string, unknown>>({})
const originalValues = ref<Record<string, unknown>>({})
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

// 计算属性
const hasChanges = computed(() => {
    return Object.keys(configValues.value).some(key =>
        configValues.value[key] !== originalValues.value[key],
    )
})

// 方法
const initializeConfig = () => {
    if (!props.plugin.configs?.properties) return

    const defaults = props.plugin.configs.defaults || {}
    const initialValues: Record<string, unknown> = {}

    Object.keys(props.plugin.configs.properties).forEach(key => {
        const property = props.plugin.configs!.properties![key]
        if (property) {
            initialValues[key] = defaults[key] ?? property.default ?? getDefaultValueForType(property.type)
        }
    })

    configValues.value = { ...initialValues }
    originalValues.value = { ...initialValues }
}

const getDefaultValueForType = (type: string): unknown => {
    switch (type) {
    case 'boolean': return false
    case 'number': return 0
    case 'string': return ''
    case 'array': return []
    case 'object': return {}
    default: return null
    }
}

const getEnumOptions = (enumValues: unknown[]) => {
    return enumValues.map(value => ({
        label: String(value),
        value,
    }))
}

const onConfigChange = (key: string, value: unknown) => {
    configValues.value[key] = value
    emit('config-changed', { ...configValues.value })
}

const resetToDefaults = () => {
    initializeConfig()
    emit('config-changed', { ...configValues.value })
    testResult.value = null
}

const saveConfig = () => {
    originalValues.value = { ...configValues.value }
    emit('config-saved', { ...configValues.value })

    // 显示保存成功提示
    testResult.value = {
        success: true,
        message: '配置已保存',
    }

    setTimeout(() => {
        testResult.value = null
    }, 3000)
}

const testConfig = async () => {
    testing.value = true
    testResult.value = null

    try {
        // 模拟配置测试
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 验证配置值
        const isValid = validateConfig()

        testResult.value = {
            success: isValid,
            message: isValid ? '配置测试通过' : '配置验证失败',
        }

        emit('config-tested', testResult.value)

    } catch (error) {
        testResult.value = {
            success: false,
            message: `测试失败: ${error}`,
        }
    } finally {
        testing.value = false
    }
}

const validateConfig = (): boolean => {
    if (!props.plugin.configs?.properties) return true

    return Object.entries(props.plugin.configs.properties).every(([key, property]) => {
        const value = configValues.value[key]

        // 检查类型
        if (property.type === 'number' && typeof value !== 'number') return false
        if (property.type === 'boolean' && typeof value !== 'boolean') return false
        if (property.type === 'string' && typeof value !== 'string') return false

        // 检查范围
        if (property.type === 'number') {
            if (property.minimum !== undefined && (value as number) < property.minimum) return false
            if (property.maximum !== undefined && (value as number) > property.maximum) return false
        }

        // 检查枚举值
        if (property.enum && !property.enum.includes(value)) return false

        return true
    })
}

const resetTest = () => {
    testResult.value = null
}

// 生命周期
onMounted(() => {
    initializeConfig()
})

// 监听插件变化
watch(() => props.plugin, () => {
    initializeConfig()
}, { deep: true })
</script>

<style scoped>
.plugin-config-panel {
    @apply space-y-6;
}

.config-header h3 {
    @apply text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2;
}

.config-description {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

.no-config {
    @apply flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400;
}

.config-form {
    @apply space-y-4;
}

.config-item {
    @apply space-y-2;
}

.config-label {
    @apply flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300;
}

.config-hint {
    @apply text-gray-400 hover:text-gray-600 transition-colors;
}

.config-input {
    @apply w-full;
}

.readonly-value {
    @apply px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded border text-gray-600 dark:text-gray-400;
}

.config-actions {
    @apply flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700;
}

.config-test {
    @apply pt-4;
}

.config-test h4 {
    @apply text-lg font-medium text-gray-800 dark:text-gray-200 mb-4;
}

.test-actions {
    @apply flex gap-2 mb-4;
}

.test-result {
    @apply flex items-center gap-2 p-3 rounded-lg;
}

.test-result.success {
    @apply bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400;
}

.test-result.error {
    @apply bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400;
}
</style>
