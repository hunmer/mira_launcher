// Demo Plugin Type Definitions

export interface DemoPluginConfig {
  theme: {
    defaultMode: 'light' | 'dark' | 'auto'
    customColors: {
      primary: string
      secondary: string
      accent: string
    }
  }
  notifications: {
    enabled: boolean
    duration: number
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  }
  shortcuts: {
    enabled: boolean
    customizable: boolean
  }
  storage: {
    autoSave: boolean
    compressionEnabled: boolean
    maxSize: string
  }
  components: {
    defaultGridSize: 'small' | 'medium' | 'large'
    animationsEnabled: boolean
    autoLayout: boolean
  }
}

export interface DemoWidgetData {
  title: string
  content: string
  color: string
  counter: number
  createdAt?: string
  updatedAt?: string
}

export interface DemoPageState {
  widgetsCreated: number
  uptime: number
  interactions: number
  storageSize: string
}

export interface DemoPluginStatistics {
  totalWidgets: number
  totalInteractions: number
  totalStorageUsed: number
  pluginUptime: number
  lastActivity: string
}

export interface DemoNotificationOptions {
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  actions?: Array<{
    label: string
    action: () => void
  }>
}

export interface DemoShortcutDefinition {
  combination: string
  description: string
  action: () => void
  category: 'widget' | 'page' | 'notification' | 'system'
}

export interface DemoMenuItem {
  id: string
  label: string
  icon?: string
  action?: () => void
  submenu?: DemoMenuItem[]
  separator?: boolean
}

export interface DemoThemeDefinition {
  name: string
  mode: 'light' | 'dark' | 'auto'
  cssVariables: Record<string, string>
  styles: Record<string, string>
}

export interface DemoStorageData {
  key: string
  value: any
  timestamp: string
  size: number
  type: 'widget' | 'config' | 'cache' | 'user'
}

export interface DemoPluginAPI {
  grid: {
    registerItemType: (
      typeName: string,
      renderer: any,
      validator: (data: any) => boolean,
      defaultData: Record<string, any>
    ) => void
    addItem: (itemData: Partial<any>) => Promise<void>
    removeItem: (itemId: string) => Promise<void>
    updateItem: (itemId: string, data: Partial<any>) => Promise<void>
    unregisterItemType: (typeName: string) => void
  }
  page: {
    registerPage: (
      pageId: string,
      component: any,
      metadata: Record<string, any>
    ) => void
    unregisterPage: (pageId: string) => void
    activate: (pageId: string) => void
    deactivate: (pageId: string) => void
  }
  theme: {
    register: (themeData: DemoThemeDefinition) => void
    activate: (themeName: string) => void
    deactivate: (themeName: string) => void
    isActive: (themeName: string) => boolean
  }
  menu: {
    addMenuItem: (item: DemoMenuItem) => string
    removeMenuItem: (id: string) => void
    addContextMenu: (selector: string, items: DemoMenuItem[]) => void
  }
  shortcuts: {
    register: (combination: string, action: () => void) => void
    unregister: (combination: string) => void
    unregisterAll: () => void
  }
  storage: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
    remove: (key: string) => Promise<void>
    clear: () => Promise<void>
    watch: (key: string, callback: (value: any) => void) => () => void
  }
  notifications: {
    show: (
      message: string,
      type: DemoNotificationOptions['type'],
      options?: Omit<DemoNotificationOptions, 'type'>
    ) => void
    remove: (id: string) => void
    clear: () => void
  }
}

export interface DemoPluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  main: string
  keywords: string[]
  dependencies: string[]
  permissions: string[]
  compatibility: {
    mira: string
    node: string
  }
  engines: {
    vue: string
  }
}

export interface DemoPluginState {
  isActive: boolean
  isInitialized: boolean
  lastError?: Error
  statistics: DemoPluginStatistics
  config: DemoPluginConfig
}

// Vue 组件 Props 类型
export interface DemoWidgetProps {
  data: DemoWidgetData
}

export interface DemoPageProps {
  pluginApi?: DemoPluginAPI
  pluginId?: string
}

// 事件类型
export interface DemoPluginEvents {
  'plugin:activated': { pluginId: string; timestamp: string }
  'plugin:deactivated': { pluginId: string; timestamp: string }
  'widget:created': { widgetId: string; data: DemoWidgetData }
  'widget:updated': { widgetId: string; data: Partial<DemoWidgetData> }
  'widget:removed': { widgetId: string }
  'page:opened': { pageId: string; timestamp: string }
  'page:closed': { pageId: string; timestamp: string }
  'theme:changed': { themeName: string; mode: string }
  'storage:changed': { key: string; value: any; oldValue: any }
  'notification:shown': { id: string; message: string; type: string }
  'shortcut:triggered': { combination: string; timestamp: string }
}

// 工具类型
export type DemoEventCallback<T = any> = (data: T) => void
export type DemoEventUnsubscribe = () => void

export interface DemoEventBus {
  on<K extends keyof DemoPluginEvents>(
    event: K,
    callback: DemoEventCallback<DemoPluginEvents[K]>
  ): DemoEventUnsubscribe
  emit<K extends keyof DemoPluginEvents>(
    event: K,
    data: DemoPluginEvents[K]
  ): void
  off<K extends keyof DemoPluginEvents>(
    event: K,
    callback?: DemoEventCallback<DemoPluginEvents[K]>
  ): void
}

// 错误类型
export class DemoPluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DemoPluginError'
  }
}

// 常量定义
export const DEMO_PLUGIN_CONSTANTS = {
  PLUGIN_ID: 'demo-plugin',
  VERSION: '1.0.0',
  WIDGET_TYPE: 'demo-widget',
  PAGE_ID: 'demo-page',
  THEME_NAME: 'demo-theme',
  STORAGE_KEYS: {
    WIDGET_COUNT: 'demo-widget-count',
    INTERACTIONS: 'demo-interactions',
    COUNTER: 'demo-counter',
    CONFIG: 'demo-config',
    STATISTICS: 'demo-statistics'
  },
  SHORTCUTS: {
    MAIN_DEMO: 'ctrl+shift+d',
    ADD_WIDGET: 'ctrl+alt+w',
    SHOW_NOTIFICATIONS: 'ctrl+alt+n'
  },
  COLORS: [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
    '#EC4899', '#6366F1'
  ]
} as const
