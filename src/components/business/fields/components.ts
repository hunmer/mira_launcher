// 全局组件注册文件，用于注册字段组件
import type { App } from 'vue'
import PathField from '@/components/business/fields/PathField.vue'

export function registerFieldComponents(app: App) {
  app.component('PathField', PathField)
}

export { PathField }
