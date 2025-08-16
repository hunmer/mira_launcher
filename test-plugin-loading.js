/**
 * Test script to check plugin loading functionality
 * Run this in the browser console to debug plugin loading issues
 */

console.log('=== Plugin Loading Test ===')

// Check if plugin registry is working
console.log('1. Checking plugin registry...')
try {
  const registry = window.__PLUGIN_REGISTRY__ || {}
  console.log('Registry contents:', Object.keys(registry))
} catch (e) {
  console.log('Registry not accessible:', e.message)
}

// Check if plugin store has loaded plugins
console.log('2. Checking plugin store...')
try {
  // This would need to be adapted based on how the Vue app exposes the store
  console.log('Plugin store check - would need Vue app instance')
} catch (e) {
  console.log('Plugin store not accessible:', e.message)
}

// Test dynamic import of a plugin
console.log('3. Testing direct plugin import...')
import('../plugins/minimal-test-plugin/index.js')
  .then(module => {
    console.log('✅ Direct import successful:', Object.keys(module))
    console.log('Plugin class:', module.default || module.MinimalTestPlugin)
  })
  .catch(error => {
    console.log('❌ Direct import failed:', error.message)
  })

// Test plugin registry import
console.log('4. Testing registry import...')
import('../plugins/simple-test-plugin/index')
  .then(module => {
    console.log('✅ Registry import successful:', Object.keys(module))
  })
  .catch(error => {
    console.log('❌ Registry import failed:', error.message)
  })

console.log('=== Test Complete ===')
