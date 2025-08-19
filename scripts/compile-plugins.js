/* eslint-disable no-console */
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')
const pluginsDir = path.join(projectRoot, 'plugins')

async function compileTypeScriptFile(filePath, outputPath) {
  try {
    // Use esbuild for fast TypeScript compilation
    const { stderr } = await execAsync(
      `npx esbuild "${filePath}" --outfile="${outputPath}" --format=esm --target=es2020 --bundle=false --platform=browser --loader:.ts=ts`,
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
  compilePlugins().catch(console.error)
}

export { compilePlugins }

