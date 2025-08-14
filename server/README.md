# Mira Launcher 插件服务器

这是 Mira Launcher 的插件管理服务器，提供插件的上传、下载、管理等功能。

## 功能特性

- 🚀 插件上传与管理
- 📦 插件版本控制
- 🔍 条件查询与搜索
- ⬇️ 插件下载与分发
- 🔄 插件更新检查
- 📊 下载统计
- 🏷️ 插件分类与标签

## 快速开始

### 启动服务器

```bash
# 方法1: 使用启动脚本 (推荐)
./start.sh

# 方法2: 直接启动
npm install
npm start

# 方法3: 开发模式 (自动重启)
npm run dev
```

### 环境变量

- `PORT`: 服务器端口 (默认: 3001)
- `NODE_ENV`: 运行环境 (development/production)

## API 接口

### 基础信息

- **基础URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`

### 接口列表

#### 1. 获取插件列表
```
GET /api/plugins
```

**查询参数:**
- `search`: 搜索关键词
- `category`: 分类筛选 (productivity/development/entertainment/system/network/design)
- `verified`: 是否认证 (true/false)
- `featured`: 是否精选 (true/false) 
- `minRating`: 最低评分 (0-5)
- `sort`: 排序方式 (downloads/rating/name/updated)
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)

**响应示例:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

#### 2. 获取插件详情
```
GET /api/plugins/:id
```

#### 3. 上传插件
```
POST /api/plugins/upload
Content-Type: multipart/form-data
```

**字段:**
- `pluginFile`: 插件zip文件
- `metadata`: 插件元数据JSON字符串

**元数据格式:**
```json
{
  "id": "plugin-id",
  "name": "插件名称",
  "version": "1.0.0",
  "description": "插件描述",
  "author": {
    "name": "作者名",
    "email": "email@example.com"
  },
  "category": "productivity",
  "tags": ["标签1", "标签2"],
  "features": ["特性1", "特性2"]
}
```

#### 4. 删除插件
```
DELETE /api/plugins/:id?version=1.0.0
```

#### 5. 检查更新
```
POST /api/plugins/check-updates
Content-Type: application/json

[
  { "id": "plugin-id", "version": "1.0.0" }
]
```

#### 6. 下载插件
```
GET /api/plugins/:id/download?version=1.0.0
```

#### 7. 服务器状态
```
GET /api/status
```

## 目录结构

```
server/
├── index.js           # 主服务器文件
├── package.json       # 项目配置
├── plugins.json       # 插件数据库
├── start.sh          # 启动脚本
├── plugins/          # 插件存储目录
│   └── demo/         # 示例插件
│       ├── 1.0.0/    # 版本目录
│       │   └── src/  # 源码文件
│       └── 1.0.0.zip # 版本压缩包
└── uploads/          # 临时上传目录
```

## 插件结构

每个插件应该包含以下文件:

```
plugin/
├── config.json       # 插件配置
├── metadata.json     # 插件元数据
├── index.ts         # 主入口文件
├── package.json     # 依赖配置
├── components/      # Vue组件
├── styles/         # 样式文件
└── assets/         # 静态资源
```

## 开发说明

### 添加新接口

1. 在 `index.js` 中添加路由处理函数
2. 遵循RESTful API设计原则
3. 添加适当的错误处理
4. 更新API文档

### 数据格式

插件数据存储在 `plugins.json` 中，格式如下:

```json
{
  "id": "unique-plugin-id",
  "name": "插件名称",
  "description": "插件描述",
  "version": "1.0.0",
  "versions": ["1.0.0", "0.9.0"],
  "author": {
    "name": "作者名",
    "email": "email@example.com",
    "avatar": "头像URL"
  },
  "category": "分类",
  "rating": 4.5,
  "downloads": 1000,
  "size": 1024000,
  "verified": true,
  "featured": false,
  "tags": ["标签"],
  "features": ["特性"],
  "lastUpdate": "2025-08-14",
  "createdAt": "2025-08-14T00:00:00.000Z",
  "updatedAt": "2025-08-14T00:00:00.000Z"
}
```

## 注意事项

1. 上传的插件文件会自动解压到版本目录
2. 每个版本都会生成对应的zip压缩包
3. 删除插件时会同时清理相关文件
4. 支持多版本并存，可以单独删除特定版本
5. 下载会自动增加下载计数

## 许可证

MIT License
