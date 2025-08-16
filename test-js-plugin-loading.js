/**
 * JavaScript Plugin Loading Test
 * Run this in the browser console to test JavaScript plugin loading
 */

// Test the registry directly
async function testJavaScriptPluginLoading() {
  console.log('=== JavaScript Plugin Loading Test ===')

  try {
    // Test direct import of JavaScript plugin
    console.log('1. Testing direct import of simple-test-plugin-js...')
    const jsPlugin = await import('../plugins/simple-test-plugin-js/index.js')
    console.log('✅ JS Plugin import successful:', Object.keys(jsPlugin))

    // Test creating an instance
    const PluginClass = jsPlugin.default || jsPlugin.SimpleTestPlugin
    if (PluginClass) {
      const instance = new PluginClass()
      console.log('✅ JS Plugin instance created:', {
        id: instance.id,
        name: instance.name,
        version: instance.version,
        hasSetAPI: typeof instance._setAPI === 'function',
      })
    } else {
      console.log('❌ JS Plugin class not found in module')
    }
  } catch (error) {
    console.log('❌ JS Plugin import failed:', error.message)
  }

  try {
    // Test minimal plugin
    console.log('2. Testing direct import of minimal-test-plugin...')
    const minimalPlugin = await import('../plugins/minimal-test-plugin/index.js')
    console.log('✅ Minimal Plugin import successful:', Object.keys(minimalPlugin))
  } catch (error) {
    console.log('❌ Minimal Plugin import failed:', error.message)
  }

  console.log('=== Test Complete ===')
}

// Auto-run the test
testJavaScriptPluginLoading()

// Also test plugin registry
console.log('Plugin Registry Status:')
if (window.__PLUGIN_REGISTRY__) {
  console.log('Registry available:', Object.keys(window.__PLUGIN_REGISTRY__))
} else {
  console.log('Registry not exposed to window object')
}
