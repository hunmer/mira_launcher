import { ref } from 'vue'

// 布局状态
export type LayoutMode = 'grid' | 'list'
export type IconSize = 'small' | 'medium' | 'large'

const layoutMode = ref<LayoutMode>('grid')
const iconSizeMode = ref<IconSize>('medium')

// 图标大小映射
const iconSizeMap = {
  small: 48,
  medium: 72,
  large: 120,
}

export function useApplicationLayout() {
  const setLayoutMode = (mode: LayoutMode) => {
    layoutMode.value = mode
    localStorage.setItem('mira-layout-mode', mode)
    console.log('Layout mode changed to:', mode)
  }

  const setIconSize = (size: IconSize) => {
    iconSizeMode.value = size
    localStorage.setItem('mira-icon-size', size)
    console.log('Icon size changed to:', size)
  }

  const getIconSizePixels = () => {
    return iconSizeMap[iconSizeMode.value]
  }

  // 初始化时从本地存储加载设置
  const loadSettings = () => {
    const savedLayoutMode = localStorage.getItem(
      'mira-layout-mode',
    ) as LayoutMode
    const savedIconSize = localStorage.getItem('mira-icon-size') as IconSize

    if (savedLayoutMode && ['grid', 'list'].includes(savedLayoutMode)) {
      layoutMode.value = savedLayoutMode
    }

    if (savedIconSize && ['small', 'medium', 'large'].includes(savedIconSize)) {
      iconSizeMode.value = savedIconSize
    }
  }

  // 初始化
  loadSettings()

  return {
    layoutMode,
    iconSizeMode,
    setLayoutMode,
    setIconSize,
    getIconSizePixels,
    loadSettings,
  }
}
