import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// 精简内置类型：插件自定义 appType，不再在核心中区分 file/folder/url
export type AddEntryType = 'app' | 'test' | 'custom'

export interface AddEntry {
  id: string
  label: string
  icon: string
  type: AddEntryType // 'app' 为标准对话框入口，'custom' 自行处理，'test' 测试/分隔
  pluginId?: string
  priority?: number
  /** 应用类型（保存到应用数据中用于匹配执行），默认使用 id */
  appType?: string
  /** 可选：自定义执行处理（若为 custom 或 test） */
  handler?: () => void | Promise<void>
  /** 表单默认值（用于统一添加对话框初始化） */
  formDefaults?: Partial<{
    name: string
    path: string
    category: string
    description: string
    icon: string
  }>
  /** 动态字段定义（插件自定义） */
  fields?: Record<string, FieldDefinition>
  /** 应用启动执行（基于字段数据） */
  exec?: (ctx: { fields: Record<string, unknown>; appId?: string }) => Promise<boolean> | boolean
}

export interface FieldDefinition {
  label: string
  input: 'text' | 'textarea' | 'path' | 'file' | 'url' | 'number' | 'email' | 'password' | 'select' | 'checkbox'
  required?: boolean
  defaultValue?: unknown
  placeholder?: string
  /** 字段验证规则 */
  validation?: {
    pattern?: string
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    custom?: (value: unknown) => boolean | string
  }
  /** 选择框选项（当input为select时） */
  options?: Array<{ label: string; value: unknown }>
  /** 文件类型过滤器（当input为file时） */
  filters?: Array<{ name: string; extensions: string[] }>
  /** 字段描述 */
  description?: string
}

// 验证结果接口
interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// 验证AddEntry数据格式
function validateAddEntry(entry: AddEntry): ValidationResult {
  const errors: string[] = []

  // 必需字段验证
  if (!entry.id || typeof entry.id !== 'string') {
    errors.push('id字段是必需的且必须为字符串')
  }
  if (!entry.label || typeof entry.label !== 'string') {
    errors.push('label字段是必需的且必须为字符串')
  }
  if (!entry.icon || typeof entry.icon !== 'string') {
    errors.push('icon字段是必需的且必须为字符串')
  }
  if (!entry.type || !['app', 'test', 'custom'].includes(entry.type)) {
    errors.push('type字段必须为 app、test 或 custom')
  }

  // 类型特定验证
  if (entry.type === 'custom' && !entry.handler) {
    errors.push('custom类型的入口必须提供handler函数')
  }

  // 字段定义验证
  if (entry.fields) {
    for (const [key, field] of Object.entries(entry.fields)) {
      const fieldErrors = validateFieldDefinition(key, field)
      errors.push(...fieldErrors)
    }
  }

  // 优先级验证
  if (entry.priority !== undefined && (typeof entry.priority !== 'number' || entry.priority < 0)) {
    errors.push('priority必须为非负数')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// 验证字段定义
function validateFieldDefinition(key: string, field: FieldDefinition): string[] {
  const errors: string[] = []

  if (!field.label || typeof field.label !== 'string') {
    errors.push(`字段 ${key}: label是必需的且必须为字符串`)
  }

  const validInputTypes = ['text', 'textarea', 'path', 'file', 'url', 'number', 'email', 'password', 'select', 'checkbox']
  if (!field.input || !validInputTypes.includes(field.input)) {
    errors.push(`字段 ${key}: input类型无效，必须为 ${validInputTypes.join('、')} 之一`)
  }

  // select类型必须有options
  if (field.input === 'select' && (!field.options || !Array.isArray(field.options) || field.options.length === 0)) {
    errors.push(`字段 ${key}: select类型必须提供非空的options数组`)
  }

  // file类型的filters验证
  if (field.input === 'file' && field.filters) {
    if (!Array.isArray(field.filters)) {
      errors.push(`字段 ${key}: filters必须为数组`)
    } else {
      field.filters.forEach((filter, index) => {
        if (!filter.name || typeof filter.name !== 'string') {
          errors.push(`字段 ${key}: filters[${index}].name是必需的且必须为字符串`)
        }
        if (!filter.extensions || !Array.isArray(filter.extensions) || filter.extensions.length === 0) {
          errors.push(`字段 ${key}: filters[${index}].extensions是必需的且必须为非空数组`)
        }
      })
    }
  }

  // 验证validation规则
  if (field.validation) {
    const { validation } = field
    if (validation.min !== undefined && validation.max !== undefined && validation.min > validation.max) {
      errors.push(`字段 ${key}: validation.min不能大于validation.max`)
    }
    if (validation.minLength !== undefined && validation.maxLength !== undefined && validation.minLength > validation.maxLength) {
      errors.push(`字段 ${key}: validation.minLength不能大于validation.maxLength`)
    }
  }

  return errors
}

export const useAddEntriesStore = defineStore('addEntries', () => {
  const entries = ref<AddEntry[]>([])
  // 核心默认入口搬迁到各插件激活时注册（文件/文件夹=文件系统插件，网址=链接插件）

  const sortedEntries = computed(() => [...entries.value].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100)))

  const register = (entry: AddEntry) => {
    // 参数验证
    const validationResult = validateAddEntry(entry)
    if (!validationResult.isValid) {
      console.error('[AddEntriesStore] 注册失败 - 验证错误:', validationResult.errors)
      throw new Error(`插件入口注册失败: ${validationResult.errors.join(', ')}`)
    }

    // 检查ID冲突
    const existing = entries.value.find(e => e.id === entry.id)
    if (existing) {
      // 如果是相同插件的入口，允许更新
      if (existing.pluginId === entry.pluginId) {
        console.info(`[AddEntriesStore] 更新入口: ${entry.id}`)
        Object.assign(existing, entry)
      } else {
        // 不同插件的ID冲突，发出警告但允许覆盖
        console.warn(`[AddEntriesStore] ID冲突检测: ${entry.id} (原插件: ${existing.pluginId}, 新插件: ${entry.pluginId})`)
        Object.assign(existing, entry)
      }
    } else {
      console.info(`[AddEntriesStore] 注册新入口: ${entry.id} (插件: ${entry.pluginId || 'unknown'})`)
      entries.value.push(entry)
    }
  }

  const unregister = (id: string) => {
    const idx = entries.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      const removed = entries.value[idx]
      entries.value.splice(idx, 1)
      if (removed) {
        console.info(`[AddEntriesStore] 卸载入口: ${id} (插件: ${removed.pluginId || 'unknown'})`)
      }
    } else {
      console.warn(`[AddEntriesStore] 尝试卸载不存在的入口: ${id}`)
    }
  }

  const unregisterByPlugin = (pluginId: string) => {
    const before = entries.value.length
    entries.value = entries.value.filter(e => e.pluginId !== pluginId)
    const after = entries.value.length
    const removed = before - after
    if (removed > 0) {
      console.info(`[AddEntriesStore] 卸载插件 ${pluginId} 的 ${removed} 个入口`)
    }
    return removed
  }

  const validateAllEntries = () => {
    const results: Array<{ id: string; isValid: boolean; errors: string[] }> = []
    
    for (const entry of entries.value) {
      const validation = validateAddEntry(entry)
      results.push({
        id: entry.id,
        isValid: validation.isValid,
        errors: validation.errors,
      })
      
      if (!validation.isValid) {
        console.warn(`[AddEntriesStore] 入口 ${entry.id} 验证失败:`, validation.errors)
      }
    }
    
    return results
  }

  const getStats = () => {
    const byType = entries.value.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const byPlugin = entries.value.reduce((acc, entry) => {
      const plugin = entry.pluginId || 'built-in'
      acc[plugin] = (acc[plugin] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: entries.value.length,
      byType,
      byPlugin,
    }
  }

  return { 
    entries: sortedEntries, 
    register, 
    unregister, 
    unregisterByPlugin, 
    validateAllEntries, 
    getStats,
  }
})
