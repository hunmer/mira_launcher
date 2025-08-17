import * as CommonComponents from '@/components/common'
import * as GridComponents from '@/components/grid'
import * as IconComponents from '@/components/icons'
import * as LayoutComponents from '@/components/layout'
import * as UIComponents from '@/components/ui'
import type { App, Component } from 'vue'
import type { BasePlugin } from './core/BasePlugin'

/**
 * 动态组件注册信息
 */
export interface DynamicComponent {
  /** 组件名称 */
  name: string
  /** 组件实例 */
  component: Component
  /** 来源插件ID */
  pluginId: string
  /** 注册时间 */
  registeredAt: Date
  /** 是否已注册到Vue应用 */
  isRegistered: boolean
  /** 组件元数据 */
  metadata?: {
    description?: string
    version?: string
    tags?: string[]
  }
}

/**
 * 组件注册表
 */
class ComponentRegistry {
  private app: App | null = null
  private dynamicComponents: Map<string, DynamicComponent> = new Map()
  private componentsByPlugin: Map<string, string[]> = new Map()

  /**
   * 设置Vue应用实例
   */
  setApp(app: App): void {
    this.app = app
  }

  /**
   * 注册插件组件
   */
  registerPluginComponents(plugin: BasePlugin): void {
    if (!this.app) {
      console.warn('[ComponentRegistry] Vue app not initialized')
      return
    }

    const pluginId = plugin.metadata.id
    const components = plugin.getComponents()
    const registeredNames: string[] = []

    for (const [name, componentDef] of Object.entries(components)) {
      try {
        // 检查组件名称冲突
        if (this.dynamicComponents.has(name)) {
          const existing = this.dynamicComponents.get(name)!
          console.warn(
            `[ComponentRegistry] Component name conflict: ${name} (existing: ${existing.pluginId}, new: ${pluginId})`,
          )
          continue
        }

        // 注册组件到Vue应用
        this.app.component(name, componentDef.component)

        // 记录动态组件信息
        const dynamicComponent: DynamicComponent = {
          name,
          component: componentDef.component,
          pluginId,
          registeredAt: new Date(),
          isRegistered: true,
          ...(componentDef.metadata && { metadata: componentDef.metadata }),
        }

        this.dynamicComponents.set(name, dynamicComponent)
        registeredNames.push(name)

        console.log(
          `[ComponentRegistry] Registered component: ${name} from plugin ${pluginId}`,
        )
      } catch (error) {
        console.error(
          `[ComponentRegistry] Failed to register component ${name} from plugin ${pluginId}:`,
          error,
        )
      }
    }

    // 记录插件的组件列表
    this.componentsByPlugin.set(pluginId, registeredNames)

    if (registeredNames.length > 0) {
      console.log(
        `[ComponentRegistry] Plugin ${pluginId} registered ${registeredNames.length} components:`,
        registeredNames,
      )
    }
  }

  /**
   * 注销插件组件
   */
  unregisterPluginComponents(pluginId: string): void {
    const componentNames = this.componentsByPlugin.get(pluginId) || []

    for (const name of componentNames) {
      const dynamicComponent = this.dynamicComponents.get(name)
      if (dynamicComponent && dynamicComponent.pluginId === pluginId) {
        // 从Vue应用中移除组件（注意：Vue 3没有直接的unregister方法）
        if (this.app && this.app._context.components) {
          delete this.app._context.components[name]
        }

        // 从注册表移除
        this.dynamicComponents.delete(name)
        console.log(
          `[ComponentRegistry] Unregistered component: ${name} from plugin ${pluginId}`,
        )
      }
    }

    this.componentsByPlugin.delete(pluginId)

    if (componentNames.length > 0) {
      console.log(
        `[ComponentRegistry] Plugin ${pluginId} unregistered ${componentNames.length} components`,
      )
    }
  }

  /**
   * 获取动态组件
   */
  getDynamicComponent(name: string): DynamicComponent | null {
    return this.dynamicComponents.get(name) || null
  }

  /**
   * 获取所有动态组件
   */
  getAllDynamicComponents(): DynamicComponent[] {
    return Array.from(this.dynamicComponents.values())
  }

  /**
   * 获取插件的组件列表
   */
  getPluginComponents(pluginId: string): DynamicComponent[] {
    const componentNames = this.componentsByPlugin.get(pluginId) || []
    return componentNames
      .map(name => this.dynamicComponents.get(name))
      .filter((comp): comp is DynamicComponent => comp !== undefined)
  }

  /**
   * 检查组件是否已注册
   */
  hasComponent(name: string): boolean {
    return (
      this.dynamicComponents.has(name) ||
      this.app?._context.components?.[name] !== undefined
    )
  }

  /**
   * 获取组件统计
   */
  getStats(): {
    totalDynamicComponents: number
    componentsByPlugin: Record<string, number>
    recentlyRegistered: DynamicComponent[]
    } {
    const componentsByPlugin: Record<string, number> = {}

    for (const [pluginId, components] of this.componentsByPlugin) {
      componentsByPlugin[pluginId] = components.length
    }

    // 获取最近注册的组件（最后5个）
    const recentlyRegistered = Array.from(this.dynamicComponents.values())
      .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime())
      .slice(0, 5)

    return {
      totalDynamicComponents: this.dynamicComponents.size,
      componentsByPlugin,
      recentlyRegistered,
    }
  }

  /**
   * 清空所有动态组件
   */
  clear(): void {
    // 从Vue应用中移除所有动态组件
    if (this.app && this.app._context.components) {
      for (const name of this.dynamicComponents.keys()) {
        delete this.app._context.components[name]
      }
    }

    this.dynamicComponents.clear()
    this.componentsByPlugin.clear()
    console.log('[ComponentRegistry] All dynamic components cleared')
  }
}

/**
 * 全局组件注册表实例
 */
export const componentRegistry = new ComponentRegistry()

/**
 * 全局组件注册插件
 * 自动注册所有分类目录下的组件，实现全局可用
 */
export function registerGlobalComponents(app: App) {
  // 设置应用实例到组件注册表
  componentRegistry.setApp(app)

  // 合并所有组件分类
  const allComponents = {
    ...CommonComponents,
    ...LayoutComponents,
    ...UIComponents,
    ...IconComponents,
    ...GridComponents,
  }

  // 注册所有组件为全局组件，过滤掉非组件的导出
  Object.entries(allComponents).forEach(([name, component]) => {
    // 检查是否是 Vue 组件（排除函数等其他导出）
    if (
      component &&
      typeof component === 'object' &&
      !name.startsWith('use') && // 排除 composables
      !name.endsWith('Props') && // 排除类型定义
      !name.endsWith('Options')
    ) {
      // 排除选项类型
      try {
        app.component(name, component as Component)
      } catch (error) {
        console.warn(
          `[Components Plugin] Failed to register component ${name}:`,
          error,
        )
      }
    }
  })

  const registeredComponents = Object.keys(allComponents).filter(
    name =>
      !name.startsWith('use') &&
      !name.endsWith('Props') &&
      !name.endsWith('Options'),
  )

  console.log(
    `[Components Plugin] Registered ${registeredComponents.length} global components`,
  )
  console.log('[Components Plugin] Components:', registeredComponents)
}

/**
 * 开发时组件热重载支持
 */
export function setupComponentDevtools(app: App) {
  if (import.meta.env.DEV) {
    // 开发环境下启用组件调试信息
    app.config.performance = true
    const staticComponents = Object.keys({
      ...CommonComponents,
      ...LayoutComponents,
      ...UIComponents,
      ...IconComponents,
      ...GridComponents,
    })

    // 添加动态组件信息
    app.config.globalProperties['$componentRegistry'] = {
      static: staticComponents,
      dynamic: () =>
        componentRegistry.getAllDynamicComponents().map(c => c.name),
      stats: () => componentRegistry.getStats(),
    }
  }
}

/**
 * 插件组件管理工具函数
 */
export const pluginComponentUtils = {
  /**
   * 为插件注册组件
   */
  registerComponents: (plugin: BasePlugin) => {
    componentRegistry.registerPluginComponents(plugin)
  },

  /**
   * 为插件注销组件
   */
  unregisterComponents: (pluginId: string) => {
    componentRegistry.unregisterPluginComponents(pluginId)
  },

  /**
   * 获取插件组件
   */
  getPluginComponents: (pluginId: string) => {
    return componentRegistry.getPluginComponents(pluginId)
  },

  /**
   * 检查组件是否存在
   */
  hasComponent: (name: string) => {
    return componentRegistry.hasComponent(name)
  },

  /**
   * 获取组件信息
   */
  getComponentInfo: (name: string) => {
    return componentRegistry.getDynamicComponent(name)
  },

  /**
   * 获取统计信息
   */
  getStats: () => {
    return componentRegistry.getStats()
  },
}
