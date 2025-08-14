<template>
    <div class="icon-size-dropdown">
        <button ref="menuButton" class="size-trigger-btn" @click="toggleMenu" @wheel="handleWheel"
            :title="currentSizeLabel">
            <div class="size-indicator">
                <div :class="['size-dot', getSizeDotClass(currentSize)]" />
            </div>
            <i class="pi pi-angle-down trigger-icon" />
        </button>

        <Menu ref="menu" :model="menuItems" :popup="true" class="size-menu">
            <template #item="{ item }">
                <div class="flex items-center gap-2 w-full">
                    <div class="size-indicator">
                        <div :class="['size-dot', getSizeDotClass(item['value'])]" />
                    </div>
                    <span>{{ item.label }}</span>
                </div>
            </template>
        </Menu>
    </div>
</template>

<script setup lang="ts">
import Menu from 'primevue/menu'
import { computed, ref } from 'vue'

interface IconSizeDropdownProps {
    modelValue: string
    containerWidth?: number
}

interface IconSizeDropdownEmits {
    (event: 'update:modelValue', value: string): void
    (event: 'change', value: string): void
}

const props = withDefaults(defineProps<IconSizeDropdownProps>(), {
    containerWidth: 1200
})

const emit = defineEmits<IconSizeDropdownEmits>()

const menu = ref()
const menuButton = ref()

const currentSize = computed(() => props.modelValue)

// 计算每行可容纳的列数（基于150px最小宽度）
const maxColumns = computed(() => {
    return Math.floor(props.containerWidth / 150)
})

// 大小选项配置
const sizeOptions = computed(() => {
    const baseOptions = [
        { value: '1', label: '1列', description: '最大图标', size: 'xl' },
        { value: '2', label: '2列', description: '特大图标', size: 'lg' },
        { value: '3', label: '3列', description: '大图标', size: 'md' },
        { value: '4', label: '4列', description: '中图标', size: 'sm' },
        { value: '5', label: '5列', description: '小图标', size: 'xs' },
        { value: '6', label: '6列', description: '迷你图标', size: 'xxs' },
        { value: '7', label: '7列', description: '微型图标', size: 'xxxs' },
        { value: '8', label: '8列', description: '极小图标', size: 'xxxxs' },
        { value: '9', label: '9列', description: '紧凑图标', size: 'xxxxxs' },
        { value: '10', label: '10列', description: '最小图标', size: 'xxxxxxs' }
    ]

    // 如果容器宽度不足以容纳某个列数，则添加"自适应"选项
    const availableOptions = baseOptions.filter(option => {
        const columns = parseInt(option.value)
        return columns <= maxColumns.value
    })

    // 如果有选项被过滤掉，添加自适应选项
    if (availableOptions.length < baseOptions.length) {
        availableOptions.push({
            value: 'auto',
            label: '自适应',
            description: '根据容器宽度',
            size: 'auto'
        })
    }

    return availableOptions
})

// 菜单项配置
const menuItems = computed(() => {
    return sizeOptions.value.map(option => ({
        label: option.label,
        value: option.value,
        command: () => {
            emit('update:modelValue', option.value)
            emit('change', option.value)
        }
    }))
})

// 切换菜单显示
const toggleMenu = (event: Event) => {
    menu.value?.toggle(event)
}

// 获取当前大小的标签
const currentSizeLabel = computed(() => {
    const option = sizeOptions.value.find(opt => opt.value === currentSize.value)
    return option?.label || '4列'
})

// 获取大小标签
const getSizeLabel = (value: string) => {
    const option = sizeOptions.value.find(opt => opt.value === value)
    return option?.label || '4列'
}

// 获取圆点样式类
const getSizeDotClass = (value: string) => {
    const sizeMap: Record<string, string> = {
        '1': 'size-dot-xl',
        '2': 'size-dot-lg',
        '3': 'size-dot-md',
        '4': 'size-dot-sm',
        '5': 'size-dot-xs',
        '6': 'size-dot-xxs',
        '7': 'size-dot-xxxs',
        '8': 'size-dot-xxxxs',
        '9': 'size-dot-xxxxxs',
        '10': 'size-dot-xxxxxxs',
        'auto': 'size-dot-auto'
    }
    return sizeMap[value] || 'size-dot-sm'
}

// 处理滚轮事件切换选项
const handleWheel = (event: WheelEvent) => {
    event.preventDefault()

    const availableOptions = sizeOptions.value
    const currentIndex = availableOptions.findIndex(opt => opt.value === currentSize.value)

    let newIndex = currentIndex

    if (event.deltaY > 0) {
        // 向下滚动，选择下一个选项
        newIndex = currentIndex < availableOptions.length - 1 ? currentIndex + 1 : 0
    } else {
        // 向上滚动，选择上一个选项
        newIndex = currentIndex > 0 ? currentIndex - 1 : availableOptions.length - 1
    }

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < availableOptions.length) {
        const newOption = availableOptions[newIndex]
        if (newOption) {
            const newValue = newOption.value
            emit('update:modelValue', newValue)
            emit('change', newValue)
        }
    }
}
</script>

<style scoped>
.icon-size-dropdown {
    position: relative;
}

.size-trigger-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgb(229 231 235);
    border-radius: 0.375rem;
    background-color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 48px;
    height: 38px;
    justify-content: center;
}

.size-trigger-btn:hover {
    background-color: rgba(243, 244, 246, 0.9);
    border-color: rgb(99 102 241);
    transform: translateY(-1px);
}

.size-trigger-btn:active {
    transform: translateY(0);
}

.trigger-icon {
    font-size: 0.75rem;
    color: rgb(107 114 128);
    transition: transform 0.2s ease;
}

.size-trigger-btn:hover .trigger-icon {
    color: rgb(99 102 241);
}

.size-menu {
    min-width: 140px;
}

.size-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
}

.size-dot {
    border-radius: 50%;
    background-color: currentColor;
    transition: all 0.2s ease;
}

/* 不同大小的圆点 */
.size-dot-xl {
    width: 14px;
    height: 14px;
}

.size-dot-lg {
    width: 12px;
    height: 12px;
}

.size-dot-md {
    width: 10px;
    height: 10px;
}

.size-dot-sm {
    width: 8px;
    height: 8px;
}

.size-dot-xs {
    width: 6px;
    height: 6px;
}

.size-dot-xxs {
    width: 5px;
    height: 5px;
}

.size-dot-xxxs {
    width: 4px;
    height: 4px;
}

.size-dot-xxxxs {
    width: 3px;
    height: 3px;
}

.size-dot-xxxxxs {
    width: 2px;
    height: 2px;
}

.size-dot-xxxxxxs {
    width: 2px;
    height: 2px;
}

.size-dot-auto {
    width: 8px;
    height: 8px;
    background: linear-gradient(45deg, currentColor 50%, transparent 50%);
    border-radius: 2px;
}

/* 深色模式适配 */
.dark .size-trigger-btn {
    background-color: rgba(55, 65, 81, 0.8);
    border-color: rgb(75 85 99);
    color: rgb(243 244 246);
}

.dark .size-trigger-btn:hover {
    background-color: rgba(55, 65, 81, 0.9);
    border-color: rgb(99 102 241);
}

.dark .trigger-icon {
    color: rgb(156 163 175);
}

.dark .size-trigger-btn:hover .trigger-icon {
    color: rgb(129 140 248);
}

:global(.dark .p-menu) {
    background-color: rgb(31 41 55) !important;
    border-color: rgb(75 85 99) !important;
}

:global(.dark .p-menuitem-link) {
    color: rgb(243 244 246) !important;
}

:global(.dark .p-menuitem-link:hover) {
    background-color: rgb(55 65 81) !important;
}
</style>
