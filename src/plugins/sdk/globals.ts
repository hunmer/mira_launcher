/**
 * Plugin SDK Globals
 * This file makes the plugin SDK available globally for external plugins
 */

import { BasePlugin as AppBasePlugin } from '@/plugins/core/BasePlugin'

// Make the SDK available globally
declare global {
    interface Window {
        MiraLauncherSDK: {
            BasePlugin: typeof AppBasePlugin
        }
    }
}

// Initialize the global SDK
window.MiraLauncherSDK = {
    BasePlugin: AppBasePlugin
}

export { }

