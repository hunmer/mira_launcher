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

            <div v-if="type !== 'url'" class="form-field">
                <label class="field-label">
                    {{ type === 'folder' ? '文件夹路径' : '文件路径' }}
                </label>
                <div class="path-input-group">
                    <Input
                        v-model="form.path"
                        :placeholder="
                            type === 'folder' ? '请输入文件夹路径' : '请输入文件路径'
                        "
                        class="field-input"
                    />
                    <Button
                        icon="pi pi-folder"
                        class="browse-btn"
                        title="浏览"
                        @click="selectPath"
                    />
                </div>
            </div>

            <div v-if="type === 'url'" class="form-field">
                <label class="field-label">网址</label>
                <Input
                    v-model="form.path"
                    placeholder="请输入网址 (如: https://www.example.com)"
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
                    label="添加"
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
import type { Application } from '@/stores/applications'
import { computed, reactive, ref, watch } from 'vue'

interface Props {
    show: boolean
    type: 'file' | 'folder' | 'url'
    categories: Array<{ label: string; value: string; icon: string }>
}

interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'confirm', app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): void
    (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isVisible = computed({
    get: () => props.show,
    set: value => emit('update:show', value),
})

const iconError = ref(false)

// 表单数据
const form = reactive({
    name: '',
    path: '',
    category: 'utility',
    description: '',
    icon: '',
})

// 对话框标题
const dialogTitle = computed(() => {
    switch (props.type) {
    case 'file':
        return '添加文件'
    case 'folder':
        return '添加文件夹'
    case 'url':
        return '添加网址'
    default:
        return '添加应用'
    }
})

// 分类选项（排除"全部应用"）
const categoryOptions = computed(() => {
    return props.categories.filter(cat => cat.value !== 'all')
})

// 表单验证
const isFormValid = computed(() => {
    return form.name.trim() !== '' && form.path.trim() !== ''
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

// 选择路径
const selectPath = async () => {
    try {
        if (props.type === 'folder') {
            // 选择文件夹
            // 这里可以集成 Tauri 的文件夹选择API
            console.log('选择文件夹')
        } else {
            // 选择文件
            // 这里可以集成 Tauri 的文件选择API
            console.log('选择文件')
        }
    } catch (error) {
        console.error('选择路径失败:', error)
    }
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

// 确认添加
const confirm = () => {
    if (!isFormValid.value) return

    const newApp: Omit<Application, 'id' | 'createdAt' | 'updatedAt'> = {
        name: form.name.trim(),
        path: form.path.trim(),
        category: form.category,
        type: props.type,
        isSystem: false,
        pinned: false,
    }

    // 只在有值时添加可选字段
    if (form.description.trim()) {
        newApp.description = form.description.trim()
    }
    if (form.icon.trim()) {
        newApp.icon = form.icon.trim()
    }

    emit('confirm', newApp)
    resetForm()
}

// 取消
const cancel = () => {
    emit('cancel')
    resetForm()
}

// 重置表单
const resetForm = () => {
    form.name = ''
    form.path = ''
    form.category = 'utility'
    form.description = ''
    form.icon = ''
    iconError.value = false
}

// 监听显示状态变化，重置表单
watch(
    () => props.show,
    newValue => {
        if (newValue) {
            resetForm()
            // 根据类型设置默认分类
            if (props.type === 'url') {
                form.category = 'productivity'
            } else if (props.type === 'folder') {
                form.category = 'files'
            }
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
