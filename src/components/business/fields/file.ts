import type { FieldDefinition } from '@/stores/addEntries'
import { fieldTypeRegistry, type FieldTypeConfig } from './index'

// 路径字段配置
const pathFieldConfig: FieldTypeConfig = {
  component: 'PathField',
  props: (field: FieldDefinition) => ({
    placeholder: field.placeholder || '请选择文件夹路径',
    selectType: 'directory',
    readonly: true,
  }),
}

// 文件字段配置
const fileFieldConfig: FieldTypeConfig = {
  component: 'PathField',
  props: (field: FieldDefinition) => ({
    placeholder: field.placeholder || '请选择文件',
    selectType: 'file',
    readonly: true,
    filters: field.filters || [],
  }),
}

// 注册文件和路径字段类型
export function registerFileFields() {
  fieldTypeRegistry.register('path', pathFieldConfig)
  fieldTypeRegistry.register('file', fileFieldConfig)
}
