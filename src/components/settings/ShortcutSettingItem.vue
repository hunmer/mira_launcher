<template>
    <div class="setting-item">
        <InputGroup class="w-full no-border">
            <!-- 快捷键类型标记（放在最前面） -->
            <InputGroupAddon v-if="shortcutType" class="border-0">
                <div class="px-3 py-2">
                    <Badge
                        :value="shortcutType === 'global' ? '全局' : '应用内'"
                        :severity="shortcutType === 'global' ? 'info' : 'secondary'"
                        size="small"
                    />
                </div>
            </InputGroupAddon>

            <!-- 标题部分 -->
            <InputGroupAddon class="bg-gray-50 dark:bg-gray-700 border-0">
                <div class="flex items-center gap-2 px-3 py-2 min-w-0">
                    <i
                        v-if="icon"
                        :class="[icon, iconColor]"
                        class="flex-shrink-0"
                    />
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                        <span
                            class="font-medium text-gray-900 dark:text-white text-sm truncate"
                        >
                            {{ title }}
                        </span>
                        <i
                            v-if="tooltip"
                            v-tooltip.top="tooltip"
                            class="pi pi-info-circle text-gray-400 hover:text-blue-500 cursor-help transition-colors text-sm flex-shrink-0"
                            style="margin-left: 8px"
                        />
                    </div>
                </div>
            </InputGroupAddon>

            <!-- 快捷键输入部分（填满宽度） -->
            <InputGroupAddon class="flex-1 border-0 p-0 fill-width">
                <IftaLabel class="w-full">
                    <KeyCaptureInput
                        v-if="conflictChecker"
                        v-model="inputValue"
                        :conflict-checker="conflictChecker"
                        class="w-full shortcut-input"
                        @change="handleChange"
                        @conflict="handleConflict"
                        @focus="handleFocus"
                        @blur="handleBlur"
                    />
                    <KeyCaptureInput
                        v-else
                        v-model="inputValue"
                        class="w-full shortcut-input"
                        @change="handleChange"
                        @conflict="handleConflict"
                        @focus="handleFocus"
                        @blur="handleBlur"
                    />
                    <label>{{ placeholder || '点击设置快捷键' }}</label>
                </IftaLabel>
            </InputGroupAddon>

            <!-- 操作按钮（根据isBuiltIn属性控制显示） -->
            <InputGroupAddon v-if="showDeleteButton && !isBuiltIn" class="border-0">
                <Button
                    v-tooltip.top="'清除快捷键'"
                    icon="pi pi-trash"
                    size="small"
                    variant="text"
                    severity="danger"
                    class="px-2 py-2"
                    @click="handleDelete"
                />
            </InputGroupAddon>
        </InputGroup>

        <!-- 冲突提示 -->
        <div
            v-if="conflictMessage"
            class="text-red-500 text-sm mt-1 flex items-center gap-1 px-3"
        >
            <i class="pi pi-exclamation-triangle" />
            <span>{{ conflictMessage }}</span>
        </div>
    </div>
</template>
1
<script setup lang="ts">
import { KeyCaptureInput } from '@/components/common'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import IftaLabel from 'primevue/iftalabel'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import { ref, watch } from 'vue'

interface Props {
    title: string
    tooltip?: string
    icon?: string
    iconColor?: string
    modelValue?: string
    placeholder?: string
    shortcutType?: 'global' | 'application'
    conflictChecker?: (key: string) => string | null
    showDeleteButton?: boolean
    isBuiltIn?: boolean
}

interface Emits {
    (e: 'update:modelValue', value: string): void
    (e: 'change', value: string): void
    (e: 'conflict', conflict: string | null): void
    (e: 'delete'): void
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    placeholder: '点击设置快捷键',
    showDeleteButton: false,
    isBuiltIn: false,
})

const emit = defineEmits<Emits>()

const inputValue = ref(props.modelValue)
const conflictMessage = ref<string | null>(null)
const isFocused = ref(false)

// 监听外部值变化
watch(
    () => props.modelValue,
    newValue => {
        inputValue.value = newValue
    },
    { immediate: true },
)

// 监听内部值变化
watch(
    inputValue,
    newValue => {
        emit('update:modelValue', newValue)
    },
    { flush: 'sync' },
)

/**
 * 处理值变化
 */
const handleChange = (value: string) => {
    if (inputValue.value !== value) {
        inputValue.value = value
        emit('change', value)
    }
}

/**
 * 处理冲突检测
 */
const handleConflict = (conflict: string | null) => {
    conflictMessage.value = conflict
    emit('conflict', conflict)
}

/**
 * 处理删除操作
 */
const handleDelete = () => {
    inputValue.value = ''
    emit('delete')
}

/**
 * 处理输入框聚焦
 */
const handleFocus = () => {
    isFocused.value = true
}

/**
 * 处理输入框失焦
 */
const handleBlur = () => {
    isFocused.value = false
}
</script>

<style scoped>
.setting-item {
  margin-bottom: 4px;
  width: 100%;
}

/* 取消 InputGroup 边框 */
.setting-item :deep(.p-inputgroup) {
  width: 100% !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  background: transparent !important;
}

.setting-item :deep(.p-inputgroup.no-border) {
  border: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  background: transparent !important;
}

.setting-item :deep(.p-inputgroup .p-inputgroup-addon) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 移除所有可能的边框样式 */
.setting-item :deep(.p-inputgroup),
.setting-item :deep(.p-inputgroup *) {
  border: 0 !important;
  box-shadow: none !important;
  outline: none !important;
}

/* 填满宽度的样式 */
.setting-item :deep(.fill-width) {
  flex: 1 1 0% !important;
  width: 1% !important;
}

.setting-item :deep(.key-capture-input) {
  width: 100% !important;
  flex: 1 !important;
}

.setting-item :deep(.key-capture-input .p-inputtext) {
  border-radius: 0 !important;
  border: 0 !important;
  width: 100% !important;
}

/* IftaLabel 样式 */
.setting-item :deep(.p-iftalabel) {
  width: 100% !important;
}

.setting-item :deep(.p-iftalabel label) {
  font-size: 0.75rem !important;
  color: #6b7280 !important;
}

/* 快捷键输入框特殊样式 */
.setting-item :deep(.shortcut-input .p-inputtext) {
  padding-top: 1.25rem !important;
  padding-bottom: 0.5rem !important;
}
</style>
