<!-- SettingItem 组件 - 使用 InputGroup 包装的统一设置项组件 -->
<template>
    <div class="setting-item">
        <InputGroup class="w-full">
            <!-- 标题部分 -->
            <InputGroupAddon class="bg-gray-50 dark:bg-gray-700 border-0">
                <div class="flex items-center gap-2 px-3 py-2 min-w-0">
                    <i v-if="icon" :class="[icon, iconColor]" class="flex-shrink-0" />
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                        <span class="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {{ title }}
                        </span>
                        <i v-if="tooltip" v-tooltip.top="tooltip"
                            class="pi pi-info-circle text-gray-400 hover:text-blue-500 cursor-help transition-colors text-sm flex-shrink-0"
                            style="margin-left: 8px;" />
                    </div>
                </div>
            </InputGroupAddon>

            <!-- 整行控件部分 (text, select, number) - 仅当没有switch作为rightControl时 -->
            <InputGroupAddon v-if="(type === 'text' || type === 'select' || type === 'number') && !rightControl"
                class="flex-1 border-0 p-0">
                <!-- 输入框类型 -->
                <InputText v-if="type === 'text'" v-model="inputValue" :placeholder="placeholder || ''"
                    :readonly="readonly || false" class="w-full border-0 rounded-none"
                    @update:model-value="handleUpdate" />

                <!-- 下拉选择 -->
                <Dropdown v-else-if="type === 'select'" v-model="inputValue" :options="options || []"
                    :option-label="optionLabel || 'label'" :option-value="optionValue || 'value'"
                    :placeholder="placeholder || ''" class="w-full border-0 rounded-none"
                    @update:model-value="handleUpdate" />

                <!-- 数字输入 -->
                <InputNumber v-else-if="type === 'number'" v-model="inputValue" :placeholder="placeholder"
                    class="w-full border-0 rounded-none" @update:model-value="handleUpdate" />
            </InputGroupAddon>

            <!-- 带右侧控件的整行元素 (但不包括switch) -->
            <InputGroupAddon
                v-if="(type === 'text' || type === 'select' || type === 'number') && rightControl && rightControl !== 'switch'"
                class="flex-1 border-0 p-0">
                <!-- 输入框类型 -->
                <InputText v-if="type === 'text'" v-model="inputValue" :placeholder="placeholder || ''"
                    :readonly="readonly || false" class="w-full border-0 rounded-none"
                    @update:model-value="handleUpdate" />

                <!-- 下拉选择 -->
                <Dropdown v-else-if="type === 'select'" v-model="inputValue" :options="options || []"
                    :option-label="optionLabel || 'label'" :option-value="optionValue || 'value'"
                    :placeholder="placeholder || ''" class="w-full border-0 rounded-none"
                    @update:model-value="handleUpdate" />

                <!-- 数字输入 -->
                <InputNumber v-else-if="type === 'number'" v-model="inputValue" :placeholder="placeholder"
                    class="w-full border-0 rounded-none" @update:model-value="handleUpdate" />
            </InputGroupAddon>

            <!-- 占位空间 (当控件需要右对齐时) -->
            <InputGroupAddon v-if="type === 'button' || type === 'switch' || rightControl === 'switch'"
                class="flex-1 border-0 p-0">
                <div class="w-full bg-white dark:bg-gray-800"></div>
            </InputGroupAddon>

            <!-- 右对齐控件部分 (button，优先级高于rightControl) -->
            <InputGroupAddon v-if="type === 'button'" class="border-0">
                <div class="px-3 py-2">
                    <Button :label="buttonLabel" :icon="buttonIcon" :severity="buttonSeverity" :variant="buttonVariant"
                        @click="handleButtonClick" />
                </div>
            </InputGroupAddon>

            <!-- 右对齐开关控件 -->
            <InputGroupAddon v-if="type === 'switch'" class="border-0">
                <div class="px-3 py-2">
                    <ToggleSwitch v-model="inputValue" @update:model-value="handleUpdate" />
                </div>
            </InputGroupAddon>

            <!-- 右侧控件 (复选框、单选按钮等，排除开关) -->
            <InputGroupAddon v-if="rightControl && rightControl !== 'switch' && type !== 'button' && type !== 'switch'"
                class="border-0">
                <div class="px-3 py-2">
                    <!-- 复选框 -->
                    <Checkbox v-if="rightControl === 'checkbox'" v-model="inputValue" :binary="true"
                        @update:model-value="handleUpdate" />

                    <!-- 单选按钮 -->
                    <RadioButton v-else-if="rightControl === 'radio'" v-model="inputValue" :value="radioValue"
                        @update:model-value="handleUpdate" />
                </div>
            </InputGroupAddon>

            <!-- 独立的右侧开关控件 (当rightControl='switch'时) -->
            <InputGroupAddon v-if="rightControl === 'switch'" class="border-0">
                <div class="px-3 py-2">
                    <ToggleSwitch v-model="inputValue" @update:model-value="handleUpdate" />
                </div>
            </InputGroupAddon>
        </InputGroup>
    </div>
</template>

<script setup lang="ts">
import { Button, Dropdown, ToggleSwitch } from '@/components/common'
import Checkbox from 'primevue/checkbox'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import { ref, watch } from 'vue'

interface Props {
    // 基本属性
    title: string
    description?: string
    tooltip?: string
    icon?: string
    iconColor?: string

    // 控件类型
    type: 'text' | 'select' | 'number' | 'button' | 'switch'
    rightControl?: 'switch' | 'checkbox' | 'radio'

    // 值和事件
    modelValue?: any

    // 输入框属性
    placeholder?: string
    readonly?: boolean

    // 下拉选择属性
    options?: any[]
    optionLabel?: string
    optionValue?: string

    // 按钮属性
    buttonLabel?: string
    buttonIcon?: string
    buttonSeverity?: string
    buttonVariant?: string

    // 单选按钮属性
    radioValue?: any
}

interface Emits {
    (e: 'update:modelValue', value: any): void
    (e: 'button-click'): void
}

const props = withDefaults(defineProps<Props>(), {
    description: '',
    tooltip: '',
    icon: '',
    iconColor: 'text-gray-600 dark:text-gray-400',
    placeholder: '',
    readonly: false,
    optionLabel: 'label',
    optionValue: 'value',
    buttonLabel: '',
    buttonIcon: '',
    buttonSeverity: 'secondary',
    buttonVariant: 'outlined'
})

const emit = defineEmits<Emits>()

const inputValue = ref(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
    inputValue.value = newValue
})

// 处理值更新
const handleUpdate = (value: any) => {
    inputValue.value = value
    emit('update:modelValue', value)
}

// 处理按钮点击
const handleButtonClick = () => {
    emit('button-click')
}
</script>

<style scoped>
.setting-item {
    width: 100%;
}

/* 确保 InputGroup 中的组件正确对齐和填满宽度 */
:deep(.p-inputgroup) {
    width: 100%;
    display: flex;
    border: none !important;
}

:deep(.p-inputgroup > .p-inputgroupaddon) {
    flex-shrink: 0;
    border: none !important;
}

:deep(.p-inputgroup > .flex-1) {
    flex: 1;
    min-width: 0;
}

/* 确保输入框填满可用空间并移除边框 */
:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-inputnumber) {
    width: 100% !important;
    border: none !important;
    border-radius: 0 !important;
}

/* 移除所有边框和圆角 */
:deep(.p-inputgroup .p-inputgroupaddon) {
    border: none !important;
    border-radius: 0 !important;
}

:deep(.p-inputgroup .p-inputgroupaddon:first-child) {
    border-radius: 6px 0 0 6px !important;
}

:deep(.p-inputgroup .p-inputgroupaddon:last-child) {
    border-radius: 0 6px 6px 0 !important;
}

/* 当只有一个addon时保持完整圆角 */
:deep(.p-inputgroup .p-inputgroupaddon:only-child) {
    border-radius: 6px !important;
}
</style>
