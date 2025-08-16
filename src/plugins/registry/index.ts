/**
 * Plugin Registry for Development
 * This file pre-registers plugins to avoid dynamic import issues with TypeScript
 */

import { BasePlugin } from '@/plugins/core/BasePlugin'

// Import plugin SDK types for external plugins
export * from '@/types/plugin'
export { BasePlugin }

// Global plugin registry
const pluginRegistry = new Map<string, () => Promise<any>>()

/**
 * Register a plugin factory function
 */
export function registerPlugin(id: string, factory: () => Promise<any>): void {
  pluginRegistry.set(id, factory)
}

/**
 * Get a registered plugin
 */
export function getRegisteredPlugin(id: string): (() => Promise<any>) | undefined {
  return pluginRegistry.get(id)
}

/**
 * Get all registered plugin IDs
 */
export function getRegisteredPluginIds(): string[] {
  return Array.from(pluginRegistry.keys())
}

/**
 * Check if a plugin is registered
 */
export function isPluginRegistered(id: string): boolean {
  return pluginRegistry.has(id)
}

/**
 * Register a plugin with better error handling and logging
 */
function registerPluginSafely(id: string, importPath: string, isJavaScript = false): void {
  registerPlugin(id, async () => {
    console.log(`[PluginRegistry] Loading ${id}...`)
    try {
      let module: any
      if (isJavaScript) {
        // For JavaScript files, explicitly add .js extension
        module = await import(`${importPath}.js` as any)
      } else {
        // For TypeScript files, let Vite handle the extension
        module = await import(importPath)
      }
      console.log(`[PluginRegistry] ${id} loaded:`, Object.keys(module))
      return module
    } catch (error) {
      console.error(`[PluginRegistry] Failed to load ${id}:`, error)
      throw error
    }
  })
}

// Pre-register known plugins for development
// This avoids the dynamic import issues

console.log('[PluginRegistry] Starting plugin registration...')

try {
  // JavaScript plugins
  registerPluginSafely('minimal-test-plugin', '../../../plugins/minimal-test-plugin/index', true)
  registerPluginSafely('simple-test-plugin-js', '../../../plugins/simple-test-plugin-js/index', true)

  // TypeScript plugins
  registerPluginSafely('simple-test-plugin', '../../../plugins/simple-test-plugin/index')
  registerPluginSafely('file-system-plugin', '../../../plugins/file-system-plugin/index')
  registerPluginSafely('test-plugin', '../../../plugins/test-plugin/index')
  registerPluginSafely('web-link-plugin', '../../../plugins/web-link-plugin/index')

  console.log('[PluginRegistry] All plugins registered successfully')
} catch (error) {
  console.error('[PluginRegistry] Error during plugin registration:', error)
}

console.log('[PluginRegistry] Registered plugins:', getRegisteredPluginIds())

// Expose registry to window for debugging (development only)
if (import.meta.env.DEV) {
  (window as any).__PLUGIN_REGISTRY__ = {
    getRegisteredPluginIds,
    getRegisteredPlugin,
    isPluginRegistered,
    registrySize: () => pluginRegistry.size,
  }
  console.log('[PluginRegistry] Registry exposed to window.__PLUGIN_REGISTRY__ for debugging')
}
