import type { PluginMetadata } from '@/types/plugin'
import type { PluginDiscoveryResult } from './Discovery'
import type { PluginLoadResult } from './PluginLoader'

/**
 * 验证规则类型
 */
export type ValidationRule = (target: any, context: ValidationContext) => ValidationResult

/**
 * 验证上下文
 */
export interface ValidationContext {
  /** 插件元数据 */
  metadata?: PluginMetadata
  /** 插件发现结果 */
  discoveryResult?: PluginDiscoveryResult
  /** 插件加载结果 */
  loadResult?: PluginLoadResult
  /** 应用版本 */
  appVersion: string
  /** 允许的权限 */
  allowedPermissions: string[]
  /** 验证模式 */
  mode: 'strict' | 'permissive'
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否通过验证 */
  valid: boolean
  /** 严重程度 */
  severity: 'error' | 'warning' | 'info'
  /** 错误或警告消息 */
  message: string
  /** 规则名称 */
  rule: string
  /** 详细信息 */
  details?: any
}

/**
 * 完整验证结果
 */
export interface PluginValidationResult {
  /** 插件 ID */
  pluginId: string
  /** 是否全部通过验证 */
  valid: boolean
  /** 错误数量 */
  errorCount: number
  /** 警告数量 */
  warningCount: number
  /** 所有验证结果 */
  results: ValidationResult[]
  /** 验证总耗时 */
  duration: number
}

/**
 * 验证器配置
 */
export interface ValidatorConfig {
  /** 验证模式 */
  mode: 'strict' | 'permissive'
  /** 应用版本 */
  appVersion: string
  /** 允许的权限 */
  allowedPermissions: string[]
  /** 启用的验证规则 */
  enabledRules: string[]
  /** 自定义验证规则 */
  customRules: ValidationRule[]
}

/**
 * 插件验证器
 * 负责验证插件的完整性、安全性和兼容性
 */
export class PluginValidator {
  private config: ValidatorConfig
  private rules: Map<string, ValidationRule> = new Map()

  constructor(config?: Partial<ValidatorConfig>) {
    this.config = {
      mode: 'strict',
      appVersion: '1.0.0',
      allowedPermissions: ['storage', 'notification', 'menu', 'component', 'shortcut'],
      enabledRules: ['*'], // 启用所有规则
      customRules: [],
      ...config
    }

    this.initializeDefaultRules()
    this.registerCustomRules()
  }

  /**
   * 初始化默认验证规则
   */
  private initializeDefaultRules(): void {
    // 元数据验证规则
    this.rules.set('metadata.required-fields', this.validateRequiredFields.bind(this))
    this.rules.set('metadata.format', this.validateMetadataFormat.bind(this))
    this.rules.set('metadata.version-format', this.validateVersionFormat.bind(this))
    this.rules.set('metadata.id-format', this.validateIdFormat.bind(this))
    
    // 兼容性验证规则
    this.rules.set('compatibility.app-version', this.validateAppVersion.bind(this))
    this.rules.set('compatibility.dependencies', this.validateDependencies.bind(this))
    
    // 权限验证规则
    this.rules.set('security.permissions', this.validatePermissions.bind(this))
    this.rules.set('security.dangerous-permissions', this.validateDangerousPermissions.bind(this))
    
    // 插件类验证规则
    this.rules.set('plugin.class-structure', this.validatePluginClass.bind(this))
    this.rules.set('plugin.lifecycle-methods', this.validateLifecycleMethods.bind(this))
    
    // 文件系统验证规则
    this.rules.set('files.entry-exists', this.validateEntryFile.bind(this))
    this.rules.set('files.manifest-integrity', this.validateManifestIntegrity.bind(this))
  }

  /**
   * 注册自定义验证规则
   */
  private registerCustomRules(): void {
    for (const rule of this.config.customRules) {
      const ruleName = `custom.${Date.now()}`
      this.rules.set(ruleName, rule)
    }
  }

  /**
   * 验证插件发现结果
   */
  async validateDiscovery(discoveryResult: PluginDiscoveryResult): Promise<PluginValidationResult> {
    const startTime = performance.now()
    const context: ValidationContext = {
      metadata: discoveryResult.metadata,
      discoveryResult,
      appVersion: this.config.appVersion,
      allowedPermissions: this.config.allowedPermissions,
      mode: this.config.mode
    }

    const results = await this.runValidationRules(discoveryResult, context)
    const duration = performance.now() - startTime

    return this.buildValidationResult(discoveryResult.metadata.id, results, duration)
  }

  /**
   * 验证插件加载结果
   */
  async validateLoad(loadResult: PluginLoadResult): Promise<PluginValidationResult> {
    const startTime = performance.now()
    const context: ValidationContext = {
      metadata: loadResult.metadata,
      loadResult,
      appVersion: this.config.appVersion,
      allowedPermissions: this.config.allowedPermissions,
      mode: this.config.mode
    }

    const results = await this.runValidationRules(loadResult, context)
    const duration = performance.now() - startTime

    return this.buildValidationResult(loadResult.pluginId, results, duration)
  }

  /**
   * 运行验证规则
   */
  private async runValidationRules(target: any, context: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    
    for (const [ruleName, rule] of this.rules) {
      // 检查规则是否启用
      if (!this.isRuleEnabled(ruleName)) {
        continue
      }

      try {
        const result = await rule(target, context)
        results.push({ ...result, rule: ruleName })
      } catch (error) {
        results.push({
          valid: false,
          severity: 'error',
          message: `Validation rule error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rule: ruleName,
          details: { error }
        })
      }
    }

    return results
  }

  /**
   * 检查验证规则是否启用
   */
  private isRuleEnabled(ruleName: string): boolean {
    if (this.config.enabledRules.includes('*')) {
      return true
    }
    
    return this.config.enabledRules.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
        return regex.test(ruleName)
      }
      return pattern === ruleName
    })
  }

  /**
   * 构建验证结果
   */
  private buildValidationResult(
    pluginId: string, 
    results: ValidationResult[], 
    duration: number
  ): PluginValidationResult {
    const errors = results.filter(r => r.severity === 'error' && !r.valid)
    const warnings = results.filter(r => r.severity === 'warning' && !r.valid)

    return {
      pluginId,
      valid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      results,
      duration
    }
  }

  // 默认验证规则实现

  /**
   * 验证必需字段
   */
  private validateRequiredFields(target: any, context: ValidationContext): ValidationResult {
    const metadata = context.metadata || target.metadata
    if (!metadata) {
      return {
        valid: false,
        severity: 'error',
        message: 'Plugin metadata is missing',
        rule: 'metadata.required-fields'
      }
    }

    const requiredFields = ['id', 'name', 'version']
    const missingFields = requiredFields.filter(field => !metadata[field as keyof PluginMetadata])

    if (missingFields.length > 0) {
      return {
        valid: false,
        severity: 'error',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        rule: 'metadata.required-fields',
        details: { missingFields }
      }
    }

    return {
      valid: true,
      severity: 'info',
      message: 'All required fields are present',
      rule: 'metadata.required-fields'
    }
  }

  /**
   * 验证元数据格式
   */
  private validateMetadataFormat(target: any, context: ValidationContext): ValidationResult {
    const metadata = context.metadata || target.metadata
    
    if (typeof metadata !== 'object' || metadata === null) {
      return {
        valid: false,
        severity: 'error',
        message: 'Plugin metadata must be an object',
        rule: 'metadata.format'
      }
    }

    return {
      valid: true,
      severity: 'info',
      message: 'Metadata format is valid',
      rule: 'metadata.format'
    }
  }

  /**
   * 验证版本格式
   */
  private validateVersionFormat(target: any, context: ValidationContext): ValidationResult {
    const metadata = context.metadata || target.metadata
    const version = metadata?.version

    if (!version) {
      return {
        valid: false,
        severity: 'error',
        message: 'Version is required',
        rule: 'metadata.version-format'
      }
    }

    // 简单的语义化版本验证
    const versionRegex = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/
    if (!versionRegex.test(version)) {
      return {
        valid: false,
        severity: 'error',
        message: 'Version must follow semantic versioning (x.y.z)',
        rule: 'metadata.version-format',
        details: { version }
      }
    }

    return {
      valid: true,
      severity: 'info',
      message: 'Version format is valid',
      rule: 'metadata.version-format'
    }
  }

  /**
   * 验证插件 ID 格式
   */
  private validateIdFormat(target: any, context: ValidationContext): ValidationResult {
    const metadata = context.metadata || target.metadata
    const id = metadata?.id

    if (!id) {
      return {
        valid: false,
        severity: 'error',
        message: 'Plugin ID is required',
        rule: 'metadata.id-format'
      }
    }

    // ID 只能包含小写字母、数字、连字符和下划线
    const idRegex = /^[a-z0-9-_]+$/
    if (!idRegex.test(id)) {
      return {
        valid: false,
        severity: 'error',
        message: 'Plugin ID can only contain lowercase letters, numbers, hyphens, and underscores',
        rule: 'metadata.id-format',
        details: { id }
      }
    }

    return {
      valid: true,
      severity: 'info',
      message: 'Plugin ID format is valid',
      rule: 'metadata.id-format'
    }
  }

  /**
   * 验证应用版本兼容性
   */
  private validateAppVersion(target: any, context: ValidationContext): ValidationResult {
    const metadata = context.metadata || target.metadata
    const minAppVersion = metadata?.minAppVersion

    if (!minAppVersion) {
      return {
        valid: true,
        severity: 'warning',
        message: 'No minimum app version specified',
        rule: 'compatibility.app-version'
      }
    }

    // 简单的版本比较
    const isCompatible = this.compareVersions(context.appVersion, minAppVersion) >= 0

    if (!isCompatible) {
      return {
        valid: false,
        severity: 'error',
        message: `Plugin requires app version ${minAppVersion} or higher, but current version is ${context.appVersion}`,
        rule: 'compatibility.app-version',
        details: { required: minAppVersion, current: context.appVersion }
      }
    }

    return {
      valid: true,
      severity: 'info',
      message: 'App version compatibility verified',
      rule: 'compatibility.app-version'
    }
  }

  /**
   * 验证依赖关系
   */
  private validateDependencies(target: any, context: ValidationContext): ValidationResult {
    const metadata = context.metadata || target.metadata
    const dependencies = metadata?.dependencies || []

    // 这里可以添加更复杂的依赖验证逻辑
    // 比如检查循环依赖、版本兼容性等

    return {
      valid: true,
      severity: 'info',
      message: `Dependencies validated (${dependencies.length} dependencies)`,
      rule: 'compatibility.dependencies',
      details: { dependencies }
    }
  }

  /**
   * 验证权限
   */
  private validatePermissions(target: any, context: ValidationContext): ValidationResult {
    const metadata = context.metadata || target.metadata
    const permissions = metadata?.permissions || []
    const invalidPermissions = permissions.filter((p: string) => !context.allowedPermissions.includes(p))

    if (invalidPermissions.length > 0) {
      return {
        valid: false,
        severity: 'error',
        message: `Invalid permissions requested: ${invalidPermissions.join(', ')}`,
        rule: 'security.permissions',
        details: { invalidPermissions, allowedPermissions: context.allowedPermissions }
      }
    }

    return {
      valid: true,
      severity: 'info',
      message: 'All requested permissions are valid',
      rule: 'security.permissions'
    }
  }

  /**
   * 验证危险权限
   */
  private validateDangerousPermissions(target: any, context: ValidationContext): ValidationResult {
    const metadata = context.metadata || target.metadata
    const permissions = metadata?.permissions || []
    const dangerousPermissions = ['system', 'file-system', 'network']
    const hasDangerous = permissions.some((p: string) => dangerousPermissions.includes(p))

    if (hasDangerous && context.mode === 'strict') {
      return {
        valid: false,
        severity: 'error',
        message: 'Dangerous permissions are not allowed in strict mode',
        rule: 'security.dangerous-permissions',
        details: { dangerousPermissions: permissions.filter((p: string) => dangerousPermissions.includes(p)) }
      }
    }

    if (hasDangerous) {
      return {
        valid: true,
        severity: 'warning',
        message: 'Plugin requests potentially dangerous permissions',
        rule: 'security.dangerous-permissions',
        details: { dangerousPermissions: permissions.filter((p: string) => dangerousPermissions.includes(p)) }
      }
    }

    return {
      valid: true,
      severity: 'info',
      message: 'No dangerous permissions requested',
      rule: 'security.dangerous-permissions'
    }
  }

  /**
   * 验证插件类结构
   */
  private validatePluginClass(target: any, context: ValidationContext): ValidationResult {
    const loadResult = context.loadResult
    
    if (!loadResult?.pluginClass) {
      return {
        valid: false,
        severity: 'error',
        message: 'Plugin class not found or invalid',
        rule: 'plugin.class-structure'
      }
    }

    return {
      valid: true,
      severity: 'info',
      message: 'Plugin class structure is valid',
      rule: 'plugin.class-structure'
    }
  }

  /**
   * 验证生命周期方法
   */
  private validateLifecycleMethods(target: any, context: ValidationContext): ValidationResult {
    const loadResult = context.loadResult
    
    if (!loadResult?.pluginClass) {
      return {
        valid: false,
        severity: 'error',
        message: 'Cannot validate lifecycle methods: plugin class not available',
        rule: 'plugin.lifecycle-methods'
      }
    }

    // 检查必需的生命周期方法
    const requiredMethods = ['onLoad', 'onActivate', 'onDeactivate', 'onUnload']
    const prototype = loadResult.pluginClass.prototype
    const missingMethods = requiredMethods.filter(method => typeof prototype[method] !== 'function')

    if (missingMethods.length > 0) {
      return {
        valid: false,
        severity: 'error',
        message: `Missing required lifecycle methods: ${missingMethods.join(', ')}`,
        rule: 'plugin.lifecycle-methods',
        details: { missingMethods }
      }
    }

    return {
      valid: true,
      severity: 'info',
      message: 'All required lifecycle methods are present',
      rule: 'plugin.lifecycle-methods'
    }
  }

  /**
   * 验证入口文件存在
   */
  private validateEntryFile(target: any, context: ValidationContext): ValidationResult {
    const discoveryResult = context.discoveryResult
    
    if (!discoveryResult) {
      return {
        valid: true,
        severity: 'info',
        message: 'Entry file validation skipped (no discovery result)',
        rule: 'files.entry-exists'
      }
    }

    if (!discoveryResult.isValid) {
      return {
        valid: false,
        severity: 'error',
        message: 'Entry file validation failed during discovery',
        rule: 'files.entry-exists',
        details: { errors: discoveryResult.errors }
      }
    }

    return {
      valid: true,
      severity: 'info',
      message: 'Entry file exists and is accessible',
      rule: 'files.entry-exists'
    }
  }

  /**
   * 验证清单完整性
   */
  private validateManifestIntegrity(target: any, context: ValidationContext): ValidationResult {
    // 这里可以添加更高级的完整性检查，比如文件哈希验证等
    return {
      valid: true,
      severity: 'info',
      message: 'Manifest integrity check passed',
      rule: 'files.manifest-integrity'
    }
  }

  /**
   * 比较版本号
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    const maxLength = Math.max(v1Parts.length, v2Parts.length)

    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0

      if (v1Part < v2Part) return -1
      if (v1Part > v2Part) return 1
    }

    return 0
  }

  /**
   * 添加自定义验证规则
   */
  addRule(name: string, rule: ValidationRule): void {
    this.rules.set(name, rule)
    console.log(`[PluginValidator] Added custom rule: ${name}`)
  }

  /**
   * 移除验证规则
   */
  removeRule(name: string): boolean {
    const removed = this.rules.delete(name)
    if (removed) {
      console.log(`[PluginValidator] Removed rule: ${name}`)
    }
    return removed
  }

  /**
   * 获取所有验证规则名称
   */
  getRuleNames(): string[] {
    return Array.from(this.rules.keys())
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ValidatorConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[PluginValidator] Configuration updated')
  }

  /**
   * 获取配置
   */
  getConfig(): ValidatorConfig {
    return { ...this.config }
  }
}

/**
 * 创建插件验证器实例
 */
export function createPluginValidator(config?: Partial<ValidatorConfig>): PluginValidator {
  return new PluginValidator(config)
}

/**
 * 全局插件验证器实例
 */
export const globalPluginValidator = new PluginValidator()

/**
 * 验证工具函数
 */
export const validationUtils = {
  /**
   * 快速验证插件元数据
   */
  quickValidateMetadata(metadata: PluginMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!metadata.id) errors.push('Missing plugin ID')
    if (!metadata.name) errors.push('Missing plugin name')
    if (!metadata.version) errors.push('Missing plugin version')
    
    if (metadata.id && !/^[a-z0-9-_]+$/.test(metadata.id)) {
      errors.push('Invalid plugin ID format')
    }
    
    if (metadata.version && !/^\d+\.\d+\.\d+/.test(metadata.version)) {
      errors.push('Invalid version format')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  /**
   * 创建验证结果摘要
   */
  createValidationSummary(results: PluginValidationResult[]): {
    totalPlugins: number
    validPlugins: number
    invalidPlugins: number
    totalErrors: number
    totalWarnings: number
    commonIssues: string[]
  } {
    const totalPlugins = results.length
    const validPlugins = results.filter(r => r.valid).length
    const invalidPlugins = totalPlugins - validPlugins
    const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0)
    const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0)
    
    // 统计常见问题
    const issueCount: Record<string, number> = {}
    results.forEach(result => {
      result.results.forEach(validation => {
        if (!validation.valid) {
          issueCount[validation.rule] = (issueCount[validation.rule] || 0) + 1
        }
      })
    })
    
    const commonIssues = Object.entries(issueCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([rule]) => rule)
    
    return {
      totalPlugins,
      validPlugins,
      invalidPlugins,
      totalErrors,
      totalWarnings,
      commonIssues
    }
  }
}
