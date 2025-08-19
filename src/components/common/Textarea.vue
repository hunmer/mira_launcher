<!-- Textarea 组件 - 包装 PrimeVue Textarea 以支持自定义样式和暗色模式 -->
<template>
    <Textarea
        v-model="textareaValue"
        v-bind="{
            ...$attrs,
            class: textareaClass,
        }"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
    />
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import Textarea from 'primevue/textarea'
import { computed, ref, watch } from 'vue'

interface Props {
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    rows?: number
    cols?: number
}

interface Emits {
    (e: 'update:modelValue', value: string): void
    (e: 'input', event: Event): void
    (e: 'change', event: Event): void
    (e: 'focus', event: FocusEvent): void
    (e: 'blur', event: FocusEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const themeStore = useThemeStore()

const textareaValue = ref(props.modelValue || '')

// 监听外部值变化
watch(
    () => props.modelValue,
    newValue => {
        textareaValue.value = newValue || ''
    },
)

// 监听内部值变化
watch(textareaValue, newValue => {
    emit('update:modelValue', newValue)
})

const handleInput = (event: Event) => {
    emit('input', event)
}

const handleChange = (event: Event) => {
    emit('change', event)
}

const handleFocus = (event: FocusEvent) => {
    emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
    emit('blur', event)
}

// 计算文本区域样式类
const textareaClass = computed(() => {
    const classes = ['custom-textarea']

    if (themeStore.currentTheme === 'dark') {
        classes.push('dark-theme')
    }

    return classes.join(' ')
})
</script>

<style scoped>
.custom-textarea {
  transition: all 0.2s ease;
}
</style>
