<template>
    <div class="key-capture-input relative w-full">
        <InputText ref="inputRef" v-model="displayValue" :placeholder="placeholder || ''" :readonly="true"
            class="w-full" @focus="handleFocus" @blur="handleBlur" @keydown="handleKeyDown" />

        <!-- 冲突提示 -->
        <div v-if="conflictInfo" class="text-red-500 text-sm mt-1 flex items-center gap-1">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ conflictInfo }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import InputText from 'primevue/inputtext'
import { computed, nextTick, ref, watch } from 'vue'

interface Props {
    modelValue?: string
    placeholder?: string
    conflictChecker?: (key: string) => string | null
}

interface Emits {
    (e: 'update:modelValue', value: string): void
    (e: 'change', value: string): void
    (e: 'conflict', conflict: string | null): void
    (e: 'focus'): void
    (e: 'blur'): void
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    placeholder: '点击设置快捷键'
})

const emit = defineEmits<Emits>()

// 组件状态
const inputRef = ref<HTMLInputElement>()
const isCapturing = ref(false)
const currentValue = ref(props.modelValue)
const capturedKeys = ref<string[]>([])
const modifierKeys = ref<string[]>([])

// 显示值
const displayValue = computed(() => {
    if (isCapturing.value && capturedKeys.value.length > 0) {
        return [...modifierKeys.value, ...capturedKeys.value].join('+')
    }
    return currentValue.value || ''
})

// 冲突检测
const conflictInfo = ref<string | null>(null)

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
    currentValue.value = newValue
}, { immediate: true })

// 监听当前值变化，检测冲突
watch(currentValue, (newValue) => {
    if (newValue && props.conflictChecker) {
        const conflict = props.conflictChecker(newValue)
        conflictInfo.value = conflict
        emit('conflict', conflict)
    } else {
        conflictInfo.value = null
        emit('conflict', null)
    }
}, { immediate: true })

/**
 * 开始捕获快捷键
 */
const startCapture = async () => {
    isCapturing.value = true
    capturedKeys.value = []
    modifierKeys.value = []

    await nextTick()
    inputRef.value?.focus()
}

/**
 * 处理聚焦事件
 */
const handleFocus = () => {
    startCapture()
    emit('focus')
}

/**
 * 处理失焦事件
 */
const handleBlur = () => {
    // 失去焦点时自动保存当前捕获的快捷键
    if (isCapturing.value && capturedKeys.value.length > 0) {
        confirmCapture()
    } else {
        stopCapture()
    }
    emit('blur')
}

/**
 * 停止捕获快捷键
 */
const stopCapture = () => {
    isCapturing.value = false
    capturedKeys.value = []
    modifierKeys.value = []
}

/**
 * 处理按键事件
 */
const handleKeyDown = (event: KeyboardEvent) => {
    if (!isCapturing.value) return

    event.preventDefault()
    event.stopPropagation()

    const key = event.key
    const code = event.code

    // 按删除键清空快捷键
    if (key === 'Delete' || key === 'Backspace') {
        clearCapture()
        return
    }

    // 重置按键记录
    modifierKeys.value = []
    capturedKeys.value = []

    // 记录修饰键
    if (event.ctrlKey || event.metaKey) {
        modifierKeys.value.push(navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl')
    }
    if (event.altKey) {
        modifierKeys.value.push('Alt')
    }
    if (event.shiftKey) {
        modifierKeys.value.push('Shift')
    }

    // 处理主要按键
    if (!['Control', 'Meta', 'Alt', 'Shift'].includes(key)) {
        let mainKey = key

        // 特殊按键映射
        const keyMap: Record<string, string> = {
            ' ': 'Space',
            'Enter': 'Enter',
            'Escape': 'Esc',
            'Tab': 'Tab',
            'ArrowUp': 'Up',
            'ArrowDown': 'Down',
            'ArrowLeft': 'Left',
            'ArrowRight': 'Right',
            'Home': 'Home',
            'End': 'End',
            'PageUp': 'PageUp',
            'PageDown': 'PageDown',
            'Insert': 'Insert'
        }

        if (keyMap[key]) {
            mainKey = keyMap[key]
        } else if (key.length === 1) {
            // 字母和数字键转换为大写
            mainKey = key.toUpperCase()
        } else if (code.startsWith('F') && /^F\d+$/.test(code)) {
            // 功能键
            mainKey = code
        }

        capturedKeys.value = [mainKey]
    }

    // 如果有有效的按键组合，可以选择自动确认或等待失焦时保存
    // 这里我们选择等待失焦时保存，以便用户可以看到预览
}

/**
 * 确认捕获的快捷键
 */
const confirmCapture = () => {
    if (capturedKeys.value.length === 0) {
        clearCapture()
        return
    }

    const newValue = [...modifierKeys.value, ...capturedKeys.value].join('+')
    currentValue.value = newValue
    emit('update:modelValue', newValue)
    emit('change', newValue)

    isCapturing.value = false
    capturedKeys.value = []
    modifierKeys.value = []
}

/**
 * 清除快捷键
 */
const clearCapture = () => {
    currentValue.value = ''
    capturedKeys.value = []
    modifierKeys.value = []
    isCapturing.value = false
    conflictInfo.value = null

    emit('update:modelValue', '')
    emit('change', '')
    emit('conflict', null)
}

// 暴露方法给父组件
defineExpose({
    startCapture,
    clearCapture,
    focus: () => inputRef.value?.focus()
})
</script>

<style scoped>
.key-capture-input {
    position: relative;
    width: 100%;
    flex: 1;
}

.key-capture-input :deep(.p-inputtext) {
    cursor: pointer;
    user-select: none;
    width: 100%;
}

.key-capture-input :deep(.p-inputtext:focus) {
    cursor: text;
}
</style>
