import type { FieldDefinition } from '@/stores/addEntries'
import { fieldTypeRegistry, type FieldTypeConfig } from './index'

// 基础文本输入字段
const textFieldConfig: FieldTypeConfig = {
  component: 'input',
  props: (field: FieldDefinition) => ({
    type: 'text',
    placeholder: field.placeholder || '',
  }),
}

// 文本域字段
const textareaFieldConfig: FieldTypeConfig = {
  component: 'textarea',
  props: (field: FieldDefinition) => ({
    placeholder: field.placeholder || '',
    rows: 3,
    style: { resize: 'vertical' },
  }),
}

// 数字输入字段
const numberFieldConfig: FieldTypeConfig = {
  component: 'input',
  props: (field: FieldDefinition) => ({
    type: 'number',
    placeholder: field.placeholder || '请输入数字',
  }),
}

// 邮箱输入字段
const emailFieldConfig: FieldTypeConfig = {
  component: 'input',
  props: (field: FieldDefinition) => ({
    type: 'email',
    placeholder: field.placeholder || '请输入邮箱地址',
  }),
}

// 密码输入字段
const passwordFieldConfig: FieldTypeConfig = {
  component: 'input',
  props: (field: FieldDefinition) => ({
    type: 'password',
    placeholder: field.placeholder || '请输入密码',
  }),
}

// URL 输入字段
const urlFieldConfig: FieldTypeConfig = {
  component: 'input',
  props: (field: FieldDefinition) => ({
    type: 'url',
    placeholder: field.placeholder || 'https://example.com',
  }),
}

// 选择字段
const selectFieldConfig: FieldTypeConfig = {
  component: 'select',
  props: (field: FieldDefinition) => ({
    placeholder: field.placeholder || '请选择',
    options: field.options || [],
  }),
}

// 复选框字段
const checkboxFieldConfig: FieldTypeConfig = {
  component: 'input',
  props: (_field: FieldDefinition) => ({
    type: 'checkbox',
  }),
}

// 注册基础字段类型
export function registerBasicFields() {
  fieldTypeRegistry.register('text', textFieldConfig)
  fieldTypeRegistry.register('textarea', textareaFieldConfig)
  fieldTypeRegistry.register('number', numberFieldConfig)
  fieldTypeRegistry.register('email', emailFieldConfig)
  fieldTypeRegistry.register('password', passwordFieldConfig)
  fieldTypeRegistry.register('url', urlFieldConfig)
  fieldTypeRegistry.register('select', selectFieldConfig)
  fieldTypeRegistry.register('checkbox', checkboxFieldConfig)
}
