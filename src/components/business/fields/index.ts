import type { FieldDefinition } from '@/stores/addEntries'

// 字段类型映射接口
export interface FieldTypeConfig {
  component: string
  props: (field: FieldDefinition) => Record<string, unknown>
}

// 字段类型映射注册器
export class FieldTypeRegistry {
  private static instance: FieldTypeRegistry
  private typeMap: Record<string, FieldTypeConfig> = {}

  private constructor() {}

  static getInstance(): FieldTypeRegistry {
    if (!FieldTypeRegistry.instance) {
      FieldTypeRegistry.instance = new FieldTypeRegistry()
    }
    return FieldTypeRegistry.instance
  }

  register(type: string, config: FieldTypeConfig) {
    this.typeMap[type] = config
  }

  get(type: string): FieldTypeConfig | undefined {
    return this.typeMap[type]
  }

  getComponent(type: string): string {
    return this.typeMap[type]?.component || 'input'
  }

  getProps(type: string, field: FieldDefinition): Record<string, unknown> {
    return this.typeMap[type]?.props(field) || { placeholder: field.placeholder || '' }
  }

  getAll(): Record<string, FieldTypeConfig> {
    return { ...this.typeMap }
  }
}

// 导出单例实例
export const fieldTypeRegistry = FieldTypeRegistry.getInstance()
