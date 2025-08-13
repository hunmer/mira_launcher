# Demo Plugin Assets

这个目录包含演示插件的静态资源文件。

## 文件结构

```
assets/
├── icons/           # 图标文件
├── images/          # 图片资源
├── fonts/           # 字体文件
└── data/            # 静态数据文件
```

## 使用说明

在插件代码中引用资源文件时，可以使用相对路径：

```typescript
// 引用图标
import iconPath from './assets/icons/demo-icon.svg'

// 引用图片
import imagePath from './assets/images/banner.png'

// 引用数据文件
import configData from './assets/data/config.json'
```

## 资源优化

- 图标使用 SVG 格式以获得最佳的缩放效果
- 图片进行适当压缩以减少插件大小
- 字体文件仅包含必要的字符集
- 数据文件使用压缩格式
