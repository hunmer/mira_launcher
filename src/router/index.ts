import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

// 路由組件的懶載入
const Home = () => import('@/views/Home.vue')
const Settings = () => import('@/views/Settings.vue')
const Applications = () => import('@/views/Applications.vue')
const Plugins = () => import('@/views/Plugins.vue')
const About = () => import('@/views/About.vue')

// 路由配置
const routes: RouteRecordRaw[] = [
    {
        path: '/home',
        name: 'Home',
        component: Home,
        meta: {
            title: '首頁',
            icon: 'home',
            transition: 'fade',
            requiresAuth: false,
        },
    },
    {
        path: '/',
        name: 'Applications',
        component: Applications,
        meta: {
            title: '應用程式',
            icon: 'apps',
            transition: 'slide',
            requiresAuth: false,
        },
    },
    {
        path: '/plugins',
        name: 'Plugins',
        component: Plugins,
        meta: {
            title: '插件管理',
            icon: 'extension',
            transition: 'slide',
            requiresAuth: false,
        },
    },
    {
        path: '/settings',
        name: 'Settings',
        component: Settings,
        meta: {
            title: '設定',
            icon: 'settings',
            transition: 'slide',
            requiresAuth: false,
        },
    },
    {
        path: '/about',
        name: 'About',
        component: About,
        meta: {
            title: '關於',
            icon: 'info',
            transition: 'fade',
            requiresAuth: false,
        },
    },
    {
        // 捕獲所有未匹配的路由
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: {
            title: '頁面未找到',
            transition: 'fade',
            requiresAuth: false,
        },
    },
]

// 創建路由實例
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        // 如果有保存的位置，回到保存的位置
        if (savedPosition) {
            return savedPosition
        }

        // 如果有錨點，滾動到錨點
        if (to.hash) {
            return {
                el: to.hash,
                behavior: 'smooth',
            }
        }

        // 否則滾動到頂部
        return { top: 0, behavior: 'smooth' }
    },
})

// 全局前置守衛
router.beforeEach(async (to, from, next) => {
    // 設置頁面標題
    if (to.meta?.['title']) {
        document.title = `${to.meta['title']} - Mira Launcher`
    } else {
        document.title = 'Mira Launcher'
    }

    // 檢查是否需要認證
    if (to.meta?.['requiresAuth']) {
        // 這裡可以添加認證邏輯
        // 目前應用不需要認證，所以直接通過
        next()
    } else {
        next()
    }
})

// 全局後置鉤子
router.afterEach((to, from) => {
    // 路由變化後的邏輯
    console.log(`路由從 ${String(from.name)} 切換到 ${String(to.name)}`)

    // 可以在這裡添加頁面分析、錯誤追蹤等
})

// 路由錯誤處理
router.onError((error) => {
    console.error('路由錯誤:', error)

    // 可以在這裡添加錯誤報告邏輯
})

export default router

// 導出路由相關的類型和工具函數
export type { RouteRecordRaw }

// 獲取當前路由的工具函數
export const getCurrentRoute = () => router.currentRoute

// 程式化導航的工具函數
export const navigateTo = (to: string | { name: string; params?: any; query?: any }) => {
    return router.push(to)
}

// 替換當前路由的工具函數
export const replaceTo = (to: string | { name: string; params?: any; query?: any }) => {
    return router.replace(to)
}

// 回到上一頁的工具函數
export const goBack = () => {
    return router.back()
}

// 前進到下一頁的工具函數
export const goForward = () => {
    return router.forward()
}
