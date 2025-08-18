<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<template>
    <div
        class="app-page"
        @contextmenu.self.prevent="$emit('blank-context-menu', $event)"
    >
        <!-- 空白占位网格 -->
        <div
            v-if="applications.length === 0"
            class="empty-grid"
            @click="$emit('blank-context-menu', $event)"
        >
            <div class="empty-placeholder">
                <div class="empty-icon">
                    <i class="pi pi-plus-circle" />
                </div>
                <div class="empty-text">
                    点击添加应用
                </div>
            </div>
        </div>

        <!-- GridStack 容器 -->
        <div
            v-else
            ref="gridContainer"
            class="grid-stack"
            @contextmenu.self.prevent="$emit('blank-context-menu', $event)"
        >
            <!-- GridStack 将动态创建子元素 -->
        </div>
    </div>
</template>

<script setup lang="ts">
import ApplicationCard from '@/components/business/ApplicationCard.vue'
import type { Application } from '@/stores/applications'
import type { GridStackNode } from 'gridstack'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'
import { createApp, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
    applications: Application[]
    layoutMode: 'grid' | 'list'
    gridColumns: number
    iconSize: number
}

interface DragEventData {
    element?: HTMLElement
    event?: Event
    items?: GridStackNode[]
}

interface Emits {
    (e: 'update:applications', apps: Application[]): void
    (e: 'launch-app', app: Application): void
    (e: 'app-context-menu', app: Application, event: MouseEvent): void
    (e: 'blank-context-menu', event: MouseEvent): void
    (e: 'drag-start', event: DragEventData): void
    (e: 'drag-end', event: DragEventData): void
    (e: 'update-positions', positions: Array<{
        id: string
        position: { x: number; y: number; w: number; h: number }
    }>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const gridContainer = ref<HTMLElement>()
let grid: GridStack | null = null
let suppressChange = false // 初始化或重载时抑制 change 事件
const isInitialized = ref(false)

// 计算网格项目的尺寸
const getItemSize = () => {
    if (props.layoutMode === 'list') {
        return { w: 12, h: 1 } // 列表模式：全宽，高度为1
    } else {
        // 网格模式：根据列数计算宽度
        const itemWidth = Math.max(1, Math.floor(12 / props.gridColumns))
        return { w: itemWidth, h: 2 } // 高度为2个单位
    }
}

// 初始化 GridStack
const initGridStack = async () => {
    if (!gridContainer.value || isInitialized.value) return

    try {
        // GridStack 配置
        const options = {
            column: 12, // 使用12列系统
            cellHeight: 'auto',
            margin: 8, // 增加边距避免边框被遮挡
            disableResize: true,
            minRow: 2,
            float: false,
            layout: 'compat',
            alwaysShowResizeHandle: false,
            // animate: false,
            // columnOpts: {
            //     columnWidth: 100,
            //     columnMax: 12,
            // },
        }

        grid = GridStack.init(options, gridContainer.value)
        isInitialized.value = true

        grid.on('dragstart', (event, element) => {
            const node = (element as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
            emit('drag-start', { element, event })
        })
        grid.on('dragstop', (event, element) => {
            const node = (element as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
            emit('drag-end', { element, event })
        })
        grid.on('resizestop', (_e, element) => {
            const node = (element as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
            
        })
        grid.on('change', (_event, items) => {
            if (suppressChange) return
            if (!items || items.length === 0) return

            // 生成完整快照，避免只保存变更节点导致其余项目下次重新布局
            const snapshot: Array<{ id: string; position: { x: number; y: number; w: number; h: number } }> = []
            const nodes = (grid as any).engine?.nodes || []
            nodes.forEach((node: GridStackNode) => {
                const el = node.el as HTMLElement | undefined
                const appId = el?.getAttribute('gs-id')
                if (appId != null && node.x != null && node.y != null && node.w != null && node.h != null) {
                    snapshot.push({ id: appId, position: { x: node.x, y: node.y, w: node.w, h: node.h } })
                }
            })

            if (snapshot.length) {
                console.log('💾 GridStack - 保存完整位置快照 (共', snapshot.length, '项):', snapshot)
                emit('update-positions', snapshot)
            }
        })

        // 加载应用数据
        await loadApplications()

    } catch (error) {
        console.error('GridStack 初始化失败:', error)
    }
}

// 加载应用到网格
const loadApplications = async () => {
    if (!grid) {
        return
    }

    // 清空现有项目（在清空与重建期间抑制 change）
    suppressChange = true
    grid.removeAll()
    console.log('🔄 GridStack - 加载应用:', props.applications.map(app => ({ name: app.name, gridPosition: app.gridPosition })))
    if (props.applications.length === 0) {
        return
    }

    const itemSize = getItemSize()
    
    let x = 0, y = 0

    // 添加应用项目
    props.applications.forEach((app, index) => {
        // 创建DOM元素
        const element = document.createElement('div')
        element.className = 'grid-app-stack-item'
        
        // 创建内容容器
        const content = document.createElement('div')
        content.className = 'grid-app-stack-item-content'
        
        // 添加应用组件内容
        const appContent = createAppContent(app)
        content.appendChild(appContent)
        element.appendChild(content)

        if (grid) {
            let gx = x, gy = y
            let gw = itemSize.w, gh = itemSize.h
            const pos = app.gridPosition

            if (props.layoutMode === 'list') {
                // 列表模式：完全按照应用数组顺序垂直排布，忽略已保存的网格坐标，保证与列表排序一致
                gx = 0
                gy = y
                gw = 12
                gh = 1
                console.log(`📃 [List] 应用 "${app.name}" 顺序位置: y=${gy}`)
            } else if (pos) {
                // 网格模式：使用保存位置
                gx = pos.x
                gy = pos.y
                gw = Math.min(12, pos.w || itemSize.w)
                gh = pos.h || itemSize.h
                console.log(`🎯 [Grid] 应用 "${app.name}" 使用保存位置: x=${gx}, y=${gy}, w=${gw}, h=${gh}`)
            } else {
                console.log(`📍 [Grid] 应用 "${app.name}" 使用默认顺序位置: x=${gx}, y=${gy}, w=${gw}, h=${gh}`)
            }

            element.setAttribute('gs-id', app.id)
            element.setAttribute('gs-x', gx.toString())
            element.setAttribute('gs-y', gy.toString())
            element.setAttribute('gs-w', gw.toString())
            element.setAttribute('gs-h', gh.toString())

            grid.makeWidget(element)
        }

        // 计算下一个顺序位置（列表模式始终使用；网格模式仅当没有保存位置时）
        if (props.layoutMode === 'list' || !app.gridPosition) {
            x += itemSize.w
            if (x >= 12 || props.layoutMode === 'list') { // 列表模式每行一个
                x = 0
                y += itemSize.h
            }
        }
    })

    // 绑定应用事件
    await nextTick()
    // 允许后续 change 事件
    suppressChange = false
}

// 创建应用内容DOM元素
const createAppContent = (app: Application): HTMLElement => {
    // 创建容器元素
    const container = document.createElement('div')
    container.className = 'gridstack-app-wrapper' // 使用唯一的类名避免冲突
    container.setAttribute('data-app-id', app.id)
    
    // 使用Vue应用挂载ApplicationCard组件
    const vueApp = createApp(ApplicationCard, {
        app,
        layoutMode: props.layoutMode,
        iconSize: props.iconSize,
        onLaunch: (app: Application) => emit('launch-app', app),
        onContextMenu: (app: Application, event: MouseEvent) => emit('app-context-menu', app, event),
    })
    
    vueApp.mount(container)
    
    return container
}

watch(() => props.layoutMode, async () => {
    console.log('🔍 GridStack - layoutMode变化:', props.layoutMode)
    // 重新加载应用以适应新的布局模式
    await loadApplications()
})

// 监听gridColumns变化
watch(() => props.gridColumns, async () => {
    console.log('🔍 GridStack - gridColumns变化:', props.gridColumns)
    // 重新加载应用以适应新的列数
    await loadApplications()
})

// 监听应用列表变化
watch(() => props.applications, async () => {
    console.log('🔍 GridStack - applications变化:', props.applications.length)
    // 重新加载应用
    await loadApplications()
}, { deep: true })

// 生命周期
onMounted(async () => {
    await nextTick()
    await initGridStack()
})

onUnmounted(() => {
    if (grid) {
        grid.destroy()
        grid = null
        isInitialized.value = false
    }
})
</script>

<style scoped>
.app-page {
    width: 100%;
    height: 100%;
    overflow: hidden; /* 隐藏滚动条 */
}

.empty-grid {
    width: 100%;
    height: 100%;
    cursor: pointer;
    border: 2px dashed #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
}

.empty-grid:hover {
    border-color: #3b82f6;
    background: #f1f5f9;
}

.empty-placeholder {
    text-align: center;
    color: #64748b;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.empty-text {
    font-size: 16px;
    font-weight: 500;
}

/* GridStack 容器样式 */
.grid-stack {
    width: 100%;
}

:deep(.grid-app-stack-item) {
    overflow: hidden;
    padding: 5px;
}

/* 应用项目样式 */
:deep(.grid-app-stack-item-content) {
    background: white;
    width: 100%;
    height: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    overflow: hidden;
    display: flex; /* 确保内容正确布局 */
    align-items: stretch; /* 让子元素填满高度 */
}

:deep(.grid-app-stack-item-content:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
}

/* GridStack应用包装器样式 */
:deep(.gridstack-app-wrapper) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 拖拽状态样式 */
:deep(.grid-app-stack-item.ui-draggable-dragging) {
    opacity: 0.8;
    transform: scale(1.05) rotate(2deg);
    z-index: 1000;
}

/* 深色主题支持 */
.dark :deep(.grid-app-stack-item-content) {
    background: #1f2937;
    border-color: #374151;
}

.dark :deep(.grid-app-stack-item-content:hover) {
    background: #111827;
    border-color: #3b82f6;
}

.dark .empty-grid {
    background: #111827;
    border-color: #374151;
}

.dark .empty-grid:hover {
    border-color: #3b82f6;
    background: #1f2937;
}
</style>
