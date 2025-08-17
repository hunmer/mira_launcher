<template>
    <Dialog
        :visible="visible"
        modal
        :header="title"
        class="w-[750px]"
        @update:visible="handleVisibleChange"
    >
        <!-- 主要内容区域 -->
        <div class="space-y-6 p-6">
            <!-- 快捷键输入 -->
            <div class="space-y-3">
                <IftaLabel>
                    <IconField class="w-full">
                        <InputIcon class="pi pi-keyboard" />
                        <KeyCaptureInput
                            v-if="conflictChecker"
                            v-model="formData.key"
                            placeholder="点击此处设置快捷键"
                            :conflict-checker="conflictChecker"
                            class="w-full key-capture-fixed-width"
                        />
                        <KeyCaptureInput
                            v-else
                            v-model="formData.key"
                            placeholder="点击此处设置快捷键"
                            class="w-full key-capture-fixed-width"
                        />
                    </IconField>
                    <label for="shortcut-key">快捷键组合</label>
                </IftaLabel>
                <small class="text-gray-500 dark:text-gray-400">
                    支持 Ctrl、Alt、Shift、Meta 等修饰键组合
                </small>
            </div>

            <!-- 执行动作选择 -->
            <div class="space-y-3">
                <IftaLabel>
                    <IconField class="w-full">
                        <FilterSelect
                            v-model="formData.actionId"
                            :options="availableActions"
                            option-label="name"
                            option-value="id"
                            placeholder="选择要执行的动作"
                            :loading="actionsLoading"
                            :show-clear="true"
                            class="w-full filter-select-full-width"
                        >
                            <template #option="{ option }">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-bolt text-orange-500" />
                                    <div>
                                        <div class="font-medium">
                                            {{ option.name }}
                                        </div>
                                        <small v-if="option.description" class="text-gray-500">
                                            {{ option.description }}
                                        </small>
                                    </div>
                                </div>
                            </template>
                        </FilterSelect>
                    </IconField>
                    <label for="action-select">执行动作</label>
                </IftaLabel>
                <small
                    v-if="availableActions.length === 0"
                    class="text-gray-500 dark:text-gray-400"
                >
                    <i class="pi pi-exclamation-triangle mr-1 text-amber-500" />
                    未检测到可用动作，请检查插件状态
                </small>
            </div>

            <!-- 快捷键类型选择 -->
            <div class="space-y-3">
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        <i class="pi pi-globe mr-2 text-purple-500" />
                        快捷键类型
                    </label>
                    <SelectButton
                        v-model="formData.type"
                        :options="shortcutTypes"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                    >
                        <template #option="{ option }">
                            <div class="flex items-center gap-2">
                                <i
                                    :class="
                                        option.value === 'global'
                                            ? 'pi pi-globe text-red-500'
                                            : 'pi pi-desktop text-blue-500'
                                    "
                                    style="padding-right: 10px"
                                />
                                <span>{{ option.label }}</span>
                            </div>
                        </template>
                    </SelectButton>
                </div>
                <small class="text-gray-500 dark:text-gray-400">
                    <span v-if="formData.type === 'global'">
                        全局快捷键在任何时候都可以触发
                    </span>
                    <span v-else>应用内快捷键仅在应用窗口激活时生效</span>
                </small>
            </div>

            <!-- 描述输入 -->
            <div class="space-y-3">
                <IftaLabel>
                    <IconField class="w-full">
                        <InputIcon class="pi pi-file-edit" />
                        <InputText
                            v-model="formData.description"
                            placeholder="为这个快捷键添加描述说明"
                            variant="filled"
                            class="w-full"
                        />
                    </IconField>
                    <label for="description">描述 (可选)</label>
                </IftaLabel>
                <small class="text-gray-500 dark:text-gray-400">
                    添加描述有助于您记住此快捷键的用途
                </small>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-between items-center px-4 py-2">
                <div class="flex gap-3">
                    <Button
                        label="取消"
                        icon="pi pi-times"
                        variant="text"
                        @click="handleCancel"
                    />
                    <Button
                        :label="mode === 'add' ? '添加' : '保存'"
                        :icon="mode === 'add' ? 'pi pi-plus' : 'pi pi-save'"
                        :disabled="!canSave"
                        @click="handleSave"
                    />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { FilterSelect, KeyCaptureInput } from '@/components/common'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import IftaLabel from 'primevue/iftalabel'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'
import { computed, onMounted, reactive, ref, watch } from 'vue'

interface ShortcutFormData {
    key: string
    actionId: string
    type: 'global' | 'application'
    description: string
}

interface ShortcutAction {
    id: string
    name: string
    description?: string
    category?: string
}

interface Props {
    visible: boolean
    mode: 'add' | 'edit'
    title: string
    initialData?: Partial<ShortcutFormData>
    availableActions: ShortcutAction[]
    conflictChecker?: (key: string) => string | null
}

interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'save', data: ShortcutFormData): void
    (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
    visible: false,
    mode: 'add',
    title: '快捷键设置',
    initialData: () => ({}),
})

const emit = defineEmits<Emits>()

// 状态管理
const actionsLoading = ref(false)

// 表单数据
const formData = reactive<ShortcutFormData>({
    key: '',
    actionId: '',
    type: 'application',
    description: '',
})

// 快捷键类型选项 - 用于 SelectButton
const shortcutTypes = [
    {
        label: '应用内',
        value: 'application',
    },
    {
        label: '全局',
        value: 'global',
    },
]

// 计算属性：是否可以保存
const canSave = computed(() => {
    return formData.key && formData.actionId && formData.type
})

// 监听初始数据变化，重置表单
watch(
    () => props.initialData,
    newData => {
        if (newData) {
            formData.key = newData.key || ''
            formData.actionId = newData.actionId || ''
            formData.type = newData.type || 'application'
            formData.description = newData.description || ''
        }
    },
    { immediate: true, deep: true },
)

// 监听显示状态变化，重置表单
watch(
    () => props.visible,
    newVisible => {
        if (newVisible && props.mode === 'add') {
            // 添加模式时重置表单
            formData.key = ''
            formData.actionId = ''
            formData.type = 'application'
            formData.description = ''
        }
    },
)

// 监听可用动作变化
watch(
    () => props.availableActions,
    newActions => {
        actionsLoading.value = false
        if (newActions.length === 0) {
            console.warn('[ShortcutDialog] No available actions detected')
        }
    },
    { immediate: true },
)

// 组件挂载时检查动作加载状态
onMounted(() => {
    if (props.availableActions.length === 0) {
        actionsLoading.value = true
        // 等待一段时间看是否有动作加载
        setTimeout(() => {
            actionsLoading.value = false
        }, 2000)
    }
})

/**
 * 处理显示状态变化
 */
const handleVisibleChange = (value: boolean) => {
    emit('update:visible', value)
}

/**
 * 处理保存
 */
const handleSave = () => {
    if (!canSave.value) return

    emit('save', { ...formData })
}

/**
 * 处理取消
 */
const handleCancel = () => {
    emit('cancel')
}
</script>

<style scoped>
/* 对话框样式优化 */
:deep(.p-dialog .p-dialog-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.5rem 0.5rem 0 0;
  padding: 1.25rem 1.5rem;
}

:deep(.p-dialog .p-dialog-header .p-dialog-title) {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
}

:deep(.p-dialog .p-dialog-header .p-dialog-title::before) {
  content: '⌨️';
  font-size: 1.25rem;
}

:deep(.p-dialog .p-dialog-content) {
  padding: 0;
  background-color: #fafbfc;
}

:deep(.p-dialog .p-dialog-footer) {
  padding: 1.25rem 1.5rem;
  background-color: #f8fafc;
  border-radius: 0 0 0.5rem 0.5rem;
  border-top: 1px solid #e2e8f0;
}

/* IftaLabel 样式优化 */
:deep(.p-iftalabel) {
  margin-bottom: 0.5rem;
}

:deep(.p-iftalabel label) {
  font-weight: 600;
  color: #374151;
  transition: all 0.2s ease;
}

/* IconField 样式 */
:deep(.p-iconfield .p-inputicon) {
  color: #6b7280;
}

:deep(.p-iconfield .p-inputtext:focus ~ .p-inputicon) {
  color: #4f46e5;
}

/* SelectButton 样式优化 */
:deep(.p-selectbutton) {
  width: 100%;
  display: flex;
}

:deep(.p-selectbutton .p-togglebutton) {
  flex: 1;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  background-color: #f8fafc;
  color: #374151;
  border: 1px solid #d1d5db;
}

:deep(.p-selectbutton .p-togglebutton:first-child) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

:deep(.p-selectbutton .p-togglebutton:last-child) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

:deep(.p-selectbutton .p-togglebutton:hover) {
  background-color: #f1f5f9;
  border-color: #94a3b8;
}

:deep(.p-selectbutton .p-togglebutton.p-togglebutton-checked) {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border-color: #4f46e5;
  color: #ffffff !important;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
  font-weight: 600;
}

/* 清除默认颜色 */
:deep(.p-togglebutton-checked .p-togglebutton-content) {
  background: unset !important;
  box-shadow: unset !important;
}

:deep(.p-selectbutton .p-togglebutton.p-togglebutton-checked .pi) {
  color: #ffffff !important;
}

/* FilterSelect 样式 */
:deep(.filter-select) {
  transition: all 0.2s ease;
}

:deep(.filter-select-full-width) {
  width: 100% !important;
}

:deep(.filter-select-full-width .p-select) {
  width: 100% !important;
}

:deep(.filter-select-full-width .p-select .p-select-label) {
  width: calc(100% - 3rem) !important;
}

/* KeyCaptureInput 固定宽度样式 */
:deep(.key-capture-fixed-width) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
}

:deep(.key-capture-fixed-width .p-inputtext) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
}

/* IconField 样式优化 */
:deep(.p-iconfield) {
  width: 100%;
  position: relative;
}

:deep(.p-iconfield.w-full) {
  width: 100% !important;
}

/* 输入框样式统一 */
:deep(.p-inputtext.p-variant-filled) {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  transition: all 0.2s ease;
}

:deep(.p-inputtext.p-variant-filled:focus) {
  background-color: white;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

/* 暗色主题适配 */
.dark :deep(.p-dialog .p-dialog-content) {
  background-color: #1e293b;
}

.dark :deep(.p-dialog .p-dialog-footer) {
  background-color: #1e293b;
  border-top-color: #334155;
}

.dark :deep(.p-iftalabel label) {
  color: #e5e7eb;
}

.dark :deep(.p-inputtext.p-variant-filled) {
  background-color: #374151;
  border-color: #4b5563;
  color: #f3f4f6;
}

.dark :deep(.p-inputtext.p-variant-filled:focus) {
  background-color: #4b5563;
  border-color: #6366f1;
}

.dark :deep(.p-iconfield .p-inputicon) {
  color: #9ca3af;
}

.dark :deep(.p-iconfield .p-inputtext:focus ~ .p-inputicon) {
  color: #a5b4fc;
}

/* 暗色主题 SelectButton 样式 */
.dark :deep(.p-selectbutton .p-togglebutton) {
  background-color: #374151;
  color: #e5e7eb;
  border-color: #4b5563;
}

.dark :deep(.p-selectbutton .p-togglebutton:hover) {
  background-color: #4b5563;
  border-color: #6b7280;
}

.dark :deep(.p-selectbutton .p-togglebutton.p-togglebutton-checked) {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border-color: #4f46e5;
  color: #ffffff !important;
}

.dark :deep(.p-selectbutton .p-togglebutton.p-togglebutton-checked .pi) {
  color: #ffffff !important;
}
</style>
