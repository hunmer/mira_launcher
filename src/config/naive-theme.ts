import type { GlobalTheme } from 'naive-ui'

// Naive UI 主题配置 - 部分覆盖
export const naiveThemeOverrides = {
    common: {
        primaryColor: '#3b82f6', // 与 Tailwind blue-500 同步
        primaryColorHover: '#2563eb', // blue-600
        primaryColorPressed: '#1d4ed8', // blue-700
        primaryColorSuppl: '#60a5fa', // blue-400
        borderRadius: '0.5rem', // 与 Tailwind rounded-lg 同步
        borderRadiusSmall: '0.25rem', // rounded
        // 字体配置
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        // 阴影配置 - 与 Tailwind 保持一致
        boxShadow1: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        boxShadow2: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        boxShadow3: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    }
}

// 暗色主题配置
export const naiveThemeDarkOverrides = {
    common: {
        primaryColor: '#60a5fa', // 暗色模式下使用更亮的蓝色
        primaryColorHover: '#3b82f6',
        primaryColorPressed: '#2563eb',
        primaryColorSuppl: '#93c5fd',
        borderRadius: '0.5rem',
        borderRadiusSmall: '0.25rem',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        boxShadow1: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
        boxShadow2: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
        boxShadow3: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    }
}
