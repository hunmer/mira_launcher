<template>
    <Tag
        :severity="primeVueSeverity"
        :value="tagContent"
        :class="tagClass"
        v-bind="$attrs"
        @click="handleClick"
    >
        <template #default>
            <div class="flex items-center">
                <slot />
                <Button
                    v-if="closable"
                    text
                    size="small"
                    icon="pi pi-times"
                    class="ml-1 p-0 w-4 h-4"
                    @click.stop="handleClose"
                />
            </div>
        </template>
    </Tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import Button from 'primevue/button'

interface Props {
    type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
    size?: 'small' | 'medium' | 'large'
    closable?: boolean
    checkable?: boolean
    checked?: boolean
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    type: 'default',
    size: 'medium',
    closable: false,
    checkable: false,
    checked: false,
    class: '',
})

const emit = defineEmits<Emits>()

interface Emits {
    (e: 'close'): void
    (e: 'click', event: MouseEvent): void
}

// 转换类型到 PrimeVue 的 severity
const primeVueSeverity = computed(() => {
    const typeMap = {
        default: undefined,
        primary: 'primary',
        info: 'info',
        success: 'success',
        warning: 'warn',
        error: 'danger',
    }
    return typeMap[props.type]
})

// Tag 内容
const tagContent = computed(() => {
    return '' // PrimeVue Tag 不需要 value 属性，内容通过 slot 传递
})

// 样式类
const tagClass = computed(() => {
    const sizeClasses = {
        small: 'text-xs px-2 py-1',
        medium: 'text-sm px-3 py-1',
        large: 'text-base px-4 py-2',
    }
  
    return [
        'inline-flex items-center',
        sizeClasses[props.size],
        props.checkable && props.checked && 'ring-2 ring-blue-500',
        props.checkable && 'cursor-pointer',
        props.class,
    ].filter(Boolean).join(' ')
})

// 事件处理
const handleClose = () => {
    emit('close')
}

const handleClick = (event: MouseEvent) => {
    emit('click', event)
}
</script>
