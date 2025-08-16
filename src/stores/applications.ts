import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface Application {
    id: string
    name: string
    path: string
    icon?: string
    category: string
    lastUsed?: Date
    pinned?: boolean
    type: 'file' | 'folder' | 'url' | 'app'
    description?: string
    tags?: string[]
    isSystem?: boolean
    version?: string
    size?: number
    createdAt: Date
    updatedAt: Date
}

export interface Category {
    label: string
    value: string
    icon: string
}

export const useApplicationsStore = defineStore('applications', () => {
  // 应用列表
  const applications = ref<Application[]>([])

  // 分类选项
  const categories = ref<Category[]>([
    { label: '全部应用', value: 'all', icon: 'pi pi-th-large' },
    { label: '开发工具', value: 'development', icon: 'pi pi-code' },
    { label: '生产力', value: 'productivity', icon: 'pi pi-briefcase' },
    { label: '设计工具', value: 'design', icon: 'pi pi-palette' },
    { label: '娱乐', value: 'entertainment', icon: 'pi pi-play' },
    { label: '实用工具', value: 'utility', icon: 'pi pi-wrench' },
    { label: '系统工具', value: 'system', icon: 'pi pi-cog' },
    { label: '文件管理', value: 'files', icon: 'pi pi-folder' },
  ])

  // 页面相关
  const currentPageIndex = ref(0)
  const totalPages = ref(5)
  const gridColumns = ref(4)
  const appsPerPage = computed(() => gridColumns.value * 4)

  // 过滤相关
  const selectedCategory = ref('all')

  // 计算属性
  const filteredApplications = computed(() => {
    let apps = applications.value
    if (selectedCategory.value !== 'all') {
      apps = apps.filter(app => app.category === selectedCategory.value)
    }
    return apps
  })

  const pageApplications = computed(() => {
    const pages: Application[][] = []
    const apps = filteredApplications.value

    for (let i = 0; i < totalPages.value; i++) {
      const startIndex = i * appsPerPage.value
      const endIndex = startIndex + appsPerPage.value
      pages.push(apps.slice(startIndex, endIndex))
    }

    return pages
  })

  const currentPageApps = computed(() => {
    return pageApplications.value[currentPageIndex.value] || []
  })

  // 本地存储键名
  const STORAGE_KEY = 'mira-applications'
  const PAGE_SETTINGS_KEY = 'mira-page-settings'

  // 方法
  const loadApplications = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        applications.value = parsed.map((app: Partial<Application> & { 
          lastUsed?: string | Date
          createdAt: string | Date
          updatedAt: string | Date
        }) => ({
          ...app,
          lastUsed: app.lastUsed ? new Date(app.lastUsed) : undefined,
          createdAt: new Date(app.createdAt),
          updatedAt: new Date(app.updatedAt),
        })) as Application[]
      } else {
        // 如果没有存储数据，初始化默认数据
        initDefaultApplications()
      }
    } catch (error) {
      console.error('加载应用数据失败:', error)
      initDefaultApplications()
    }
  }

  const saveApplications = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications.value))
    } catch (error) {
      console.error('保存应用数据失败:', error)
    }
  }

  const loadPageSettings = () => {
    try {
      const stored = localStorage.getItem(PAGE_SETTINGS_KEY)
      if (stored) {
        const settings = JSON.parse(stored)
        currentPageIndex.value = settings.currentPageIndex || 0
        totalPages.value = settings.totalPages || 5
        gridColumns.value = settings.gridColumns || 4
        selectedCategory.value = settings.selectedCategory || 'all'
      }
    } catch (error) {
      console.error('加载页面设置失败:', error)
    }
  }

  const savePageSettings = () => {
    try {
      const settings = {
        currentPageIndex: currentPageIndex.value,
        totalPages: totalPages.value,
        gridColumns: gridColumns.value,
        selectedCategory: selectedCategory.value,
      }
      localStorage.setItem(PAGE_SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('保存页面设置失败:', error)
    }
  }

  const addApplication = (app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newApp: Application = {
      ...app,
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    applications.value.push(newApp)
    saveApplications()
    return newApp
  }

  const updateApplication = (id: string, updates: Partial<Application>) => {
    const index = applications.value.findIndex(app => app.id === id)
    if (index !== -1) {
      const currentApp = applications.value[index]
      if (currentApp) {
        // 只更新提供的字段，保持其他字段不变
        for (const [key, value] of Object.entries(updates)) {
          if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
            (currentApp as Record<string, unknown>)[key] = value
          }
        }
        currentApp.updatedAt = new Date()
        saveApplications()
        return currentApp
      }
    }
    return null
  }

  const removeApplication = (id: string) => {
    const index = applications.value.findIndex(app => app.id === id)
    if (index !== -1) {
      const removed = applications.value.splice(index, 1)[0]
      saveApplications()
      return removed
    }
    return null
  }

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages.value) {
      currentPageIndex.value = pageIndex
      savePageSettings()
    }
  }

  const addPage = () => {
    totalPages.value++
    savePageSettings()
  }

  const removePage = (_pageIndex?: number) => {
    if (totalPages.value <= 1) return false

    // 如果删除的是当前页且不是最后一页，则移动到前一页
    if (currentPageIndex.value === totalPages.value - 1 && currentPageIndex.value > 0) {
      currentPageIndex.value--
    }

    totalPages.value--
    savePageSettings()
    return true
  }

  const setCategory = (category: string) => {
    selectedCategory.value = category
    currentPageIndex.value = 0 // 切换分类时回到第一页
    savePageSettings()
  }

  const setGridColumns = (columns: number) => {
    gridColumns.value = columns
    savePageSettings()
  }

  const updateLastUsed = (id: string) => {
    const app = applications.value.find(app => app.id === id)
    if (app) {
      app.lastUsed = new Date()
      app.updatedAt = new Date()
      saveApplications()
    }
  }

  const togglePin = (id: string) => {
    const app = applications.value.find(app => app.id === id)
    if (app) {
      app.pinned = !app.pinned
      app.updatedAt = new Date()
      saveApplications()
      return app.pinned
    }
    return false
  }

  // 初始化默认应用数据
  const initDefaultApplications = () => {
    const defaultApps: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Google Chrome',
        path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        icon: '/icons/chrome.svg',
        category: 'productivity',
        type: 'app',
        description: 'Google Chrome 浏览器',
        isSystem: false,
      },
      {
        name: 'Visual Studio Code',
        path: 'C:\\Users\\Username\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
        icon: '/icons/vscode.svg',
        category: 'development',
        type: 'app',
        description: '代码编辑器',
        isSystem: false,
      },
      {
        name: '记事本',
        path: 'C:\\Windows\\System32\\notepad.exe',
        icon: '/icons/notepad.svg',
        category: 'utility',
        type: 'app',
        description: 'Windows 记事本',
        isSystem: true,
      },
      {
        name: 'Figma',
        path: 'https://www.figma.com',
        icon: '/icons/figma.svg',
        category: 'design',
        type: 'url',
        description: '在线设计工具',
        isSystem: false,
      },
      {
        name: 'Slack',
        path: 'path-to-slack',
        icon: '/icons/slack.svg',
        category: 'productivity',
        type: 'app',
        description: '团队协作工具',
        isSystem: false,
      },
      {
        name: 'Spotify',
        path: 'path-to-spotify',
        icon: '/icons/spotify.svg',
        category: 'entertainment',
        type: 'app',
        description: '音乐播放器',
        isSystem: false,
      },
      {
        name: 'Notion',
        path: 'https://www.notion.so',
        icon: '/icons/notion.svg',
        category: 'productivity',
        type: 'url',
        description: '笔记和协作工具',
        isSystem: false,
      },
      {
        name: 'Postman',
        path: 'path-to-postman',
        icon: '/icons/postman.svg',
        category: 'development',
        type: 'app',
        description: 'API 测试工具',
        isSystem: false,
      },
    ]

    applications.value = defaultApps.map(app => addApplication(app))
  }

  // 测试数据生成
  const generateTestApplications = (count: number = 10) => {
    const testNames = [
      'IntelliJ IDEA', 'WebStorm', 'PyCharm', 'Adobe Photoshop', 'Adobe Illustrator',
      'Blender', 'Unity', 'Unreal Engine', 'OBS Studio', 'Streamlabs',
      'Discord', 'Teams', 'Zoom', 'Skype', 'WhatsApp',
      'Steam', 'Epic Games', 'Origin', 'Battle.net', 'Uplay',
      'WinRAR', '7-Zip', 'Everything', 'Notepad++', 'Sublime Text',
    ]

    const testCategories = ['development', 'design', 'entertainment', 'productivity', 'utility']
    const testTypes: ('app' | 'url' | 'file' | 'folder')[] = ['app', 'url', 'file', 'folder']

    for (let i = 0; i < count; i++) {
      const randomName = testNames[Math.floor(Math.random() * testNames.length)]
      const randomCategory = testCategories[Math.floor(Math.random() * testCategories.length)]
      const randomType = testTypes[Math.floor(Math.random() * testTypes.length)]

      addApplication({
        name: `${randomName} ${i + 1}`,
        path: randomType === 'url' ? `https://example-${i}.com` : `C:\\Test\\${randomName}\\app.exe`,
        category: randomCategory || 'utility',
        type: randomType || 'app',
        description: `测试应用 ${i + 1}`,
        icon: '/icons/placeholder.svg',
        isSystem: false,
        pinned: Math.random() > 0.8,
      })
    }
  }

  const updateCurrentPageApps = (newApps: Application[]) => {
    const filteredApps = filteredApplications.value
    const startIndex = currentPageIndex.value * appsPerPage.value
    
    // 创建新的应用列表
    const updatedApps = [...filteredApps]
    
    // 替换当前页的应用
    updatedApps.splice(startIndex, appsPerPage.value, ...newApps)
    
    // 更新全局应用列表中对应的应用
    newApps.forEach((app) => {
      const globalIndex = applications.value.findIndex(a => a.id === app.id)
      if (globalIndex !== -1) {
        applications.value[globalIndex] = app
      }
    })
    
    saveApplications()
  }

  return {
    // 状态
    applications,
    categories,
    currentPageIndex,
    totalPages,
    gridColumns,
    selectedCategory,

    // 计算属性
    filteredApplications,
    pageApplications,
    currentPageApps,
    appsPerPage,

    // 方法
    loadApplications,
    saveApplications,
    loadPageSettings,
    savePageSettings,
    addApplication,
    updateApplication,
    removeApplication,
    goToPage,
    addPage,
    removePage,
    setCategory,
    setGridColumns,
    updateLastUsed,
    togglePin,
    generateTestApplications,
    updateCurrentPageApps,
  }
})
