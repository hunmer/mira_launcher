<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<template>
    <div
        class="app-page"
        @contextmenu.self.prevent="$emit('blank-context-menu', $event)"
    >
        <div
            ref="gridContainer"
            class="grid-stack"
            @contextmenu.self.prevent="$emit('blank-context-menu', $event)"
        />
    </div>
</template>

<script setup lang="ts">
import ApplicationCard from '@/components/business/ApplicationCard.vue'
// ContextMenu 移除：改由父组件统一控制添加菜单显示
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
    sortType?: string // 添加排序类型属性
    addMenuItems?: { label: string; icon: string; type: 'app' | 'test' | 'custom'; handler?: (() => void | Promise<void>) | undefined }[]
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
    // 请求父组件打开“添加”菜单（位置由占位符或空白处点击提供）
    (e: 'request-add-menu', position: { x: number; y: number }): void
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

// 占位符菜单改为父组件统一管理，这里仅负责触发事件

// 计算网格项目的尺寸
const FIXED_COLUMNS = 4
const GRID_UNIT_WIDTH = Math.floor(12 / FIXED_COLUMNS) // =3
const getItemSize = () => {
    if (props.layoutMode === 'list') {
        return { w: 12, h: 1 }
    }
    return { w: GRID_UNIT_WIDTH, h: 2 }
}

// 自定义列配置类型（需求：使用 columnOptions 类型）
interface ColumnOptions {
    columnWidth?: number
    columnMax?: number
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type __EnsureColumnOptionsUsed = ColumnOptions | undefined

// 说明：不直接扩展库内类型，保持最小必要字段并添加 columnOptions 供后续使用

// 初始化 GridStack
const initGridStack = async () => {
    if (!gridContainer.value || isInitialized.value) return

    try {
        // GridStack 配置
    const options = {
            column: 12, // 基础列数（内部仍以12列细分）
            cellHeight: 'auto',
            margin: 8,
            disableResize: true,
            maxRow: 2 * 6, // 6行
            float: false,
            alwaysShowResizeHandle: false,
            // columnOptions: ({
            //     columnWidth: 100,
            //     columnMax: 12,
            //     layout: 'list',
            // }) as ColumnOptions,
        }

        grid = GridStack.init(options, gridContainer.value)
        isInitialized.value = true

        grid.on('dragstart', (event, element) => {
            emit('drag-start', { element, event })
        })
        grid.on('dragstop', (event, element) => {
            if (element) {
                const node = (element as HTMLElement & { gridstackNode?: GridStackNode }).gridstackNode
                if (node) {
                    // 仅允许 0,3,6,9 四个起始列 (12 栏宽度中每 3 为一列)
                    const allowed = [0, GRID_UNIT_WIDTH, GRID_UNIT_WIDTH * 2, GRID_UNIT_WIDTH * 3]
                    let targetX = node.x ?? 0
                    // 找到最近允许列
                    const currentX = node.x ?? 0
                    targetX = allowed.reduce<number>((prev, curr) => {
                        return Math.abs(curr - currentX) < Math.abs(prev - currentX) ? curr : prev
                    }, allowed[0] as number)
                    if (targetX !== node.x) {
                        suppressChange = true
                        grid?.update(element as HTMLElement, { x: targetX })
                        suppressChange = false
                    }
                }
            }
            emit('drag-end', { element, event })
        })
        grid.on('resizestop', (_e, _element) => {
            // 预留 resize 处理
        })
        grid.on('change', (_event, items) => {
            if (suppressChange) return
            if (!items || items.length === 0) return

            // 生成完整快照，避免只保存变更节点导致其余项目下次重新布局
            const snapshot: Array<{ id: string; position: { x: number; y: number; w: number; h: number } }> = []
            const nodes: GridStackNode[] = (grid as unknown as { engine?: { nodes?: GridStackNode[] } })
                .engine?.nodes || []
            nodes.forEach((node: GridStackNode) => {
                const el = node.el as HTMLElement | undefined
                const appId = el?.getAttribute('gs-id')
                if (appId != null && node.x != null && node.y != null && node.w != null && node.h != null) {
                    snapshot.push({ id: appId, position: { x: node.x, y: node.y, w: node.w, h: node.h } })
                }
            })

            if (snapshot.length) {
                // console.log('💾 GridStack - 保存完整位置快照 (共', snapshot.length, '项):', snapshot)
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
    // 不再提前返回；即使没有应用也需生成占位符

    const itemSize = getItemSize()
    
    let x = 0, y = 0

    // 添加应用项目
    props.applications.forEach((app) => {
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
                // console.log(`📃 [List] 应用 "${app.name}" 顺序位置: y=${gy}`)
            } else if (pos && props.sortType === 'custom') {
                // 网格模式：仅在自定义排序时使用保存位置，其他排序方式按数组顺序排布以保持一致性
                gx = Math.min(12 - GRID_UNIT_WIDTH, Math.round((pos.x || 0) / GRID_UNIT_WIDTH) * GRID_UNIT_WIDTH)
                gy = pos.y
                gw = GRID_UNIT_WIDTH // 固定列宽
                gh = pos.h || itemSize.h
                // console.log(`🎯 [Grid] 应用 "${app.name}" 使用归一化位置: x=${gx}, y=${gy}, w=${gw}, h=${gh} (自定义排序)`)
            } else {
                // 网格模式：非自定义排序或无保存位置时，按照数组顺序排布
                // console.log(`📍 [Grid] 应用 "${app.name}" 使用默认顺序位置: x=${gx}, y=${gy}, w=${gw}, h=${gh} (排序类型: ${props.sortType || 'unknown'})`)
            }

            element.setAttribute('gs-id', app.id)
            element.setAttribute('gs-x', gx.toString())
            element.setAttribute('gs-y', gy.toString())
            element.setAttribute('gs-w', gw.toString())
            element.setAttribute('gs-h', gh.toString())

            grid.makeWidget(element)
        }

        // 计算下一个顺序位置（列表模式始终使用；网格模式仅当没有保存位置或非自定义排序时）
        if (props.layoutMode === 'list' || !app.gridPosition || props.sortType !== 'custom') {
            x += itemSize.w
            if (x >= 12 || props.layoutMode === 'list') { // 列表模式每行一个
                x = 0
                y += itemSize.h
            }
        }
    })

    // 占位符：在网格模式下补足 4x4 = 16 个槽位
    if (props.layoutMode === 'grid') {
        const TOTAL_SLOTS = 16 // 4x4 固定
        const slotWidth = GRID_UNIT_WIDTH
        const slotHeight = itemSize.h
        const perRow = 4

        // 收集已占用 (x,y) 起点，避免重复
        const occupied = new Set<string>()
        const nodes: GridStackNode[] = (grid as unknown as { engine?: { nodes?: GridStackNode[] } })
            .engine?.nodes || []
        nodes.forEach((node: GridStackNode) => {
            if (node.x != null && node.y != null) {
                occupied.add(`${node.x},${node.y}`)
            }
        })

        let created = 0
        for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
            const row = Math.floor(slot / perRow)
            const col = slot % perRow
            const gx = col * slotWidth
            const gy = row * slotHeight
            const key = `${gx},${gy}`
            if (occupied.has(key)) continue // 已有真实应用占位
            // 创建占位符
            const placeholder = document.createElement('div')
            placeholder.className = 'grid-app-stack-item placeholder'
            const content = document.createElement('div')
            content.className = 'grid-app-stack-item-content placeholder-content'
            content.innerHTML = '<div class="placeholder-inner"><i class="pi pi-plus"></i></div>'
            placeholder.appendChild(content)
            placeholder.setAttribute('gs-x', gx.toString())
            placeholder.setAttribute('gs-y', gy.toString())
            placeholder.setAttribute('gs-w', slotWidth.toString())
            placeholder.setAttribute('gs-h', slotHeight.toString())
            placeholder.setAttribute('data-placeholder', 'true')
            placeholder.setAttribute('gs-no-move', 'true')
            placeholder.setAttribute('gs-no-resize', 'true')
            placeholder.setAttribute('gs-locked', 'true')
            // 点击占位符视为在空白处点击，可触发添加逻辑
            content.addEventListener('click', (e) => {
                emit('request-add-menu', { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY })
            })
            grid.makeWidget(placeholder)
            created++
        }
        // console.log(`➕ GridStack - 创建占位符: ${created} 个 (目标 ${TOTAL_SLOTS})`)
    }

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

// 监听排序类型变化
watch(() => props.sortType, async () => {
    console.log('🔍 GridStack - sortType变化:', props.sortType)
    // 排序类型变化时重新加载应用以确保布局一致性
    await loadApplications()
})

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
    overflow: auto;
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
    height: 100%;
    overflow: auto;
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
:deep(.grid-app-stack-item.placeholder .grid-app-stack-item-content) {
    background: transparent;
    border: 1px dashed #e2e8f0;
    transition: background-color .15s ease, border-color .15s ease;
}

:deep(.grid-app-stack-item.placeholder .grid-app-stack-item-content:hover) {
    background: rgba(59,130,246,0.06);
    border-color: #3b82f6;
}

:deep(.grid-app-stack-item.placeholder .placeholder-inner) {
    display:flex;
    align-items:center;
    justify-content:center;
    width:100%;
    height:100%;
}

:deep(.grid-app-stack-item.placeholder .placeholder-inner .pi) {
    font-size: 2rem;
    color:#94a3b8;
}

:deep(.grid-app-stack-item.placeholder .grid-app-stack-item-content:hover .placeholder-inner .pi) {
    color:#3b82f6;
}

.dark :deep(.grid-app-stack-item.placeholder .grid-app-stack-item-content) {
    border-color:#374151;
}

.dark :deep(.grid-app-stack-item.placeholder .placeholder-inner .pi) {
    color:#64748b;
}
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
</style>
