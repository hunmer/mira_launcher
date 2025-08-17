<template>
    <Select
        ref="selectRef"
        v-model="selectedValue"
        :options="options"
        :option-label="optionLabel"
        :option-value="optionValue"
        :placeholder="placeholder"
        :filter="filter"
        :show-clear="showClear"
        :loading="loading"
        :disabled="disabled"
        :class="customClass"
        @change="$emit('change', $event)"
        @filter="$emit('filter', $event)"
        @wheel="handleWheel"
    >
        <template v-if="$slots['value']" #value="slotProps">
            <slot
                name="value"
                :value="slotProps.value"
                :placeholder="slotProps.placeholder"
            />
        </template>

        <template v-if="$slots['option']" #option="slotProps">
            <slot
                name="option"
                :option="slotProps.option"
                :index="slotProps.index"
            />
        </template>

        <template v-if="$slots['header']" #header>
            <slot name="header" />
        </template>

        <template v-if="$slots['footer']" #footer>
            <slot name="footer" />
        </template>

        <template v-if="$slots['dropdownicon']" #dropdownicon>
            <slot name="dropdownicon" />
        </template>
    </Select>
</template>

<script setup lang="ts">
import Select from 'primevue/select'
import { computed, ref } from 'vue'

interface FilterSelectProps {
    modelValue?: any
    options: any[]
    optionLabel?: string
    optionValue?: string
    placeholder?: string
    filter?: boolean
    showClear?: boolean
    loading?: boolean
    disabled?: boolean
    class?: string
}

interface FilterSelectEmits {
    (event: 'update:modelValue', value: any): void
    (event: 'change', value: any): void
    (event: 'filter', filterEvent: any): void
}

const props = withDefaults(defineProps<FilterSelectProps>(), {
    optionLabel: 'label',
    optionValue: 'value',
    placeholder: '请选择...',
    filter: true,
    showClear: false,
    loading: false,
    disabled: false,
    class: '',
})

const emit = defineEmits<FilterSelectEmits>()

const selectRef = ref()

const selectedValue = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
})

const customClass = computed(() => {
    return `filter-select ${props.class}`
})

// 处理滚轮事件切换选项
const handleWheel = (event: WheelEvent) => {
    if (props.disabled || !props.options.length) return

    event.preventDefault()

    const currentIndex = props.options.findIndex(option => {
        const optionValue = props.optionValue ? option[props.optionValue] : option
        return optionValue === selectedValue.value
    })

    let newIndex = currentIndex

    if (event.deltaY > 0) {
        // 向下滚动，选择下一个选项
        newIndex = currentIndex < props.options.length - 1 ? currentIndex + 1 : 0
    } else {
        // 向上滚动，选择上一个选项
        newIndex = currentIndex > 0 ? currentIndex - 1 : props.options.length - 1
    }

    if (
        newIndex !== currentIndex &&
        newIndex >= 0 &&
        newIndex < props.options.length
    ) {
        const newOption = props.options[newIndex]
        const newValue = props.optionValue
            ? newOption[props.optionValue]
            : newOption
        selectedValue.value = newValue
        emit('change', { value: newValue })
    }
}
</script>

<style scoped>
.filter-select {
  min-width: 200px;
  transition: all 0.2s ease;
}

.filter-select:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 增加图标和文字间距 */
:global(.filter-select .p-select-option .flex.items-center.gap-2) {
  gap: 0.75rem !important;
}

:global(.filter-select .p-select-label .flex.items-center.gap-2) {
  gap: 0.75rem !important;
}

/* 深色模式样式 */
:global(.dark .filter-select) {
  --p-select-background: rgb(55 65 81);
  --p-select-border-color: rgb(75 85 99);
  --p-select-color: rgb(243 244 246);
}

:global(.dark .filter-select:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:global(.dark .filter-select:hover) {
  --p-select-border-color: rgb(99 102 241);
}

:global(.dark .filter-select:focus-within) {
  --p-select-border-color: rgb(99 102 241);
  --p-select-focus-ring-color: rgba(99, 102, 241, 0.2);
}

/* 下拉面板样式 */
:global(.dark .p-select-overlay) {
  background-color: rgb(31 41 55) !important;
  border-color: rgb(75 85 99) !important;
}

:global(.dark .p-select-option) {
  color: rgb(243 244 246) !important;
}

:global(.dark .p-select-option:hover) {
  background-color: rgb(55 65 81) !important;
}

:global(.dark .p-select-option.p-select-option-selected) {
  background-color: rgb(99 102 241) !important;
  color: white !important;
}
</style>
