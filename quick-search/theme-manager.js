/* eslint-disable indent */
/**
 * 主题管理系统
 * 支持深色/浅色模式切换，响应系统偏好设置
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'auto'
        this.systemTheme = 'light'
        this.storageKey = 'quick-search-theme'

        this.init()
    }

    init() {
        // 监听系统主题变化
        this.setupSystemThemeListener()

        // 加载保存的主题设置
        this.loadTheme()

        // 应用初始主题
        this.applyTheme()
    }

    setupSystemThemeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        const handleChange = (e) => {
            this.systemTheme = e.matches ? 'dark' : 'light'
            if (this.currentTheme === 'auto') {
                this.applyTheme()
            }
        }

        handleChange(mediaQuery)
        mediaQuery.addEventListener('change', handleChange)
    }

    loadTheme() {
        try {
            const saved = localStorage.getItem(this.storageKey)
            if (saved && ['light', 'dark', 'auto'].includes(saved)) {
                this.currentTheme = saved
            }
        } catch (error) {
            console.warn('无法加载主题设置:', error)
        }
    }

    saveTheme() {
        try {
            localStorage.setItem(this.storageKey, this.currentTheme)
        } catch (error) {
            console.warn('无法保存主题设置:', error)
        }
    }

    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.systemTheme
        }
        return this.currentTheme
    }

    applyTheme() {
        const effectiveTheme = this.getEffectiveTheme()
        const body = document.body
        const html = document.documentElement

        // 移除现有主题类
        body.classList.remove('dark', 'light')
        html.classList.remove('dark', 'light')
        html.removeAttribute('data-theme')

        // 应用新主题
        body.classList.add(effectiveTheme)
        html.classList.add(effectiveTheme)
        html.setAttribute('data-theme', effectiveTheme)

        // 触发主题变化事件
        this.dispatchThemeChangeEvent(effectiveTheme)
    }

    setTheme(theme) {
        if (!['light', 'dark', 'auto'].includes(theme)) {
            console.warn('无效的主题:', theme)
            return
        }

        this.currentTheme = theme
        this.saveTheme()
        this.applyTheme()
    }

    toggleTheme() {
        // 只在亮色和深色模式之间切换
        const currentEffective = this.getEffectiveTheme()
        const newTheme = currentEffective === 'dark' ? 'light' : 'dark'
        this.setTheme(newTheme)
    }

    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: this.currentTheme,
                effectiveTheme: theme,
            },
        })
        window.dispatchEvent(event)
    }

    // 获取主题相关的CSS变量值
    getCSSVariable(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
    }

    // 动态设置CSS变量
    setCSSVariable(varName, value) {
        document.documentElement.style.setProperty(varName, value)
    }
}

// 主题切换按钮组件
const ThemeToggle = {
    name: 'ThemeToggle',
    template: `
    <button 
      class="theme-toggle" 
      @click="toggleTheme"
      :title="getTooltipText()"
      :aria-label="getAriaLabel()"
    >
      <i :class="getIconClass()"></i>
      <span class="sr-only">{{ getAriaLabel() }}</span>
    </button>
  `,
    data() {
        return {
            currentTheme: 'auto',
            effectiveTheme: 'light',
        }
    },
    mounted() {
        // 获取主题管理器实例
        this.themeManager = window.themeManager
        if (this.themeManager) {
            this.currentTheme = this.themeManager.currentTheme
            this.effectiveTheme = this.themeManager.getEffectiveTheme()
        }

        // 监听主题变化
        window.addEventListener('themechange', this.handleThemeChange)
    },
    beforeUnmount() {
        window.removeEventListener('themechange', this.handleThemeChange)
    },
    methods: {
        toggleTheme() {
            if (this.themeManager) {
                this.themeManager.toggleTheme()
            }
        },

        handleThemeChange(event) {
            this.currentTheme = event.detail.theme
            this.effectiveTheme = event.detail.effectiveTheme
        },

        getIconClass() {
            const iconMap = {
                light: 'pi pi-sun',
                dark: 'pi pi-moon',
                auto: 'pi pi-desktop',
            }
            return iconMap[this.currentTheme] || 'pi pi-desktop'
        },

        getTooltipText() {
            const tooltipMap = {
                light: '切换到深色模式',
                dark: '切换到自动模式',
                auto: '切换到浅色模式',
            }
            return tooltipMap[this.currentTheme] || '切换主题'
        },

        getAriaLabel() {
            const labelMap = {
                light: '当前为浅色模式，点击切换到深色模式',
                dark: '当前为深色模式，点击切换到自动模式',
                auto: '当前为自动模式，点击切换到浅色模式',
            }
            return labelMap[this.currentTheme] || '切换主题模式'
        },
    },
}

// 响应式工具函数
const ResponsiveUtils = {
    // 获取当前屏幕断点
    getCurrentBreakpoint() {
        const width = window.innerWidth
        if (width < 641) return 'mobile'
        if (width < 1025) return 'tablet'
        return 'desktop'
    },

    // 检查是否为移动设备
    isMobile() {
        return this.getCurrentBreakpoint() === 'mobile'
    },

    // 检查是否为平板设备
    isTablet() {
        return this.getCurrentBreakpoint() === 'tablet'
    },

    // 检查是否为桌面设备
    isDesktop() {
        return this.getCurrentBreakpoint() === 'desktop'
    },

    // 监听窗口大小变化
    onResize(callback, delay = 250) {
        let timeoutId
        const handler = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(callback, delay)
        }

        window.addEventListener('resize', handler)

        // 返回清理函数
        return () => {
            clearTimeout(timeoutId)
            window.removeEventListener('resize', handler)
        }
    },
}

// 动画工具函数
const AnimationUtils = {
    // 检查是否启用动画
    isAnimationEnabled() {
        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    },

    // 淡入动画
    fadeIn(element, duration = 300) {
        if (!this.isAnimationEnabled()) {
            element.style.opacity = '1'
            return Promise.resolve()
        }

        return new Promise(resolve => {
            element.style.opacity = '0'
            element.style.transition = `opacity ${duration}ms ease-out`

            requestAnimationFrame(() => {
                element.style.opacity = '1'
                setTimeout(resolve, duration)
            })
        })
    },

    // 淡出动画
    fadeOut(element, duration = 300) {
        if (!this.isAnimationEnabled()) {
            element.style.opacity = '0'
            return Promise.resolve()
        }

        return new Promise(resolve => {
            element.style.opacity = '1'
            element.style.transition = `opacity ${duration}ms ease-out`

            requestAnimationFrame(() => {
                element.style.opacity = '0'
                setTimeout(resolve, duration)
            })
        })
    },

    // 滑入动画
    slideIn(element, direction = 'down', duration = 300) {
        if (!this.isAnimationEnabled()) {
            element.style.transform = 'translate(0, 0)'
            element.style.opacity = '1'
            return Promise.resolve()
        }

        return new Promise(resolve => {
            const transforms = {
                down: 'translateY(-10px)',
                up: 'translateY(10px)',
                left: 'translateX(10px)',
                right: 'translateX(-10px)',
            }

            element.style.opacity = '0'
            element.style.transform = transforms[direction] || transforms.down
            element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`

            requestAnimationFrame(() => {
                element.style.opacity = '1'
                element.style.transform = 'translate(0, 0)'
                setTimeout(resolve, duration)
            })
        })
    },
}

// 全局初始化
if (typeof window !== 'undefined') {
    // 创建全局主题管理器实例
    window.themeManager = new ThemeManager()

    // 导出工具函数到全局
    window.ResponsiveUtils = ResponsiveUtils
    window.AnimationUtils = AnimationUtils

    // 等待DOM加载完成后初始化主题
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.themeManager.applyTheme()
        })
    } else {
        window.themeManager.applyTheme()
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ThemeManager,
        ThemeToggle,
        ResponsiveUtils,
        AnimationUtils,
    }
}

// 初始化全局主题管理器
if (typeof window !== 'undefined') {
    window.themeManager = new ThemeManager()
}
