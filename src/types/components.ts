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
}

// 网格配置类型
export interface GridConfig {
    columns: number
    rows: number
    gap: number
    itemSize: {
        width: number
        height: number
    }
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

// 插槽类型
export interface ComponentSlots {
    default?: () => any
    header?: () => any
    footer?: () => any
    prefix?: () => any
    suffix?: () => any
}
