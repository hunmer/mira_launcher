<!-- Slider 组件 - 包装 PrimeVue Slider 以支持自定义样式和暗色模式 -->
<template>
    <Slider
        v-model="sliderValue"
        v-bind="{
            ...$attrs,
            class: sliderClass,
        }"
        @change="handleChange"
        @slideend="handleSlideEnd"
    />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Slider from 'primevue/slider'
import { useThemeStore } from '@/stores/theme'

interface Props {
    modelValue?: number | number[]
    min?: number
    max?: number
    step?: number
    range?: boolean
    disabled?: boolean
}

interface Emits {
    (e: 'update:modelValue', value: number | number[]): void
    (e: 'change', value: number | number[]): void
    (e: 'slideend', value: number | number[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const themeStore = useThemeStore()

const sliderValue = ref(props.modelValue || 0)

// 监听外部值变化
watch(
    () => props.modelValue,
    newValue => {
        sliderValue.value = newValue || 0
    },
)

// 监听内部值变化
watch(sliderValue, newValue => {
    emit('update:modelValue', newValue)
})

const handleChange = (value: number | number[]) => {
    emit('change', value)
}

const handleSlideEnd = (event: { value: number | number[] }) => {
    emit('slideend', event.value)
}

// 计算滑块样式类
const sliderClass = computed(() => {
    const classes = ['custom-slider']

    if (themeStore.currentTheme === 'dark') {
        classes.push('dark-theme')
    }

    return classes.join(' ')
})
</script>

<style scoped>
.custom-slider {
  transition: all 0.2s ease;
}

.custom-slider.dark-theme :deep(.p-slider) {
  background-color: rgb(75, 85, 99);
}

.custom-slider.dark-theme :deep(.p-slider-range) {
  background-color: rgb(59, 130, 246);
}

.custom-slider.dark-theme :deep(.p-slider-handle) {
  background-color: rgb(59, 130, 246);
  border-color: rgb(59, 130, 246);
}

.custom-slider.dark-theme :deep(.p-slider-handle:hover) {
  background-color: rgb(37, 99, 235);
  border-color: rgb(37, 99, 235);
}
</style>
