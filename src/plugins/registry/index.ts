/**
 * Plugin Registry for Development
 * This file pre-registers plugins to avoid dynamic import issues with TypeScript
 */

import { BasePlugin } from '@/plugins/core/BasePlugin'

// Import plugin SDK types for external plugins
export * from '@/types/plugin'
export { BasePlugin }

// Plugin module type
type PluginModule = Record<string, unknown>
type PluginFactory = () => Promise<PluginModule>

// Global plugin registry
const pluginRegistry = new Map<string, PluginFactory>()

/**
 * Register a plugin factory function
 */
export function registerPlugin(id: string, factory: PluginFactory): void {
  pluginRegistry.set(id, factory)
}

/**
 * Get a registered plugin
 */
export function getRegisteredPlugin(
  id: string,
): PluginFactory | undefined {
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
 * Get plugin registration statistics
 */
export function getPluginRegistryStats() {
  return {
    totalRegistered: pluginRegistry.size,
    registeredIds: getRegisteredPluginIds(),
    timestamp: new Date().toISOString(),
  }
}

/**
 * Unregister a plugin
 */
export function unregisterPlugin(id: string): boolean {
  const existed = pluginRegistry.has(id)
  pluginRegistry.delete(id)
  if (existed) {
    console.log(`[PluginRegistry] Unregistered plugin: ${id}`)
  }
  return existed
}

/**
 * Clear all registered plugins
 */
export function clearPluginRegistry(): void {
  const count = pluginRegistry.size
  pluginRegistry.clear()
  console.log(`[PluginRegistry] Cleared ${count} registered plugins`)
}

/**
 * Plugin configuration interface
 */
interface PluginConfig {
  id: string
  name: string
  version: string
  description: string
  author: string
  entry: string
  dependencies?: string[]
  permissions?: string[]
  minAppVersion: string
  keywords?: string[]
}

/**
 * Register a plugin with better error handling and logging
 */
function registerPluginSafely(
  id: string,
  importPath: string,
  isJavaScript = false,
): void {
  registerPlugin(id, async (): Promise<PluginModule> => {
    console.log(`[PluginRegistry] Loading ${id}...`)
    try {
      let module: unknown
      if (isJavaScript) {
        // For JavaScript files, explicitly add .js extension
        module = await import(/* @vite-ignore */ `${importPath}.js`)
      } else {
        // For TypeScript files, let Vite handle the extension
        module = await import(/* @vite-ignore */ importPath)
      }
      console.log(`[PluginRegistry] ${id} loaded:`, module && typeof module === 'object' ? Object.keys(module as Record<string, unknown>) : 'No exports')
      return module as PluginModule
    } catch (error) {
      console.error(`[PluginRegistry] Failed to load ${id}:`, error)
      throw error
    }
  })
}

/**
 * Get plugin configuration from plugin.json
 */
async function getPluginConfig(pluginPath: string): Promise<PluginConfig | null> {
  try {
    const configPath = `${pluginPath}/plugin.json`
    const response = await fetch(configPath)
    if (!response.ok) {
      console.warn(`[PluginRegistry] No plugin.json found at ${configPath}`)
      return null
    }
    const config: PluginConfig = await response.json()
    return config
  } catch (error) {
    console.error(`[PluginRegistry] Failed to load plugin config from ${pluginPath}:`, error)
    return null
  }
}

/**
 * Automatically discover and register plugins from the plugins directory
 */
export async function registerPluginsAutomatically(): Promise<void> {
  // Get available plugin directories
  const pluginDirectories = await getAvailablePluginDirectories()

  console.log('[PluginRegistry] Starting automatic plugin discovery...')
  console.log(`[PluginRegistry] Found ${pluginDirectories.length} plugin directories to scan`)

  const registrationPromises = pluginDirectories.map(async (pluginDir: string) => {
    try {
      const pluginPath = `/plugins/${pluginDir}`
      const config = await getPluginConfig(pluginPath)
      
      if (!config) {
        console.warn(`[PluginRegistry] Skipping ${pluginDir} - no valid plugin.json`)
        return
      }

      console.log(`[PluginRegistry] Discovered plugin: ${config.id} (${config.name} v${config.version})`)
      
      // Validate plugin configuration
      if (!config.entry) {
        console.error(`[PluginRegistry] Plugin ${config.id} missing entry point`)
        return
      }
      
      // Determine if it's a JavaScript or TypeScript plugin based on entry file
      const isJavaScript = config.entry.endsWith('.js')
      const entryPath = config.entry.replace(/\.(js|ts)$/, '') // Remove extension for import
      const importPath = `../../../plugins/${pluginDir}/${entryPath}`
      
      // Register the plugin
      registerPluginSafely(config.id, importPath, isJavaScript)
      
      console.log(`[PluginRegistry] ✅ Registered ${config.id} (${isJavaScript ? 'JS' : 'TS'})`)
      
    } catch (error) {
      console.error(`[PluginRegistry] ❌ Failed to process plugin directory ${pluginDir}:`, error)
    }
  })

  // Wait for all plugin registrations to complete
  await Promise.allSettled(registrationPromises)
  const registeredCount = getRegisteredPluginIds().length
  console.log(`[PluginRegistry] 🎉 Plugin discovery completed. Total registered: ${registeredCount}/${pluginDirectories.length}`)
  
  if (registeredCount === 0) {
    console.warn('[PluginRegistry] ⚠️ No plugins were successfully registered')
  }
}

/**
 * Alternative method: Register plugins from a server-provided list
 * This would be useful if you want to dynamically fetch the plugin list from a server
 */
export async function registerPluginsFromServer(): Promise<void> {
  try {
    console.log('[PluginRegistry] Attempting server-based plugin discovery...')
    
    // For now, the server plugins.json is for marketplace, not local plugins
    // So we fall back to automatic discovery
    console.log('[PluginRegistry] Server plugin list is for marketplace, using local discovery')
    return registerPluginsAutomatically()
    
  } catch (error) {
    console.error('[PluginRegistry] Failed to fetch plugins from server:', error)
    console.log('[PluginRegistry] Falling back to static plugin discovery')
    return registerPluginsAutomatically()
  }
}

/**
 * Get all available plugins by scanning the plugins directory dynamically
 * This function now uses real plugin detection logic
 */
export async function getAvailablePluginDirectories(): Promise<string[]> {
  try {
    // In a browser environment, we can fetch the directory contents from the server
    // or use a pre-built manifest
    const response = await fetch('/plugins/manifest.json').catch(() => null)
    
    if (response && response.ok) {
      const manifest = await response.json()
      if (Array.isArray(manifest.plugins)) {
        console.log('[PluginRegistry] Using server-provided plugin manifest')
        return manifest.plugins.map((p: { directory?: string; id: string }) => p.directory || p.id)
      }
    }
    return []
  } catch (error) {
    console.error('[PluginRegistry] Failed to get available plugin directories:', error)
    // Ultimate fallback to empty array
    return []
  }
}

// Expose registry to window for debugging (development only)
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>)['__PLUGIN_REGISTRY__'] = {
    getRegisteredPluginIds,
    getRegisteredPlugin,
    isPluginRegistered,
    getPluginRegistryStats,
    unregisterPlugin,
    clearPluginRegistry,
    registerPluginsAutomatically,
    registerPluginsFromServer,
    getAvailablePluginDirectories,
    registrySize: () => pluginRegistry.size,
  }
  console.log(
    '[PluginRegistry] 🔧 Registry exposed to window.__PLUGIN_REGISTRY__ for debugging',
  )
}
