<template>
  <div class="path-field">
    <div class="path-input-group">
      <Input
        :model-value="modelValue"
        :placeholder="placeholder || '请选择路径'"
        :readonly="readonly || false"
        class="field-input"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <Button
        icon="pi pi-folder-open"
        class="browse-btn"
        title="浏览文件夹"
        @click="browsePath"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'

interface Props {
  modelValue?: string
  placeholder?: string
  readonly?: boolean
  selectType?: 'file' | 'directory' | 'both'
  multiple?: boolean
  filters?: Array<{ name: string; extensions: string[] }>
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请选择路径',
  readonly: false,
  selectType: 'both',
  multiple: false,
  filters: () => [],
})

const emit = defineEmits<Emits>()

const browsePath = async () => {
  try {
    // 动态导入 Tauri 的 dialog API
    const { open } = await import('@tauri-apps/plugin-dialog')
    
    let result: string | string[] | null = null
    
    if (props.selectType === 'file') {
      // 选择文件
      const options = {
        multiple: props.multiple,
        title: '选择文件',
        ...(props.filters.length > 0 && { filters: props.filters }),
      }
      result = await open(options)
    } else if (props.selectType === 'directory') {
      // 选择文件夹
      result = await open({
        directory: true,
        multiple: props.multiple,
        title: '选择文件夹',
      })
    } else {
      // 选择文件或文件夹（默认为文件）
      const options = {
        multiple: props.multiple,
        title: '选择文件或文件夹',
        ...(props.filters.length > 0 && { filters: props.filters }),
      }
      result = await open(options)
    }
    
    if (result) {
      // 如果是多选，join成字符串；如果是单选，直接使用
      const path = Array.isArray(result) ? result.join(';') : result
      emit('update:modelValue', path)
    }
  } catch (error) {
    console.error('选择路径时出错:', error)
  }
}
</script>

<style scoped>
.path-field {
  width: 100%;
}

.path-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.field-input {
  flex: 1;
}

.browse-btn {
  flex-shrink: 0;
  padding: 0.5rem;
}
</style>
