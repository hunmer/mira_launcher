import { registerBasicFields } from './basic'
import { registerFileFields } from './file'

// 注册所有字段类型
export function registerAllFields() {
  registerBasicFields()
  registerFileFields()
}

// 导出字段类型注册器
export { fieldTypeRegistry } from './index'
export type { FieldTypeConfig } from './index'
