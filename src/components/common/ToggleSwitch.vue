<!-- ToggleSwitch 组件 - 包装 PrimeVue ToggleSwitch 以支持自定义样式和暗色模式 -->
<template>
    <ToggleSwitch
        v-model="switchValue"
        v-bind="{
            ...$attrs,
            class: switchClass
        }"
        @change="handleChange"
    />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ToggleSwitch from 'primevue/toggleswitch'
import { useThemeStore } from '@/stores/theme'

interface Props {
    modelValue?: boolean
    disabled?: boolean
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'change', event: Event): void
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    disabled: false,
})

const emit = defineEmits<Emits>()

const themeStore = useThemeStore()

const switchValue = ref(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
    switchValue.value = newValue
})

// 监听内部值变化
watch(switchValue, (newValue) => {
    emit('update:modelValue', newValue)
})

const handleChange = (event: Event) => {
    emit('change', event)
}

// 计算开关样式类
const switchClass = computed(() => {
    const classes = ['custom-toggle-switch']
  
    if (themeStore.currentTheme === 'dark') {
        classes.push('dark-theme')
    }
  
    return classes.join(' ')
})
</script>

<style scoped>
.custom-toggle-switch {
  transition: all 0.2s ease;
}

.custom-toggle-switch.dark-theme :deep(.p-toggleswitch) {
  /* 暗色模式下的开关样式 */
  opacity: 0.95;
}

.custom-toggle-switch.dark-theme :deep(.p-toggleswitch .p-toggleswitch-slider) {
  background-color: rgb(75, 85, 99);
  border-color: rgb(107, 114, 128);
}

.custom-toggle-switch.dark-theme :deep(.p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider) {
  background-color: rgb(59, 130, 246);
  border-color: rgb(59, 130, 246);
}

.custom-toggle-switch.dark-theme :deep(.p-toggleswitch .p-toggleswitch-slider:before) {
  background-color: rgb(255, 255, 255);
}

.custom-toggle-switch.dark-theme :deep(.p-toggleswitch:not(.p-disabled):hover .p-toggleswitch-slider) {
  background-color: rgb(107, 114, 128);
}

.custom-toggle-switch.dark-theme :deep(.p-toggleswitch.p-toggleswitch-checked:not(.p-disabled):hover .p-toggleswitch-slider) {
  background-color: rgb(37, 99, 235);
}
</style>
