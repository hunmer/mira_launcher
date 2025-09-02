/* eslint-disable no-console */
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

// Get plugins directory from command line argument or use default
const getPluginsDir = () => {
  const argIndex = process.argv.findIndex(arg => arg === '--plugins-dir')
  if (argIndex !== -1 && process.argv[argIndex + 1]) {
    const customPath = process.argv[argIndex + 1]
    return path.isAbsolute(customPath) ? customPath : path.join(projectRoot, customPath)
  }
  return path.join(projectRoot, 'plugins')
}

const pluginsDir = getPluginsDir()

async function compileTypeScriptFile(filePath, outputPath) {
  try {
    // Use esbuild for fast TypeScript compilation with bundling
    // Bundle is enabled to resolve internal module dependencies in eval environment
    const { stderr } = await execAsync(
      `npx esbuild "${filePath}" --outfile="${outputPath}" --format=esm --target=es2020 --bundle --platform=browser --loader:.ts=ts --external:vue --external:@tauri-apps/*`,
    )
    
    if (stderr) {
      console.warn(`Warning compiling ${filePath}:`, stderr)
    }
    
    console.log(`✅ Compiled ${path.basename(filePath)} -> ${path.basename(outputPath)}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to compile ${filePath}:`, error.message)
    return false
  }
}

async function compilePlugins() {
  console.log('🔨 Compiling TypeScript plugins...')
  console.log(`📁 Using plugins directory: ${pluginsDir}`)
  
  if (!fs.existsSync(pluginsDir)) {
    console.error(`❌ Plugins directory does not exist: ${pluginsDir}`)
    return
  }
  
  const pluginDirs = fs.readdirSync(pluginsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  
  for (const pluginDir of pluginDirs) {
    const pluginPath = path.join(pluginsDir, pluginDir)
    const indexTsPath = path.join(pluginPath, 'index.ts')
    const indexJsPath = path.join(pluginPath, 'index.js')
    
    // Only compile if TypeScript file exists and JavaScript doesn't exist or is older
    if (fs.existsSync(indexTsPath)) {
      let shouldCompile = !fs.existsSync(indexJsPath)
      
      if (!shouldCompile) {
        const tsStats = fs.statSync(indexTsPath)
        const jsStats = fs.statSync(indexJsPath)
        shouldCompile = tsStats.mtime > jsStats.mtime
      }
      
      if (shouldCompile) {
        console.log(`📦 Compiling plugin: ${pluginDir}`)
        await compileTypeScriptFile(indexTsPath, indexJsPath)
      } else {
        console.log(`✨ Plugin ${pluginDir} is up to date`)
      }
    }
  }
  
  console.log('🎉 Plugin compilation complete!')
}

// Run if called directly
if (process.argv[1].endsWith('compile-plugins.js')) {
  // Show help if requested
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage: node compile-plugins.js [options]

Options:
  --plugins-dir <path>    Specify plugins directory (default: ./plugins)
  --help, -h             Show this help message

Examples:
  node compile-plugins.js
  node compile-plugins.js --plugins-dir ./my-plugins
  node compile-plugins.js --plugins-dir /absolute/path/to/plugins
    `)
    process.exit(0)
  }
  
  compilePlugins().catch(console.error)
}

export { compilePlugins }

