<!-- SettingPlan 组件 - 包装 PrimeVue Accordion 以支持设置页面的统一样式 -->
<template>
    <div style="margin-bottom: 50px;">
        <Accordion
            v-model:value="accordionValue"
            v-bind="$attrs"
            multiple
        >
            <slot />
        </Accordion>
    </div>
</template>

<script setup lang="ts">
import Accordion from 'primevue/accordion'
import { ref, watch } from 'vue'

interface Props {
    value?: string[]
    defaultValue?: string[]
}

interface Emits {
    (e: 'update:value', value: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
    value: () => [],
    defaultValue: () => ['0'],
})

const emit = defineEmits<Emits>()

const accordionValue = ref(props.value.length > 0 ? props.value : props.defaultValue)

// 监听外部值变化
watch(() => props.value, (newValue) => {
    accordionValue.value = newValue.length > 0 ? newValue : props.defaultValue
})

// 监听内部值变化
watch(accordionValue, (newValue) => {
    emit('update:value', newValue)
}, { deep: true })
</script>

<style scoped></style>
