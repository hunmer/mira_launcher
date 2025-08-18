<template>
    <Dialog
        v-model:visible="isVisible"
        :header="dialogTitle"
        :style="{ width: '500px' }"
        :modal="true"
        :closable="true"
        @update:visible="$emit('update:show', $event)"
    >
        <div class="add-app-form">
            <div class="form-field">
                <label class="field-label">应用名称</label>
                <Input
                    v-model="form.name"
                    placeholder="请输入应用名称"
                    class="field-input"
                />
            </div>

            <div class="form-field">
                <label class="field-label">分类</label>
                <FilterSelect
                    v-model="form.category"
                    :options="categoryOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="选择分类"
                    class="field-input"
                >
                    <template #value="{ value, placeholder }">
                        <div v-if="value" class="flex items-center gap-2">
                            <i :class="getCategoryIcon(value)" />
                            <span>{{ getCategoryLabel(value) }}</span>
                        </div>
                        <span v-else>{{ placeholder }}</span>
                    </template>
                    <template #option="{ option }">
                        <div class="flex items-center gap-2">
                            <i :class="option.icon" />
                            <span>{{ option.label }}</span>
                        </div>
                    </template>
                </FilterSelect>
            </div>

            <div class="form-field">
                <label class="field-label">描述 (可选)</label>
                <Input
                    v-model="form.description"
                    placeholder="请输入应用描述"
                    class="field-input"
                />
            </div>

            <!-- 动态字段渲染 -->
            <template v-if="fields">
                <div
                    v-for="(field, key) in fields"
                    :key="key"
                    class="form-field"
                    :class="{ 'field-error': fieldErrors[key] }"
                >
                    <label class="field-label">
                        {{ field.label }}<span v-if="field.required" class="required-marker">*</span>
                    </label>
                    <component
                        :is="getFieldComponent(field.input)"
                        v-model="form.dynamicFields[key]"
                        v-bind="getFieldProps(field)"
                        class="field-input"
                        @blur="validateField(key, field)"
                    />
                    <div v-if="fieldErrors[key]" class="field-error-message">
                        {{ fieldErrors[key] }}
                    </div>
                </div>
            </template>

            <div class="form-field">
                <label class="field-label">图标路径 (可选)</label>
                <div class="icon-input-group">
                    <Input
                        v-model="form.icon"
                        placeholder="请输入图标路径或URL"
                        class="field-input"
                    />
                    <Button
                        icon="pi pi-image"
                        class="browse-btn"
                        title="选择图标"
                        @click="selectIcon"
                    />
                </div>
            </div>

            <div v-if="form.icon" class="icon-preview">
                <label class="field-label">图标预览</label>
                <div class="preview-container">
                    <img
                        v-if="form.icon"
                        :src="form.icon"
                        :alt="form.name"
                        class="preview-icon"
                        @error="onIconError"
                    >
                    <div v-if="iconError" class="icon-error">
                        <i class="pi pi-exclamation-triangle" />
                        <span>图标加载失败</span>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <Button
                    label="取消"
                    icon="pi pi-times"
                    class="p-button-secondary"
                    @click="cancel"
                />
                <Button
                    :label="isEditMode ? '保存' : '添加'"
                    icon="pi pi-check"
                    :disabled="!isFormValid"
                    class="p-button-primary"
                    @click="confirm"
                />
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import Dialog from '@/components/common/Dialog.vue'
import FilterSelect from '@/components/common/FilterSelect.vue'
import Input from '@/components/common/Input.vue'
import type { FieldDefinition } from '@/stores/addEntries'
import type { Application } from '@/stores/applications'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PathField from './fields/PathField.vue'
import { fieldTypeRegistry, registerAllFields } from './fields/register'

interface Props {
    show: boolean
    categories: Array<{ label: string; value: string; icon: string }>
    app?: Application | null
    formDefaults?: Partial<{ name: string; path: string; category: string; description: string; icon: string }>
    entryLabel?: string
    entryIcon?: string
    fields?: Record<string, FieldDefinition> | undefined
}

interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'confirm', app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): void
    (e: 'update', payload: { id: string; updates: Partial<Application> }): void
    (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 注册所有字段类型
onMounted(() => {
  registerAllFields()
})

// 组件映射
const componentMap = {
  input: Input,
  textarea: Input, // 使用相同的Input组件，通过props区分
  PathField,
}

// 获取字段组件类型
const getFieldComponent = (fieldInput: string) => {
    const componentName = fieldTypeRegistry.getComponent(fieldInput)
    return componentMap[componentName as keyof typeof componentMap] || Input
}

const isVisible = computed({
    get: () => props.show,
    set: value => emit('update:show', value),
})

const iconError = ref(false)

// 字段错误状态
const fieldErrors = ref<Record<string, string>>({})

// 获取字段属性
const getFieldProps = (field: FieldDefinition) => {
    return fieldTypeRegistry.getProps(field.input, field)
}

// 验证单个字段
const validateField = (key: string, field: FieldDefinition) => {
    const value = form.dynamicFields[key]
    
    // 清除之前的错误
    fieldErrors.value[key] = ''
    
    // 必填验证
    if (field.required) {
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            fieldErrors.value[key] = `${field.label}不能为空`
            return false
        }
    }
    
    // URL格式验证
    if (field.input === 'url' && value && typeof value === 'string') {
        try {
            new URL(value)
        } catch {
            fieldErrors.value[key] = '请输入有效的URL格式'
            return false
        }
    }
    
    return true
}

// 表单数据
const form = reactive({
    name: '',
    path: '',
    category: 'utility',
    description: '',
    icon: '',
    dynamicFields: {} as Record<string, unknown>,
})

// 是否编辑模式
const isEditMode = computed(() => !!props.app)
// 对话框标题
const dialogTitle = computed(() => {
    if (isEditMode.value && props.app) return `编辑: ${props.app.name}`
    // 优先使用插件传入的 entryLabel
    if (props.entryLabel) return props.entryLabel
    return '添加项目'
})

// 分类选项（排除"全部应用"）
const categoryOptions = computed(() => {
    return props.categories.filter(cat => cat.value !== 'all')
})

// 表单验证
const isFormValid = computed(() => {
    const requirePath = !props.fields
    const basicValid = form.name.trim() !== '' && (!requirePath || form.path.trim() !== '')
    if (!props.fields) return basicValid
    
    // 检查是否有字段错误
    const hasFieldErrors = Object.values(fieldErrors.value).some(error => error !== '')
    if (hasFieldErrors) return false
    
    // 检查必填字段
    for (const [key, def] of Object.entries(props.fields)) {
        if (def.required) {
            const v = form.dynamicFields[key]
            if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) return false
        }
    }
    return basicValid
})

// 获取分类图标
const getCategoryIcon = (categoryValue: string) => {
    const category = props.categories.find(cat => cat.value === categoryValue)
    return category?.icon || 'pi pi-th-large'
}

// 获取分类标签
const getCategoryLabel = (categoryValue: string) => {
    const category = props.categories.find(cat => cat.value === categoryValue)
    return category?.label || '未知分类'
}

// 选择图标
const selectIcon = async () => {
    try {
        // 这里可以集成 Tauri 的图片文件选择API
        console.log('选择图标')
    } catch (error) {
        console.error('选择图标失败:', error)
    }
}

// 图标加载错误处理
const onIconError = () => {
    iconError.value = true
}

// 提交（添加或更新）
const confirm = () => {
    if (!isFormValid.value) return
    if (isEditMode.value && props.app) {
    const updates: Partial<Application> = { }
        updates.name = form.name.trim()
        updates.path = form.path.trim()
        updates.category = form.category
        if (form.description.trim()) updates.description = form.description.trim()
        if (form.icon.trim()) updates.icon = form.icon.trim()
    if (Object.keys(form.dynamicFields).length) updates.dynamicFields = { ...form.dynamicFields }
        emit('update', { id: props.app.id, updates })
    } else {
    const newApp: Omit<Application, 'id' | 'createdAt' | 'updatedAt'> = {
            name: form.name.trim(),
            path: form.path.trim(),
            category: form.category,
            type: 'app',
            isSystem: false,
            pinned: false,
        }
        if (form.description.trim()) newApp.description = form.description.trim()
        if (form.icon.trim()) newApp.icon = form.icon.trim()
        if (Object.keys(form.dynamicFields).length) {
            (newApp as unknown as { dynamicFields?: Record<string, unknown> }).dynamicFields = { ...form.dynamicFields }
        }
        emit('confirm', newApp)
    }
    resetForm()
}

// 取消
const cancel = () => {
    emit('cancel')
    resetForm()
}

// 重置表单
const resetForm = () => {
    // 清除字段错误
    fieldErrors.value = {}
    
    if (isEditMode.value && props.app) {
        form.name = props.app.name || ''
        form.path = props.app.path || ''
        form.category = props.app.category || 'utility'
        form.description = props.app.description || ''
        form.icon = props.app.icon || ''
    form.dynamicFields = { ...((props.app as unknown as { dynamicFields?: Record<string, unknown> })?.dynamicFields || {}) }
    } else {
        form.name = ''
        form.path = ''
        form.category = 'utility'
        form.description = ''
        form.icon = ''
        form.dynamicFields = {}
        if (props.formDefaults) {
            if (props.formDefaults.name) form.name = props.formDefaults.name
            if (props.formDefaults.path) form.path = props.formDefaults.path
            if (props.formDefaults.category) form.category = props.formDefaults.category
            if (props.formDefaults.description) form.description = props.formDefaults.description
            if (props.formDefaults.icon) form.icon = props.formDefaults.icon
        }
        if (props.fields) {
            for (const [key, def] of Object.entries(props.fields)) {
                if (def.defaultValue !== undefined) form.dynamicFields[key] = def.defaultValue
            }
        }
    }
    iconError.value = false
}

// 监听显示状态变化，重置表单
watch(
    () => props.show,
    newValue => {
        if (newValue) {
            resetForm()
            // 分类默认由 formDefaults 或插件字段决定
        }
    },
)

// 监听图标变化，重置错误状态
watch(
    () => form.icon,
    () => {
        iconError.value = false
    },
)
</script>

<style scoped>
.add-app-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-weight: 500;
  color: rgb(55 65 81);
  font-size: 0.875rem;
}

.dark .field-label {
  color: rgb(229 231 235);
}

.required-marker {
  color: rgb(239 68 68);
  margin-left: 2px;
}

.field-error .field-label {
  color: rgb(239 68 68);
}

.field-error .field-input {
  border-color: rgb(239 68 68);
}

.field-error-message {
  font-size: 0.75rem;
  color: rgb(239 68 68);
  margin-top: 0.25rem;
}

.field-input {
  width: 100%;
}

.path-input-group,
.icon-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.path-input-group .field-input,
.icon-input-group .field-input {
  flex: 1;
}

.browse-btn {
  flex-shrink: 0;
  padding: 0.5rem;
}

.icon-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: 2px dashed rgb(209 213 219);
  border-radius: 8px;
  background-color: rgb(249 250 251);
}

.dark .preview-container {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
}

.preview-icon {
  max-width: 48px;
  max-height: 48px;
  object-fit: contain;
}

.icon-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: rgb(239 68 68);
  font-size: 0.75rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
