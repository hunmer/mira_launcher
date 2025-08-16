<!-- MultiSelect 组件 - 包装 PrimeVue MultiSelect 以支持自定义样式和暗色模式 -->
<template>
    <MultiSelect
        v-model="multiSelectValue"
        v-bind="{
            ...$attrs,
            class: multiSelectClass
        }"
        @change="handleChange"
    />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MultiSelect from 'primevue/multiselect'
import { useThemeStore } from '@/stores/theme'

interface Props {
    modelValue?: unknown[]
}

interface Emits {
    (e: 'update:modelValue', value: unknown[]): void
    (e: 'change', event: { originalEvent: Event; value: unknown[] }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const themeStore = useThemeStore()

const multiSelectValue = ref(props.modelValue || [])

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
    multiSelectValue.value = newValue || []
})

// 监听内部值变化
watch(multiSelectValue, (newValue) => {
    emit('update:modelValue', newValue)
})

const handleChange = (event: { originalEvent: Event; value: unknown[] }) => {
    emit('change', event)
}

// 计算多选样式类
const multiSelectClass = computed(() => {
    const classes = ['custom-multiselect']
  
    if (themeStore.currentTheme === 'dark') {
        classes.push('dark-theme')
    }
  
    return classes.join(' ')
})
</script>

<style scoped>
.custom-multiselect {
  transition: all 0.2s ease;
}

.custom-multiselect.dark-theme :deep(.p-multiselect) {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}

.custom-multiselect.dark-theme :deep(.p-multiselect:hover) {
  border-color: rgb(107, 114, 128);
}

.custom-multiselect.dark-theme :deep(.p-multiselect:focus) {
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 1px rgb(59, 130, 246);
}

.custom-multiselect.dark-theme :deep(.p-multiselect-panel) {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
}

.custom-multiselect.dark-theme :deep(.p-multiselect-item) {
  color: rgb(229, 231, 235);
}

.custom-multiselect.dark-theme :deep(.p-multiselect-item:hover) {
  background-color: rgb(75, 85, 99);
}

.custom-multiselect.dark-theme :deep(.p-multiselect-item.p-multiselect-item-selected) {
  background-color: rgb(59, 130, 246);
  color: rgb(255, 255, 255);
}

.custom-multiselect.dark-theme :deep(.p-multiselect-chip) {
  background-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}
</style>
