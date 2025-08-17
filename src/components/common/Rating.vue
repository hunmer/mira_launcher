<!-- Rating 组件 - 包装 PrimeVue Rating 以支持自定义样式和暗色模式 -->
<template>
    <Rating
        v-model="ratingValue"
        v-bind="{
            ...$attrs,
            class: ratingClass,
        }"
        @change="handleChange"
    />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Rating from 'primevue/rating'
import { useThemeStore } from '@/stores/theme'

interface Props {
    modelValue?: number
    stars?: number
    readonly?: boolean
    disabled?: boolean
    cancel?: boolean
}

interface Emits {
    (e: 'update:modelValue', value: number): void
    (e: 'change', event: { originalEvent: Event; value: number }): void
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: 0,
    stars: 5,
    readonly: false,
    disabled: false,
    cancel: true,
})

const emit = defineEmits<Emits>()

const themeStore = useThemeStore()

const ratingValue = ref(props.modelValue)

// 监听外部值变化
watch(
    () => props.modelValue,
    newValue => {
        ratingValue.value = newValue
    },
)

// 监听内部值变化
watch(ratingValue, newValue => {
    emit('update:modelValue', newValue)
})

const handleChange = (event: { originalEvent: Event; value: number }) => {
    emit('change', event)
}

// 计算评分样式类
const ratingClass = computed(() => {
    const classes = ['custom-rating']

    if (themeStore.currentTheme === 'dark') {
        classes.push('dark-theme')
    }

    return classes.join(' ')
})
</script>

<style scoped>
.custom-rating {
  transition: all 0.2s ease;
}

.custom-rating.dark-theme :deep(.p-rating-item) {
  color: rgb(107, 114, 128);
}

.custom-rating.dark-theme :deep(.p-rating-item.p-rating-item-active) {
  color: rgb(245, 158, 11);
}

.custom-rating.dark-theme :deep(.p-rating-item:hover) {
  color: rgb(245, 158, 11);
}
</style>
