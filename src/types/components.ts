// 组件类型定义
// 定义所有组件相关的 TypeScript 类型和接口

import type { Component } from 'vue'

// 基础组件 Props 类型
export interface BaseComponentProps {
    class?: string
    style?: string | Record<string, any>
}

// 按钮组件类型
export interface ButtonProps extends BaseComponentProps {
    type?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
    size?: 'small' | 'medium' | 'large'
    loading?: boolean
    disabled?: boolean
    block?: boolean
}

// 输入框组件类型
export interface InputProps extends BaseComponentProps {
    value?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    clearable?: boolean
    type?: 'text' | 'password' | 'email' | 'number'
}

// 模态框组件类型
export interface ModalProps extends BaseComponentProps {
    show?: boolean
    title?: string
    width?: string | number
    closable?: boolean
    maskClosable?: boolean
}

// 网格项目类型
export interface GridItem {
    id: string
    name: string
    icon?: string
    path?: string
    description?: string
    category?: string
    position?: {
        x: number
        y: number
    }
    size?: {
        width: number
        height: number
    }
    gridSize?: '1x1' | '1x2' | '2x1' | '2x2'
    selected?: boolean
    disabled?: boolean
    pinned?: boolean
    lastUsed?: Date
}

// 网格配置类型
export interface GridConfig {
    columns: number | 'auto'
    rows?: number
    gap: number | 'sm' | 'md' | 'lg' | 'xl'
    responsive?: boolean
    autoRows?: boolean
    itemSize?: {
        width: number
        height: number
    }
}

// 拖拽状态类型
export interface DragState {
    isDragging: boolean
    draggedItem?: GridItem
    draggedFromIndex?: number
    draggedToIndex?: number
    ghostElement?: HTMLElement
    placeholderVisible?: boolean
}

// 网格历史记录类型
export interface GridHistory {
    id: string
    timestamp: Date
    action: 'add' | 'remove' | 'move' | 'update' | 'reorder'
    item?: GridItem
    oldPosition?: number
    newPosition?: number
    data?: any
}

// 插件信息类型
export interface PluginInfo {
    id: string
    name: string
    version: string
    description?: string
    author?: string
    enabled: boolean
    configurable: boolean
}

// 主题配置类型
export interface ThemeConfig {
    mode: 'light' | 'dark' | 'auto'
    primaryColor: string
    backgroundColor: string
    textColor: string
}

// 组件注册类型
export interface ComponentRegistry {
    [key: string]: Component
}

// 事件类型
export interface ComponentEvents {
    click: (event: MouseEvent) => void
    change: (value: any) => void
    input: (value: string) => void
    focus: (event: FocusEvent) => void
    blur: (event: FocusEvent) => void
}

// 网格组件类型
export interface GridContainerProps extends BaseComponentProps {
    columns?: number | 'auto'
    gap?: number | 'sm' | 'md' | 'lg' | 'xl'
    responsive?: boolean
    autoRows?: boolean
}

export interface GridItemProps extends BaseComponentProps {
    size?: '1x1' | '1x2' | '2x1' | '2x2'
    selected?: boolean
    disabled?: boolean
    hoverable?: boolean
}

// 插槽类型
export interface ComponentSlots {
    default?: () => any
    header?: () => any
    footer?: () => any
    prefix?: () => any
    suffix?: () => any
}

// 页面相关类型
export interface Page {
    id: string
    name: string
    route: string
    gridData: GridItem[]
    config: PageConfig
    createdAt: Date
    lastVisited: Date
    icon?: string
    description?: string
    pinned?: boolean
}

export interface PageConfig {
    maxPages?: number
    enableAnimation?: boolean
    autoSave?: boolean
    saveInterval?: number
    layout?: 'grid' | 'list' | 'custom'
    theme?: 'inherit' | 'light' | 'dark'
}

export interface PageHistory {
    id: string
    pageId: string
    timestamp: Date
    action: 'visit' | 'create' | 'update' | 'delete'
    data?: any
}

export interface PageNavigation {
    from: string
    to: string
    timestamp: Date
    duration?: number
}

export interface PageState {
    loading: boolean
    error?: string
    isDirty: boolean
    lastSaved?: Date
}
