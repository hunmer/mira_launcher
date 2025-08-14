<template>
  <div class="navigation-menu-wrapper">
    <div class="navigation-menu-bar">
      <!-- 主要导航按钮 -->
      <Button type="button" label="应用" icon="pi pi-th-large" :class="{ 'active': route.path === '/applications' }"
        @click="navigateToRoute('/applications')" />

      <!-- 插件下拉菜单 -->
      <div class="menu-dropdown">
        <Button type="button" aria-haspopup="true" aria-controls="plugins_menu" @click="togglePluginsMenu"
          class="dropdown-button">
          <i class="pi pi-puzzle-piece" />
          <span>插件</span>
          <i class="pi pi-chevron-down dropdown-arrow" />
        </Button>
        <TieredMenu id="plugins_menu" ref="pluginsMenu" :model="pluginMenuItems" popup />
      </div>

      <!-- 开发下拉菜单 -->
      <div class="menu-dropdown">
        <Button type="button" aria-haspopup="true" aria-controls="dev_menu" @click="toggleDevMenu"
          class="dropdown-button">
          <i class="pi pi-code" />
          <span>开发</span>
          <i class="pi pi-chevron-down dropdown-arrow" />
        </Button>
        <TieredMenu id="dev_menu" ref="devMenu" :model="devMenuItems" popup />
      </div>

      <!-- 设置按钮 -->
      <Button type="button" label="设置" icon="pi pi-cog" :class="{ 'active': route.path === '/settings' }"
        @click="navigateToRoute('/settings')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import TieredMenu from 'primevue/tieredmenu'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface MenuItem {
  label: string
  icon?: string
  route?: string
  command?: () => void
  items?: MenuItem[]
  separator?: boolean
}

const route = useRoute()
const router = useRouter()
const pluginsMenu = ref()
const devMenu = ref()

// 路由导航函数
const navigateToRoute = (routePath: string) => {
  router.push(routePath)
}

// 插件菜单项
const pluginMenuItems: MenuItem[] = [
  {
    label: '已安装插件',
    icon: 'pi pi-puzzle-piece',
    command: () => navigateToRoute('/plugins'),
  },
  {
    label: '插件商城',
    icon: 'pi pi-shopping-cart',
    command: () => navigateToRoute('/plugin-store'),
  },
]

// 开发菜单项
const devMenuItems: MenuItem[] = [
  {
    label: '打开控制台',
    icon: 'pi pi-terminal',
    command: () => openDevConsole(),
  },
]

// 菜单切换函数
const togglePluginsMenu = (event: Event) => {
  pluginsMenu.value.toggle(event)
}

const toggleDevMenu = (event: Event) => {
  devMenu.value.toggle(event)
}

// 开发工具函数
const openDevConsole = async () => {
  console.log('Opening dev console...')

  try {
    // 首先检查是否为调试模式
    const { invoke } = await import('@tauri-apps/api/core')
    const isDebug = await invoke('is_debug_mode')

    if (!isDebug) {
      alert('开发者工具功能仅在调试模式下可用\n\n在生产环境中，请按以下方式打开:\n• macOS: Cmd+Option+I 或右键菜单"检查元素"\n• Windows/Linux: F12 或 Ctrl+Shift+I')
      return
    }

    // 在调试模式下，调用 Rust 命令打开开发者工具
    await invoke('open_devtools')
    console.log('开发者工具已打开')

  } catch (error) {
    console.error('Failed to open dev tools:', error)

    // 提供备用解决方案
    const errorMessage = error?.toString() || '未知错误'
    let fallbackMessage = '无法通过程序打开开发者工具\n\n'

    if (navigator.platform.toLowerCase().includes('mac')) {
      fallbackMessage += '请尝试以下方式:\n• 按 Cmd+Option+I\n• 右键点击页面并选择"检查元素"\n• 在菜单栏选择"开发者" > "开发者工具"'
    } else {
      fallbackMessage += '请尝试以下方式:\n• 按 F12\n• 按 Ctrl+Shift+I\n• 右键点击页面并选择"检查元素"'
    }

    fallbackMessage += `\n\n错误信息: ${errorMessage}`
    alert(fallbackMessage)
  }
}
</script>

<style scoped>
.navigation-menu-wrapper {
  position: relative;
  z-index: 9999;
  width: 100%;
  max-width: 100vw;
  overflow-x: auto;
}

.navigation-menu-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: transparent;
  min-width: max-content;
}

.menu-dropdown {
  position: relative;
}

.menu-separator {
  width: 1px;
  height: 2rem;
  background-color: #e5e7eb;
  margin: 0 0.5rem;
}

/* Button 样式 */
:global(.navigation-menu-wrapper .p-button) {
  background: transparent !important;
  border: none !important;
  color: #6b7280 !important;
  padding: 0.5rem 0.75rem !important;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: none !important;
  white-space: nowrap;
}

/* 下拉按钮特殊样式 */
:global(.navigation-menu-wrapper .dropdown-button) {
  display: flex !important;
  align-items: center !important;
  gap: 0.375rem !important;
}

:global(.navigation-menu-wrapper .dropdown-button .dropdown-arrow) {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  opacity: 0.7;
}

:global(.navigation-menu-wrapper .dropdown-button:hover .dropdown-arrow) {
  opacity: 1;
}

:global(.navigation-menu-wrapper .p-button:hover) {
  background-color: rgba(99, 102, 241, 0.1) !important;
  color: #4f46e5 !important;
}

:global(.navigation-menu-wrapper .p-button:focus) {
  box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.2) !important;
}

:global(.navigation-menu-wrapper .p-button.active) {
  background-color: rgba(99, 102, 241, 0.15) !important;
  color: #4f46e5 !important;
  font-weight: 600;
}

/* TieredMenu 样式 - 设置最高z-index并确保不受父元素限制 */
:global(.p-tieredmenu) {
  background: rgba(255, 255, 255, 0.98) !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  backdrop-filter: blur(12px) !important;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  z-index: 99999 !important;
  position: fixed !important;
  min-width: 200px !important;
}

:global(.p-tieredmenu .p-menuitem-link) {
  color: #374151 !important;
  padding: 0.5rem 0.75rem !important;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

:global(.p-tieredmenu .p-menuitem-link:hover) {
  background-color: rgba(99, 102, 241, 0.1) !important;
  color: #4f46e5 !important;
}

:global(.p-tieredmenu .p-menuitem-link:focus) {
  background-color: rgba(99, 102, 241, 0.1) !important;
  color: #4f46e5 !important;
  box-shadow: none !important;
}

/* 子菜单样式 */
:global(.p-tieredmenu-submenu) {
  z-index: 99999 !important;
  position: fixed !important;
}

/* 确保子菜单面板也有最高优先级 */
:global(.p-component-overlay) {
  z-index: 99998 !important;
}

/* 深色模式 */
:global(.dark .navigation-menu-wrapper .p-button) {
  color: #d1d5db !important;
}

:global(.dark .navigation-menu-wrapper .p-button:hover) {
  background-color: rgba(99, 102, 241, 0.2) !important;
  color: #a78bfa !important;
}

:global(.dark .navigation-menu-wrapper .p-button.active) {
  background-color: rgba(99, 102, 241, 0.25) !important;
  color: #a78bfa !important;
}

:global(.dark .menu-separator) {
  background-color: #4b5563;
}

:global(.dark .p-tieredmenu) {
  background: rgba(31, 41, 55, 0.98) !important;
  border: 1px solid #4b5563 !important;
}

:global(.dark .p-tieredmenu .p-menuitem-link) {
  color: #e5e7eb !important;
}

:global(.dark .p-tieredmenu .p-menuitem-link:hover) {
  background-color: rgba(99, 102, 241, 0.2) !important;
  color: #a78bfa !important;
}

:global(.dark .p-tieredmenu .p-menuitem-link:focus) {
  background-color: rgba(99, 102, 241, 0.2) !important;
  color: #a78bfa !important;
}
</style>
