import * as CommonComponents from '@/components/common'
import * as GridComponents from '@/components/grid'
import * as IconComponents from '@/components/icons'
import * as LayoutComponents from '@/components/layout'
import * as UIComponents from '@/components/ui'
import type { App } from 'vue'

/**
 * 全局组件注册插件
 * 自动注册所有分类目录下的组件，实现全局可用
 */
export function registerGlobalComponents(app: App) {
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
    if (component &&
      typeof component === 'object' &&
      !name.startsWith('use') && // 排除 composables
      !name.endsWith('Props') && // 排除类型定义
      !name.endsWith('Options')) { // 排除选项类型
      try {
        app.component(name, component as any)
      } catch (error) {
        console.warn(`[Components Plugin] Failed to register component ${name}:`, error)
      }
    }
  })

  const registeredComponents = Object.keys(allComponents).filter(name =>
    !name.startsWith('use') &&
    !name.endsWith('Props') &&
    !name.endsWith('Options'),
  )

  console.log(`[Components Plugin] Registered ${registeredComponents.length} global components`)
  console.log('[Components Plugin] Components:', registeredComponents)
}

/**
 * 开发时组件热重载支持
 */
export function setupComponentDevtools(app: App) {
  if (import.meta.env.DEV) {
    // 开发环境下启用组件调试信息
    app.config.performance = true
    app.config.globalProperties['$componentRegistry'] = Object.keys({
      ...CommonComponents,
      ...LayoutComponents,
      ...UIComponents,
      ...IconComponents,
      ...GridComponents,
    })
  }
}
