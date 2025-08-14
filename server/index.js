import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import archiver from 'archiver'
import extractZip from 'extract-zip'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({ storage })

// 数据文件路径
const PLUGINS_JSON_PATH = path.join(__dirname, 'plugins.json')
const PLUGINS_DIR = path.join(__dirname, 'plugins')

// 工具函数
const readPluginsData = async () => {
  try {
    const data = await fs.readFile(PLUGINS_JSON_PATH, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('读取插件数据失败:', error)
    return []
  }
}

const writePluginsData = async (data) => {
  try {
    await fs.writeFile(PLUGINS_JSON_PATH, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('写入插件数据失败:', error)
    return false
  }
}

const ensurePluginDirectory = async (pluginId, version) => {
  const pluginDir = path.join(PLUGINS_DIR, pluginId, version)
  await fs.mkdir(pluginDir, { recursive: true })
  return pluginDir
}

const createZipFromDirectory = async (sourceDir, outputPath) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => {
      resolve(archive.pointer())
    })

    archive.on('error', (err) => {
      reject(err)
    })

    archive.pipe(output)
    archive.directory(sourceDir, false)
    archive.finalize()
  })
}

// API 路由

/**
 * 获取插件列表（支持条件查询）
 * GET /api/plugins
 * 查询参数：
 * - search: 搜索关键词
 * - category: 分类筛选
 * - verified: 是否认证
 * - featured: 是否精选
 * - minRating: 最低评分
 * - sort: 排序方式 (downloads, rating, name, updated)
 * - page: 页码
 * - limit: 每页数量
 */
app.get('/api/plugins', async (req, res) => {
  try {
    const plugins = await readPluginsData()
    let filteredPlugins = [...plugins]

    // 搜索筛选
    const { search, category, verified, featured, minRating, sort = 'downloads', page = 1, limit = 20 } = req.query

    if (search) {
      const searchLower = search.toLowerCase()
      filteredPlugins = filteredPlugins.filter(plugin =>
        plugin.name.toLowerCase().includes(searchLower) ||
        plugin.description.toLowerCase().includes(searchLower) ||
        plugin.author.name.toLowerCase().includes(searchLower) ||
        plugin.tags?.some(tag => tag.toLowerCase().includes(searchLower)),
      )
    }

    if (category) {
      filteredPlugins = filteredPlugins.filter(plugin => plugin.category === category)
    }

    if (verified !== undefined) {
      filteredPlugins = filteredPlugins.filter(plugin => plugin.verified === (verified === 'true'))
    }

    if (featured !== undefined) {
      filteredPlugins = filteredPlugins.filter(plugin => plugin.featured === (featured === 'true'))
    }

    if (minRating) {
      filteredPlugins = filteredPlugins.filter(plugin => plugin.rating >= parseFloat(minRating))
    }

    // 排序
    filteredPlugins.sort((a, b) => {
      switch (sort) {
      case 'rating':
        return b.rating - a.rating
      case 'name':
        return a.name.localeCompare(b.name)
      case 'updated':
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      case 'downloads':
      default:
        return b.downloads - a.downloads
      }
    })

    // 分页
    const startIndex = (parseInt(page) - 1) * parseInt(limit)
    const endIndex = startIndex + parseInt(limit)
    const paginatedPlugins = filteredPlugins.slice(startIndex, endIndex)

    res.json({
      success: true,
      data: paginatedPlugins,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredPlugins.length / parseInt(limit)),
        totalItems: filteredPlugins.length,
        itemsPerPage: parseInt(limit),
      },
    })
  } catch (error) {
    console.error('获取插件列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取插件列表失败',
      error: error.message,
    })
  }
})

/**
 * 获取单个插件详情
 * GET /api/plugins/:id
 */
app.get('/api/plugins/:id', async (req, res) => {
  try {
    const { id } = req.params
    const plugins = await readPluginsData()
    const plugin = plugins.find(p => p.id === id)

    if (!plugin) {
      return res.status(404).json({
        success: false,
        message: '插件未找到',
      })
    }

    res.json({
      success: true,
      data: plugin,
    })
  } catch (error) {
    console.error('获取插件详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取插件详情失败',
      error: error.message,
    })
  }
})

/**
 * 上传插件
 * POST /api/plugins/upload
 * Content-Type: multipart/form-data
 * 字段：
 * - pluginFile: 插件zip文件
 * - metadata: 插件元数据JSON字符串
 */
app.post('/api/plugins/upload', upload.single('pluginFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传插件文件',
      })
    }

    if (!req.body.metadata) {
      return res.status(400).json({
        success: false,
        message: '请提供插件元数据',
      })
    }

    const metadata = JSON.parse(req.body.metadata)
    const { id, version, name, description, author, category } = metadata

    if (!id || !version || !name || !description || !author || !category) {
      return res.status(400).json({
        success: false,
        message: '插件元数据不完整',
      })
    }

    // 检查插件是否已存在
    const plugins = await readPluginsData()
    const existingPluginIndex = plugins.findIndex(p => p.id === id)

    // 创建插件目录
    const pluginDir = await ensurePluginDirectory(id, version)
    const extractPath = path.join(pluginDir, 'src')
    
    // 解压插件文件
    await extractZip(req.file.path, { dir: extractPath })

    // 创建版本压缩包
    const zipPath = path.join(path.dirname(pluginDir), `${version}.zip`)
    await createZipFromDirectory(extractPath, zipPath)

    // 更新插件数据
    const now = new Date().toISOString()
    const pluginData = {
      ...metadata,
      size: (await fs.stat(zipPath)).size,
      downloads: existingPluginIndex >= 0 ? plugins[existingPluginIndex].downloads : 0,
      rating: existingPluginIndex >= 0 ? plugins[existingPluginIndex].rating : 0,
      lastUpdate: now.split('T')[0],
      versions: existingPluginIndex >= 0 
        ? [...new Set([...plugins[existingPluginIndex].versions, version])]
        : [version],
      createdAt: existingPluginIndex >= 0 ? plugins[existingPluginIndex].createdAt : now,
      updatedAt: now,
    }

    if (existingPluginIndex >= 0) {
      // 更新现有插件
      plugins[existingPluginIndex] = { ...plugins[existingPluginIndex], ...pluginData }
    } else {
      // 添加新插件
      plugins.push(pluginData)
    }

    await writePluginsData(plugins)

    // 清理上传的临时文件
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      message: '插件上传成功',
      data: pluginData,
    })
  } catch (error) {
    console.error('上传插件失败:', error)
    res.status(500).json({
      success: false,
      message: '上传插件失败',
      error: error.message,
    })
  }
})

/**
 * 删除插件
 * DELETE /api/plugins/:id
 * 可选查询参数：version - 删除特定版本，不提供则删除整个插件
 */
app.delete('/api/plugins/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { version } = req.query
    
    const plugins = await readPluginsData()
    const pluginIndex = plugins.findIndex(p => p.id === id)

    if (pluginIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '插件未找到',
      })
    }

    if (version) {
      // 删除特定版本
      const plugin = plugins[pluginIndex]
      const versionIndex = plugin.versions.indexOf(version)
      
      if (versionIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '版本未找到',
        })
      }

      // 删除版本文件
      const versionDir = path.join(PLUGINS_DIR, id, version)
      const zipPath = path.join(PLUGINS_DIR, id, `${version}.zip`)
      
      try {
        await fs.rm(versionDir, { recursive: true, force: true })
        await fs.unlink(zipPath)
      } catch (error) {
        console.warn('删除版本文件失败:', error.message)
      }

      // 更新版本列表
      plugin.versions.splice(versionIndex, 1)
      
      if (plugin.versions.length === 0) {
        // 如果没有版本了，删除整个插件
        plugins.splice(pluginIndex, 1)
        
        // 删除插件目录
        try {
          await fs.rm(path.join(PLUGINS_DIR, id), { recursive: true, force: true })
        } catch (error) {
          console.warn('删除插件目录失败:', error.message)
        }
      } else {
        // 更新当前版本为最新版本
        plugin.version = plugin.versions.sort().reverse()[0]
      }
    } else {
      // 删除整个插件
      plugins.splice(pluginIndex, 1)
      
      // 删除插件目录
      try {
        await fs.rm(path.join(PLUGINS_DIR, id), { recursive: true, force: true })
      } catch (error) {
        console.warn('删除插件目录失败:', error.message)
      }
    }

    await writePluginsData(plugins)

    res.json({
      success: true,
      message: version ? '版本删除成功' : '插件删除成功',
    })
  } catch (error) {
    console.error('删除插件失败:', error)
    res.status(500).json({
      success: false,
      message: '删除插件失败',
      error: error.message,
    })
  }
})

/**
 * 检查更新
 * POST /api/plugins/check-updates
 * Body: [{ id: string, version: string }]
 */
app.post('/api/plugins/check-updates', async (req, res) => {
  try {
    const clientPlugins = req.body
    
    if (!Array.isArray(clientPlugins)) {
      return res.status(400).json({
        success: false,
        message: '请求格式错误，需要插件数组',
      })
    }

    const plugins = await readPluginsData()
    const updates = []

    for (const clientPlugin of clientPlugins) {
      const { id, version } = clientPlugin
      const serverPlugin = plugins.find(p => p.id === id)
      
      if (serverPlugin) {
        // 简单版本比较（假设版本格式为 x.y.z）
        const clientVersion = version.split('.').map(Number)
        const serverVersion = serverPlugin.version.split('.').map(Number)
        
        let hasUpdate = false
        for (let i = 0; i < Math.max(clientVersion.length, serverVersion.length); i++) {
          const cv = clientVersion[i] || 0
          const sv = serverVersion[i] || 0
          if (sv > cv) {
            hasUpdate = true
            break
          } else if (sv < cv) {
            break
          }
        }
        
        if (hasUpdate) {
          updates.push({
            id,
            currentVersion: version,
            latestVersion: serverPlugin.version,
            updateInfo: {
              name: serverPlugin.name,
              description: serverPlugin.description,
              features: serverPlugin.features,
              lastUpdate: serverPlugin.lastUpdate,
            },
          })
        }
      }
    }

    res.json({
      success: true,
      data: updates,
      hasUpdates: updates.length > 0,
    })
  } catch (error) {
    console.error('检查更新失败:', error)
    res.status(500).json({
      success: false,
      message: '检查更新失败',
      error: error.message,
    })
  }
})

/**
 * 下载插件
 * GET /api/plugins/:id/download
 * 查询参数：version - 指定版本，不提供则下载最新版本
 */
app.get('/api/plugins/:id/download', async (req, res) => {
  try {
    const { id } = req.params
    const { version } = req.query
    
    const plugins = await readPluginsData()
    const plugin = plugins.find(p => p.id === id)

    if (!plugin) {
      return res.status(404).json({
        success: false,
        message: '插件未找到',
      })
    }

    const downloadVersion = version || plugin.version
    
    if (!plugin.versions.includes(downloadVersion)) {
      return res.status(404).json({
        success: false,
        message: '版本未找到',
      })
    }

    const zipPath = path.join(PLUGINS_DIR, id, `${downloadVersion}.zip`)
    
    try {
      await fs.access(zipPath)
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: '插件文件不存在',
      })
    }

    // 增加下载计数
    plugin.downloads = (plugin.downloads || 0) + 1
    await writePluginsData(plugins)

    // 设置下载响应头
    res.setHeader('Content-Disposition', `attachment; filename="${id}-${downloadVersion}.zip"`)
    res.setHeader('Content-Type', 'application/zip')

    // 发送文件
    const fileStream = await fs.readFile(zipPath)
    res.send(fileStream)
  } catch (error) {
    console.error('下载插件失败:', error)
    res.status(500).json({
      success: false,
      message: '下载插件失败',
      error: error.message,
    })
  }
})

/**
 * 获取服务器状态
 * GET /api/status
 */
app.get('/api/status', async (req, res) => {
  try {
    const plugins = await readPluginsData()
    
    res.json({
      success: true,
      data: {
        status: 'online',
        totalPlugins: plugins.length,
        serverVersion: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取状态失败',
      error: error.message,
    })
  }
})

// 错误处理中间件
app.use((error, req, res) => {
  console.error('服务器错误:', error)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : '内部错误',
  })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端点未找到',
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Mira Launcher 插件服务器运行在端口 ${PORT}`)
  console.log(`📂 插件目录: ${PLUGINS_DIR}`)
  console.log(`📝 数据文件: ${PLUGINS_JSON_PATH}`)
  console.log(`🌐 API 地址: http://localhost:${PORT}/api`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...')
  process.exit(0)
})
