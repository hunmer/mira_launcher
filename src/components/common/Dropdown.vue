<!-- Dropdown 组件 - 包装 PrimeVue Dropdown 以支持自定义样式和暗色模式 -->
<template>
    <Dropdown
        v-model="dropdownValue"
        v-bind="{
            ...$attrs,
            class: dropdownClass,
        }"
        @change="handleChange"
    />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dropdown from 'primevue/dropdown'
import { useThemeStore } from '@/stores/theme'

interface Props {
    modelValue?: unknown
    options?: unknown[]
    optionLabel?: string
    optionValue?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
}

interface Emits {
    (e: 'update:modelValue', value: unknown): void
    (e: 'change', event: { originalEvent: Event; value: unknown }): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const themeStore = useThemeStore()

const dropdownValue = ref(props.modelValue)

// 监听外部值变化
watch(
    () => props.modelValue,
    newValue => {
        dropdownValue.value = newValue
    },
)

// 监听内部值变化
watch(dropdownValue, newValue => {
    emit('update:modelValue', newValue)
})

const handleChange = (event: { originalEvent: Event; value: unknown }) => {
    emit('change', event)
}

// 计算下拉菜单样式类
const dropdownClass = computed(() => {
    const classes = ['custom-dropdown']

    if (themeStore.currentTheme === 'dark') {
        classes.push('dark-theme')
    }

    return classes.join(' ')
})
</script>

<style scoped>
.custom-dropdown {
  transition: all 0.2s ease;
}

.custom-dropdown.dark-theme :deep(.p-dropdown) {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}

.custom-dropdown.dark-theme :deep(.p-dropdown:hover) {
  border-color: rgb(107, 114, 128);
}

.custom-dropdown.dark-theme :deep(.p-dropdown:focus) {
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 1px rgb(59, 130, 246);
}

.custom-dropdown.dark-theme :deep(.p-dropdown-trigger) {
  color: rgb(156, 163, 175);
}

.custom-dropdown.dark-theme :deep(.p-dropdown-panel) {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
}

.custom-dropdown.dark-theme :deep(.p-dropdown-item) {
  color: rgb(229, 231, 235);
}

.custom-dropdown.dark-theme :deep(.p-dropdown-item:hover) {
  background-color: rgb(75, 85, 99);
}

.custom-dropdown.dark-theme :deep(.p-dropdown-item.p-dropdown-item-selected) {
  background-color: rgb(59, 130, 246);
  color: rgb(255, 255, 255);
}
</style>
