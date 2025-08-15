// 插件 API 統一導出
// 提供給插件開發者使用的完整 API 套件

// 菜單 API
export {
  createMenuAPI,
  globalMenuAPI,
  menuUtils, PluginMenuAPI, type MenuEvents, type MenuRegistrationConfig, type PluginMenuItem
} from './MenuAPI'

// 快捷鍵 API
export {
  createShortcutManager,
  globalShortcutAPI, PluginShortcutAPI, shortcutUtils
} from './ShortcutAPI'

// 存儲 API
export {
  createStorageAPI,
  globalStorageAPI, PluginStorageAPI,
  PluginStorageAPIImpl, storageUtils
} from './StorageAPI'

// 通知 API
export {
  createNotificationAPI,
  globalNotificationAPI,
  notificationUtils, PluginNotificationAPI
} from './NotificationAPI'

// 沙箱環境
export {
  createSandbox,
  globalSandbox, PluginSandbox, sandboxUtils
} from './Sandbox'

// 進一步導入以供內部使用
import {
  createMenuAPI,
  globalMenuAPI,
  menuUtils
} from './MenuAPI'

import {
  createShortcutManager,
  globalShortcutAPI,
  shortcutUtils
} from './ShortcutAPI'

import {
  createStorageAPI,
  globalStorageAPI,
  storageUtils
} from './StorageAPI'

import {
  createNotificationAPI,
  globalNotificationAPI,
  notificationUtils
} from './NotificationAPI'

import {
  createSandbox,
  globalSandbox,
  sandboxUtils
} from './Sandbox'

/**
 * 創建完整的插件 API 套件
 */
export function createPluginAPIs(pluginId: string) {
  // 創建各個 API 實例
  const menuAPI = createMenuAPI()
  const shortcutAPI = createShortcutManager()
  const storageAPI = createStorageAPI()
  const notificationAPI = createNotificationAPI()
  const sandbox = createSandbox()

  // 設置插件上下文
  storageAPI.setCurrentPlugin(pluginId)

  // 創建沙箱環境
  const context = sandbox.createSandbox(pluginId, [
    'storage:read',
    'storage:write',
    'menu:read',
    'menu:write',
    'shortcut:read',
    'shortcut:write',
    'notification:show',
    'ui:component',
    'ui:route',
    'system:info'
  ], {
    menu: menuAPI,
    shortcut: shortcutAPI,
    storage: storageAPI,
    notification: notificationAPI
  })

  return {
    menu: menuAPI,
    shortcut: shortcutAPI,
    storage: storageAPI,
    notification: notificationAPI,
    sandbox: context,

    // 工具函數
    utils: {
      menu: menuUtils,
      shortcut: shortcutUtils,
      storage: storageUtils,
      notification: notificationUtils,
      sandbox: sandboxUtils
    }
  }
}

/**
 * 全局 API 實例（供系統內部使用）
 */
export const pluginAPIs = {
  menu: globalMenuAPI,
  shortcut: globalShortcutAPI,
  storage: globalStorageAPI,
  notification: globalNotificationAPI,
  sandbox: globalSandbox
}

/**
 * API 版本信息
 */
export const API_VERSION = '1.0.0'

/**
 * 支持的 API 列表
 */
export const SUPPORTED_APIS = [
  'menu',
  'shortcut',
  'storage',
  'notification',
  'sandbox'
] as const

export type SupportedAPI = typeof SUPPORTED_APIS[number]

// 類型重新導出
export type {
  ShortcutConfig,
  ShortcutEvents
} from './ShortcutAPI'

export type {
  StorageConfig,
  StorageEvents, StorageItem, StorageStats
} from './StorageAPI'

export type {
  NotificationConfig,
  NotificationEvents, NotificationItem, NotificationStats, NotificationType
} from './NotificationAPI'

export type {
  APICallRecord, SandboxContext,
  SandboxEvents, SandboxPermission, SandboxPolicy, SandboxStats
} from './Sandbox'

