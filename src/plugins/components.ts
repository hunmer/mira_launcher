import type { App } from 'vue'
import * as CommonComponents from '@/components/common'
import * as LayoutComponents from '@/components/layout'
import * as UIComponents from '@/components/ui'
import * as IconComponents from '@/components/icons'
import * as GridComponents from '@/components/grid'

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

  // 注册所有组件为全局组件
  Object.entries(allComponents).forEach(([name, component]) => {
    if (component && typeof component === 'object' && 'name' in component) {
      app.component(name, component)
    }
  })

  console.log(`[Components Plugin] Registered ${Object.keys(allComponents).length} global components`)
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
