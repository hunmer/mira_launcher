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
  /** 固定主类型统一为 app */
  type: 'app'
  /** 插件自定义类型（原 file/folder/url 迁移至此） */
  appType?: string
  description?: string
  tags?: string[]
  isSystem?: boolean
  version?: string
  size?: number
  createdAt: Date
  updatedAt: Date
  sortOrder?: number
  gridPosition?: {
    x: number
    y: number
    w: number
    h: number
  }
  dynamicFields?: Record<string, unknown>
}

export interface Category {
  label: string
  value: string
  icon: string
}

export type SortType = 'custom' | 'name' | 'created' | 'lastUsed' | 'type'

export interface SortOption {
  label: string
  value: SortType
  icon: string
}

export const useApplicationsStore = defineStore('applications', () => {
  // 应用列表
  const applications = ref<Application[]>([])

  // 排序相关
  const currentSortType = ref<SortType>('custom')
  const sortAscending = ref(true)

  // 排序选项
  const sortOptions = ref<SortOption[]>([
    { label: '自定义排序', value: 'custom', icon: 'pi pi-sort' },
    { label: '按名称排序', value: 'name', icon: 'pi pi-sort-alpha-down' },
    { label: '按创建时间', value: 'created', icon: 'pi pi-calendar' },
    { label: '按使用时间', value: 'lastUsed', icon: 'pi pi-clock' },
  { label: '按类型排序', value: 'type', icon: 'pi pi-tags' },
  ])

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
    
    // 根据排序类型进行排序
    return apps.sort((a, b) => {
      let result = 0
      
      switch (currentSortType.value) {
      case 'custom': {
        // 自定义排序：使用 sortOrder
        const aOrder = a.sortOrder ?? 999999
        const bOrder = b.sortOrder ?? 999999
        result = aOrder - bOrder
        break
      }
      case 'name': {
        // 按名称排序
        result = a.name.localeCompare(b.name)
        break
      }
      case 'created': {
        // 按创建时间排序
        result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      }
      case 'lastUsed': {
        // 按最后使用时间排序
        const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0
        const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0
        result = bTime - aTime // 最近使用的在前
        break
      }
      case 'type': {
        // 按自定义 appType 排序
        const at = a.appType || 'app'
        const bt = b.appType || 'app'
        result = at.localeCompare(bt)
        break
      }
      default: {
        result = 0
      }
      }
      
      // 应用升序/降序
      return sortAscending.value ? result : -result
    })
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
        applications.value = parsed.map(
          (
            app: Partial<Application> & {
              lastUsed?: string | Date
              createdAt: string | Date
              updatedAt: string | Date
              sortOrder?: number
            },
            index: number,
          ) => ({
            ...app,
            lastUsed: app.lastUsed ? new Date(app.lastUsed) : undefined,
            createdAt: new Date(app.createdAt),
            updatedAt: new Date(app.updatedAt),
            sortOrder: app.sortOrder ?? index, // 如果没有 sortOrder，使用索引
          }),
        ) as Application[]
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
        currentSortType.value = settings.currentSortType || 'custom'
        sortAscending.value = settings.sortAscending ?? true
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
        currentSortType: currentSortType.value,
        sortAscending: sortAscending.value,
      }
      localStorage.setItem(PAGE_SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('保存页面设置失败:', error)
    }
  }

  const addApplication = (
    app: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>,
  ) => {
    const newApp: Application = {
      ...app,
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      sortOrder: applications.value.length, // 设置为当前最大的排序值
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

    // 获取要删除的页面索引（默认是最后一页）
    const pageToDelete = _pageIndex !== undefined ? _pageIndex : totalPages.value - 1
    
    // 获取被删除页面上的应用
    const pageApps = pageApplications.value[pageToDelete] || []
    
    // 如果被删除页面有应用，需要重新分配给其他页面
    if (pageApps.length > 0) {
      // 将应用重新分配到前面的页面
      pageApps.forEach((app, index) => {
        const newPageIndex = Math.min(pageToDelete - 1, totalPages.value - 2)
        const newSortOrder = (newPageIndex * appsPerPage.value) + 
                            (pageApplications.value[newPageIndex]?.length || 0) + index
        
        const globalApp = applications.value.find(a => a.id === app.id)
        if (globalApp) {
          globalApp.sortOrder = newSortOrder
          globalApp.updatedAt = new Date()
        }
      })
      
      // 保存应用数据
      saveApplications()
    }

    // 如果删除的是当前页且不是最后一页，则移动到前一页
    if (
      currentPageIndex.value === totalPages.value - 1 &&
      currentPageIndex.value > 0
    ) {
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
    console.log(`[ApplicationsStore] 设置网格列数: ${gridColumns.value} -> ${columns}`)
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
      // {
      //   name: 'Notion',
      //   path: 'https://www.notion.so',
      //   icon: '/icons/notion.svg',
      //   category: 'productivity',
      //   type: 'app',
      //   appType: 'web-url',
      //   description: '笔记和协作工具',
      //   isSystem: false,
      // },
      // {
      //   name: 'Postman',
      //   path: 'path-to-postman',
      //   icon: '/icons/postman.svg',
      //   category: 'development',
      //   type: 'app',
      //   description: 'API 测试工具',
      //   isSystem: false,
      // },
    ]

    applications.value = defaultApps.map(app => addApplication(app))
  }

  // 测试数据生成
  const generateTestApplications = (count: number = 10) => {
    const testNames = [
      'IntelliJ IDEA',
      'WebStorm',
      'PyCharm',
      'Adobe Photoshop',
      'Adobe Illustrator',
      'Blender',
      'Unity',
      'Unreal Engine',
      'OBS Studio',
      'Streamlabs',
      'Discord',
      'Teams',
      'Zoom',
      'Skype',
      'WhatsApp',
      'Steam',
      'Epic Games',
      'Origin',
      'Battle.net',
      'Uplay',
      'WinRAR',
      '7-Zip',
      'Everything',
      'Notepad++',
      'Sublime Text',
    ]

    const testCategories = [
      'development',
      'design',
      'entertainment',
      'productivity',
      'utility',
    ]
  const legacyTestTypes = ['app','url','file','folder'] as const

    for (let i = 0; i < count; i++) {
      const randomName = testNames[Math.floor(Math.random() * testNames.length)]
      const randomCategory =
        testCategories[Math.floor(Math.random() * testCategories.length)]
  const randomType = legacyTestTypes[Math.floor(Math.random() * legacyTestTypes.length)]

      const appTypeValue = randomType === 'app' ? undefined : (randomType === 'url' ? 'web-url' : randomType)
      const baseApp: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'> = {
        name: `${randomName} ${i + 1}`,
        path: randomType === 'url'
          ? `https://example-${i}.com`
          : `C:\\Test\\${randomName}\\app.exe`,
        category: randomCategory || 'utility',
        type: 'app',
        description: `测试应用 ${i + 1}`,
        icon: '/icons/placeholder.svg',
        isSystem: false,
        pinned: Math.random() > 0.8,
      }
      if (appTypeValue) (baseApp as { appType?: string }).appType = appTypeValue
      addApplication(baseApp)
    }
  }

  const updateCurrentPageApps = (newApps: Application[]) => {
    console.log('更新当前页应用:', newApps.map(app => app.name))
    
    // 当手动拖拽排序时，自动切换到自定义排序
    if (currentSortType.value !== 'custom') {
      currentSortType.value = 'custom'
      console.log('切换到自定义排序模式')
    }
    
    // 更新每个应用的 sortOrder
    newApps.forEach((app, index) => {
      const globalApp = applications.value.find(a => a.id === app.id)
      if (globalApp) {
        // 计算全局排序位置
        const pageStartIndex = currentPageIndex.value * appsPerPage.value
        globalApp.sortOrder = pageStartIndex + index
        globalApp.updatedAt = new Date()
      }
    })
    
    // 保存到本地存储
    saveApplications()
    savePageSettings()
  }

  // 批量更新应用的网格位置信息（x,y,w,h）
  const updateGridPositions = (
    positions: Array<{
      id: string
      position: { x: number; y: number; w: number; h: number }
    }>,
    silent = false, // 是否静默保存，不触发响应式更新
  ) => {
    if (silent) {
      // 静默模式：基于当前内存状态深拷贝，避免直接读取 localStorage（可能顺序不一致）
      try {
        // 创建一个可序列化的浅深混合拷贝，确保不触发响应式
        const appsCopy = applications.value.map(a => ({
          ...a,
          // Date 序列化仍然交给 JSON.stringify
          lastUsed: a.lastUsed ? new Date(a.lastUsed) : undefined,
          createdAt: new Date(a.createdAt),
            updatedAt: new Date(a.updatedAt),
          gridPosition: a.gridPosition ? { ...a.gridPosition } : undefined,
        })) as Application[]

        let changed = false
        positions.forEach(p => {
          const app = appsCopy.find(x => x.id === p.id)
          if (app) {
            const old = app.gridPosition
            if (
              !old ||
              old.x !== p.position.x ||
              old.y !== p.position.y ||
              old.w !== p.position.w ||
              old.h !== p.position.h
            ) {
              app.gridPosition = { ...p.position }
              app.updatedAt = new Date()
              changed = true
            }
          }
        })
        if (changed) {
          console.log('[ApplicationsStore] 静默批量保存网格位置信息', positions)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(appsCopy))
        }
      } catch (error) {
        console.error('静默保存应用数据失败:', error)
      }
      return // 结束，避免继续修改响应式数据
    } else {
      // 正常模式：修改响应式数据
      let changed = false
      positions.forEach(p => {
        const app = applications.value.find(a => a.id === p.id)
        if (app) {
          const old = app.gridPosition
          if (
            !old || 
            old.x !== p.position.x ||
            old.y !== p.position.y ||
            old.w !== p.position.w ||
            old.h !== p.position.h
          ) {
            app.gridPosition = { ...p.position }
            app.updatedAt = new Date()
            changed = true
          }
        }
      })
      if (changed) {
        console.log('[ApplicationsStore] 批量保存网格位置信息', positions)
        saveApplications()
      }
    }
  }

  // 清空当前页面所有应用的网格位置信息
  const clearCurrentPageGridPositions = () => {
    const pageApps = currentPageApps.value
    if (pageApps.length === 0) return
    pageApps.forEach(app => {
      const target = applications.value.find(a => a.id === app.id)
      if (target && target.gridPosition) {
        delete target.gridPosition
        target.updatedAt = new Date()
      }
    })
    console.log('[ApplicationsStore] 已清空当前页布局信息')
    saveApplications()
  }

  // 排序相关方法
  const setSortType = (sortType: string) => {
    // 验证并转换为 SortType
    const validSortTypes: SortType[] = ['custom', 'name', 'created', 'lastUsed', 'type']
    if (validSortTypes.includes(sortType as SortType)) {
      console.log(`[ApplicationsStore] 切换排序类型: ${currentSortType.value} -> ${sortType}`)
      currentSortType.value = sortType as SortType
      savePageSettings()
    }
  }

  const toggleSortOrder = () => {
    console.log(`[ApplicationsStore] 切换排序顺序: ${sortAscending.value ? '升序' : '降序'} -> ${!sortAscending.value ? '升序' : '降序'}`)
    sortAscending.value = !sortAscending.value
    savePageSettings()
  }


  return {
    // 状态
    applications,
    categories,
    sortOptions,
    currentPageIndex,
    totalPages,
    gridColumns,
    selectedCategory,
    currentSortType,
    sortAscending,

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
    setSortType,
    toggleSortOrder,
    updateGridPositions,
    clearCurrentPageGridPositions,
  }
})
