<template>
  <Menubar 
    :model="currentMenuItems" 
    class="navigation-menu"
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
        @click="handleMenuClick(item as MenuItem, $event)"
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
  </Menubar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Menubar from 'primevue/menubar'

interface MenuItem {
  label: string
  icon?: string
  route?: string
  command?: () => void
  items?: MenuItem[]
  separator?: boolean
}

const route = useRoute()

// 基础菜单项
const baseMenuItems: MenuItem[] = [
  {
    label: '应用',
    icon: 'pi pi-th-large',
    route: '/applications',
  },
  {
    label: '插件',
    icon: 'pi pi-puzzle-piece',
    route: '/plugins',
  },
  {
    label: '插件商城',
    icon: 'pi pi-shopping-cart',
    route: '/plugin-store',
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
]

// 根据路由动态生成菜单项
const currentMenuItems = computed(() => {
  const currentPath = route.path
  
  if (currentPath === '/applications') {
    return [
      ...baseMenuItems,
      { separator: true },
      {
        label: '视图',
        icon: 'pi pi-eye',
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
        ],
      },
      {
        label: '图标大小',
        icon: 'pi pi-expand',
        items: [
          {
            label: '小',
            icon: 'pi pi-circle',
            command: () => setIconSize('small'),
          },
          {
            label: '中',
            icon: 'pi pi-circle',
            command: () => setIconSize('medium'),
          },
          {
            label: '大',
            icon: 'pi pi-circle',
            command: () => setIconSize('large'),
          },
        ],
      },
    ]
  }
  
  return baseMenuItems
})

// 菜单项点击处理
const handleMenuClick = (item: MenuItem, _event: Event) => {
  if (item.command) {
    item.command()
  }
}

// 布局控制函数
const switchLayout = (layout: string) => {
  console.log('Switch layout to:', layout)
  // 这里集成layout功能
}

const setIconSize = (size: string) => {
  console.log('Set icon size to:', size)
  // 这里集成图标大小功能
}
</script>

<style scoped>
.navigation-menu {
  border: none;
  border-radius: 0;
  background: transparent;
  height: auto;
  padding: 0;
}

:global(.navigation-menu .p-menubar-root-list) {
  background: transparent;
  gap: 0.25rem;
  padding: 0;
  margin: 0;
}

:global(.navigation-menu .p-menuitem) {
  background: transparent;
}

:global(.navigation-menu .p-menuitem-link) {
  color: #6b7280 !important;
  padding: 0.375rem 0.75rem !important;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  margin: 0;
}

:global(.navigation-menu .p-menuitem-link:hover) {
  background-color: rgba(99, 102, 241, 0.1) !important;
  color: #4f46e5 !important;
}

:global(.navigation-menu .p-menuitem-link.active-menu-item) {
  background-color: rgba(99, 102, 241, 0.15) !important;
  color: #4f46e5 !important;
  font-weight: 600;
}

/* 子菜单样式 - 提高z-index */
:global(.navigation-menu .p-submenu-list) {
  background: rgba(255, 255, 255, 0.98) !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  backdrop-filter: blur(12px) !important;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  padding: 0.5rem !important;
  z-index: 1000 !important;
}

:global(.navigation-menu .p-submenu-list .p-menuitem-link) {
  color: #374151 !important;
  margin: 0;
  border-radius: 4px;
}

:global(.navigation-menu .p-submenu-list .p-menuitem-link:hover) {
  background-color: rgba(99, 102, 241, 0.1) !important;
  color: #4f46e5 !important;
}

/* 深色模式 */
:global(.dark .navigation-menu .p-menuitem-link) {
  color: #d1d5db !important;
}

:global(.dark .navigation-menu .p-menuitem-link:hover) {
  background-color: rgba(99, 102, 241, 0.2) !important;
  color: #a78bfa !important;
}

:global(.dark .navigation-menu .p-menuitem-link.active-menu-item) {
  background-color: rgba(99, 102, 241, 0.25) !important;
  color: #a78bfa !important;
}

:global(.dark .navigation-menu .p-submenu-list) {
  background: rgba(31, 41, 55, 0.98) !important;
  border: 1px solid #4b5563 !important;
}

:global(.dark .navigation-menu .p-submenu-list .p-menuitem-link) {
  color: #e5e7eb !important;
}

:global(.dark .navigation-menu .p-submenu-list .p-menuitem-link:hover) {
  background-color: rgba(99, 102, 241, 0.2) !important;
  color: #a78bfa !important;
}
</style>
