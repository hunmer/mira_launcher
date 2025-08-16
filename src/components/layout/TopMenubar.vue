<template>
    <Menubar 
        :model="currentMenuItems" 
        class="top-menubar"
    >
        <template #item="{ item, props, hasSubmenu }">
            <router-link 
                v-if="item['route']" 
                v-slot="{ href, navigate, isActive }" 
                :to="item['route']" 
                custom
            >
                <a 
                    v-ripple 
                    :href="href" 
                    v-bind="props.action" 
                    :class="{ 'active-menu-item': isActive }"
                    @click="navigate"
                >
                    <span 
                        v-if="item.icon" 
                        :class="item.icon" 
                    />
                    <span>{{ item.label }}</span>
                    <i 
                        v-if="hasSubmenu" 
                        class="pi pi-angle-down ml-2" 
                    />
                </a>
            </router-link>
            <a 
                v-else 
                v-ripple 
                v-bind="props.action"
                @click="handleMenuClick(item, $event)"
            >
                <span 
                    v-if="item.icon" 
                    :class="item.icon" 
                />
                <span>{{ item.label }}</span>
                <i 
                    v-if="hasSubmenu" 
                    class="pi pi-angle-down ml-2" 
                />
            </a>
        </template>

        <template #end>
            <div class="flex items-center gap-2">
                <Button 
                    icon="pi pi-search" 
                    text 
                    rounded 
                    aria-label="Search"
                    @click="toggleSearch"
                />
                <Button 
                    icon="pi pi-bell" 
                    text 
                    rounded 
                    aria-label="Notifications"
                    @click="showNotifications"
                />
            </div>
        </template>
    </Menubar>
</template>

<script setup lang="ts">
import { useApplicationLayout } from '@/composables/useApplicationLayout'
import Button from 'primevue/button'
import Menubar from 'primevue/menubar'
import type { MenuItem } from 'primevue/menuitem'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { setLayoutMode: changeLayoutMode, setIconSize: changeIconSize } = useApplicationLayout()

// 全局菜单项
const globalMenuItems: MenuItem[] = [
    {
        label: '菜单',
        icon: 'pi pi-bars',
        items: [
            {
                label: '首页',
                icon: 'pi pi-home',
                route: '/home',
            },
            {
                label: '应用程序',
                icon: 'pi pi-th-large',
                route: '/',
            },
            {
                label: '插件管理',
                icon: 'pi pi-puzzle-piece',
                route: '/plugins',
            },
            {
                separator: true,
            },
            {
                label: '设置',
                icon: 'pi pi-cog',
                route: '/settings',
            },
            {
                label: '关于',
                icon: 'pi pi-info-circle',
                route: '/about',
            },
        ],
    },
]

// Applications 页面特有的菜单项
const layoutMenuItems: MenuItem[] = [
    {
        label: '布局',
        icon: 'pi pi-layout',
        items: [
            {
                label: '网格视图',
                icon: 'pi pi-th-large',
                command: () => switchLayout('grid'),
            },
            {
                label: '列表视图',
                icon: 'pi pi-list',
                command: () => switchLayout('list'),
            },
            {
                separator: true,
            },
            {
                label: '小图标',
                icon: 'pi pi-circle',
                command: () => setIconSize('small'),
            },
            {
                label: '中图标',
                icon: 'pi pi-circle-fill',
                command: () => setIconSize('medium'),
            },
            {
                label: '大图标',
                icon: 'pi pi-stop-circle',
                command: () => setIconSize('large'),
            },
        ],
    },
]

// 根据当前路由计算菜单项
const currentMenuItems = computed((): MenuItem[] => {
    const baseItems = [...globalMenuItems]
  
    // 如果在 Applications 页面，添加布局菜单
    if (route.name === 'Applications') {
        baseItems.push(...layoutMenuItems)
    }
  
    return baseItems
})

// 菜单事件处理
const handleMenuClick = (item: MenuItem, event: MouseEvent) => {
    if (item.command) {
        const menuEvent = {
            originalEvent: event,
            item,
        }
        item.command(menuEvent)
    }
}

const toggleSearch = () => {
    console.log('Toggle search')
    // 这里可以触发搜索功能
}

const showNotifications = () => {
    console.log('Show notifications')
    // 这里可以显示通知
}

const switchLayout = (layout: string) => {
    console.log('Switch layout to:', layout)
    if (layout === 'grid' || layout === 'list') {
        changeLayoutMode(layout)
    }
}

const setIconSize = (size: string) => {
    console.log('Set icon size to:', size)
    if (size === 'small' || size === 'medium' || size === 'large') {
        changeIconSize(size)
    }
}
</script>

<style scoped>
.top-menubar {
  border: none;
  border-radius: 0;
  background: transparent;
  height: auto;
}

:global(.top-menubar .p-menubar-root-list) {
  background: transparent;
  gap: 0.25rem;
  padding: 0;
  margin: 0;
}

:global(.top-menubar .p-menuitem) {
  background: transparent;
}

:global(.top-menubar .p-menuitem-link) {
  color: #6b7280 !important;
  padding: 0.375rem 0.75rem !important;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  margin: 0;
}

:global(.top-menubar .p-menuitem-link:hover) {
  background-color: rgba(99, 102, 241, 0.1) !important;
  color: #4f46e5 !important;
}

:global(.top-menubar .p-menuitem-link.active-menu-item) {
  background-color: rgba(99, 102, 241, 0.15) !important;
  color: #4f46e5 !important;
  font-weight: 600;
}

/* 子菜单样式 */
:global(.top-menubar .p-submenu-list) {
  background: rgba(255, 255, 255, 0.98) !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  backdrop-filter: blur(12px) !important;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  padding: 0.5rem !important;
}

:global(.top-menubar .p-submenu-list .p-menuitem-link) {
  color: #374151 !important;
  margin: 0;
  border-radius: 4px;
}

:global(.top-menubar .p-submenu-list .p-menuitem-link:hover) {
  background-color: rgba(99, 102, 241, 0.1) !important;
  color: #4f46e5 !important;
}

/* 深色模式 */
:global(.dark .top-menubar .p-menuitem-link) {
  color: #d1d5db !important;
}

:global(.dark .top-menubar .p-menuitem-link:hover) {
  background-color: rgba(99, 102, 241, 0.2) !important;
  color: #a78bfa !important;
}

:global(.dark .top-menubar .p-menuitem-link.active-menu-item) {
  background-color: rgba(99, 102, 241, 0.25) !important;
  color: #a78bfa !important;
}

:global(.dark .top-menubar .p-submenu-list) {
  background: rgba(31, 41, 55, 0.98) !important;
  border: 1px solid #4b5563 !important;
}

:global(.dark .top-menubar .p-submenu-list .p-menuitem-link) {
  color: #e5e7eb !important;
}

:global(.dark .top-menubar .p-submenu-list .p-menuitem-link:hover) {
  background-color: rgba(99, 102, 241, 0.2) !important;
  color: #a78bfa !important;
}
</style>
