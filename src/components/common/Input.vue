<template>
    <InputText
        v-if="type !== 'textarea'"
        v-model="inputValue"
        v-bind="{
            ...$attrs,
            ...(type !== undefined && { type: type as 'text' | 'password' }),
            ...(placeholder !== undefined && { placeholder }),
            ...(disabled !== undefined && { disabled }),
            ...(readonly !== undefined && { readonly }),
            ...(primeVueSize !== undefined && { size: primeVueSize }),
            class: inputClass,
        }"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
    />
    <Textarea
        v-else
        v-model="inputValue"
        v-bind="{
            ...$attrs,
            ...(placeholder !== undefined && { placeholder }),
            ...(disabled !== undefined && { disabled }),
            ...(readonly !== undefined && { readonly }),
            class: inputClass,
        }"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
    />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import type { InputProps } from '@/types/components'

interface Props extends Omit<InputProps, 'type'> {
    value?: string
    size?: 'small' | 'medium' | 'large'
    type?: 'text' | 'password' | 'textarea'
}

const props = withDefaults(defineProps<Props>(), {
    value: '',
    type: 'text',
    placeholder: '',
    disabled: false,
    readonly: false,
    clearable: false,
    size: 'medium',
})

const emit = defineEmits<Emits>()

interface Emits {
    (e: 'update:value', value: string): void
    (e: 'input', value: string): void
    (e: 'change', value: string): void
    (e: 'focus', event: FocusEvent): void
    (e: 'blur', event: FocusEvent): void
}

// 内部值管理
const inputValue = ref(props.value)

// 监听外部值变化
watch(
    () => props.value,
    newValue => {
        inputValue.value = newValue
    },
)

// 监听内部值变化
watch(inputValue, newValue => {
    emit('update:value', newValue)
})

// 转换尺寸到 PrimeVue 的格式
const primeVueSize = computed(() => {
    const sizeMap = {
        small: 'small',
        medium: undefined,
        large: 'large',
    }
    return sizeMap[props.size]
})

// 样式类
const inputClass = computed(() => {
    return [
        'transition-all duration-200',
        props.clearable && 'clearable',
        props.class,
    ]
        .filter(Boolean)
        .join(' ')
})

// 事件处理
const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('input', target.value)
}

const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('change', target.value)
}

const handleFocus = (event: FocusEvent) => {
    emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
    emit('blur', event)
}
</script>
