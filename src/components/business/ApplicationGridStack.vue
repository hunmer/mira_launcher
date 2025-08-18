<template>
    <div
        class="app-page"
        @contextmenu.prevent="$emit('blank-context-menu', $event)"
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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const gridContainer = ref<HTMLElement>()
let grid: GridStack | null = null
const isInitialized = ref(false)

// ===== 布局控制状态 =====
let debounceTimer: number | null = null
let isRelayoutRunning = false
// (可选) 布局签名仅用于日志比较，不做持久化
let interactionProtectedStartY: number | null = null // 保护分界线：该行之上的内容不再调整
let currentInteractionWidgetId: string | null = null // 当前拖拽/调整中的 widget

// 原始尺寸记录：只记录第一次（或用户手动 resize 更新）用于避免累积偏移
const originalSizes = new Map<string, { w: number; h: number }>()

// 统一的重排调度（可延迟）
const scheduleRelayout = (opts: { startY?: number; reason?: string; delay?: number; excludeIds?: string[] } = {}) => {
    const { startY, reason = '', delay = 120, excludeIds = [] } = opts
    // 只向下扩展保护线，不向上收缩
    if (typeof startY === 'number') {
        if (interactionProtectedStartY == null) interactionProtectedStartY = startY
        else interactionProtectedStartY = Math.min(interactionProtectedStartY, startY)
    }
    if (debounceTimer) window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => runRelayout({ excludeIds }), delay)
    if (reason) console.log(`🕒 [Relayout Scheduled] ${reason} startY=${interactionProtectedStartY}`)
}

// 立即运行重排（内部防重入）
const runRelayout = (opts: { excludeIds?: string[] } = {}) => {
    if (!grid) return
    if (isRelayoutRunning) return
    isRelayoutRunning = true
    try {
        const signatureBefore = computeLayoutSignature()
        const all = collectNodes()
        const protectedY = interactionProtectedStartY
        verticalCompact(all, { protectedY, excludeIds: opts.excludeIds ?? [] })
        fillGaps(all, { protectedY, excludeIds: opts.excludeIds ?? [] })
        justifyRows(all, { protectedY, excludeIds: opts.excludeIds ?? [] })
        const signatureAfter = computeLayoutSignature()
        if (signatureAfter !== signatureBefore) console.log('✅ [Relayout Applied]')
        else console.log('⚖️  [Relayout Stable] 无变化')
    } finally {
        isRelayoutRunning = false
    }
}

// ===== 工具函数 =====
const computeLayoutSignature = (): string => {
    if (!grid) return ''
    return grid.getGridItems()
        .map(el => (el as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode)
        .filter(n => n && n.id)
        .sort((a, b) => ((a.y || 0) - (b.y || 0)) || ((a.x || 0) - (b.x || 0)))
        .map(n => `${n.id}:${n.x},${n.y},${n.w},${n.h}`)
        .join('|')
}

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
            float: false, // 禁用浮动，保持网格对齐
            alwaysShowResizeHandle: false,
            // columnOpts: {
            //     columnWidth: 150,
            //     columnMax: 12,
            //     // layout: 'none',
            // },
        }

        grid = GridStack.init(options, gridContainer.value)
        isInitialized.value = true

        // 绑定事件
        // ===== 交互事件 =====
        grid.on('dragstart', (event, element) => {
            const node = (element as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
            currentInteractionWidgetId = node?.id || null
            interactionProtectedStartY = node?.y ?? null
            emit('drag-start', { element, event })
        })
        grid.on('dragstop', (event, element) => {
            const node = (element as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
            const startY = node?.y || 0
            currentInteractionWidgetId = null
            // 结束后基于新位置向下重排
            scheduleRelayout({ startY, reason: 'dragstop relayout', excludeIds: node?.id ? [node.id] : [] })
            emit('drag-end', { element, event })
            // 更新顺序（按 y,x 排）
            persistOrder()
        })
        grid.on('resizestop', (_e, element) => {
            const node = (element as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
            if (node?.id) recordOriginalSize(node.id, node.w || 1, node.h || 1, true)
            interactionProtectedStartY = node?.y ?? interactionProtectedStartY
            currentInteractionWidgetId = null
            // 构造参数对象，避免 undefined 属性
            const opts: { reason: string; excludeIds: string[]; startY?: number } = {
                reason: 'resizestop relayout',
                excludeIds: node?.id ? [node.id] : [],
            }
            if (typeof node?.y === 'number') opts.startY = node.y
            scheduleRelayout(opts)
        })
        grid.on('change', () => {
            // 拖拽/调整进行中不触发
            if (currentInteractionWidgetId) return
            scheduleRelayout({ reason: 'grid change' })
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
        console.error('❌ GridStack - grid对象不存在')
        return
    }

    console.log('🔄 GridStack - 开始加载应用:', props.applications.length, '个应用')
    
    // 清空现有项目
    grid.removeAll()

    if (props.applications.length === 0) {
        console.log('⚠️  GridStack - 没有应用需要加载')
        return
    }

    const itemSize = getItemSize()
    console.log('📏 GridStack - 计算项目大小:', itemSize)
    
    let x = 0, y = 0

    // 添加应用项目
    props.applications.forEach((app, index) => {
        console.log(`➕ GridStack - 添加应用 ${index + 1}/${props.applications.length}:`, app.name)
        
        // 创建DOM元素
        const element = document.createElement('div')
        element.className = 'grid-stack-item'
        
        // 创建内容容器
        const content = document.createElement('div')
        content.className = 'grid-stack-item-content'
        
        // 添加应用组件内容
        const appContent = createAppContent(app)
        content.appendChild(appContent)
        element.appendChild(content)

        if (grid) {
            // 如果有已保存的网格位置信息，使用它；否则使用顺序位置
            const pos = app.gridPosition
            const gx = pos?.x ?? x
            const gy = pos?.y ?? y
            const gw = pos?.w ?? itemSize.w
            const gh = pos?.h ?? itemSize.h

            element.setAttribute('gs-id', app.id)
            element.setAttribute('gs-x', gx.toString())
            element.setAttribute('gs-y', gy.toString())
            element.setAttribute('gs-w', gw.toString())
            element.setAttribute('gs-h', gh.toString())

            // 记录原始大小（使用保存的大小）
            recordOriginalSize(app.id, gw, gh)

            grid.makeWidget(element)
        }

        // 计算下一个位置
        // 仅当没有保存位置时，按顺序计算下一个位置
        if (!app.gridPosition) {
            x += itemSize.w
            if (x >= 12) {
                x = 0
                y += itemSize.h
            }
        }
    })

    // 绑定应用事件
    await nextTick()
    console.log('✅ GridStack - 应用加载完成，当前网格中的项目数:', grid.getGridItems().length)
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

// ===== 新布局算法实现 =====

interface NodeInfo { element: HTMLElement; node: GridStackNode; id: string; x: number; y: number; w: number; h: number; baselineW: number; baselineH: number }

const collectNodes = (): NodeInfo[] => {
    if (!grid) return []
    return grid.getGridItems().map(el => {
        const node = (el as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
        const base = originalSizes.get(node.id || '')
        return {
            element: el as HTMLElement,
            node,
            id: node.id || '',
            x: node.x || 0,
            y: node.y || 0,
            w: node.w || 1,
            h: node.h || 1,
            baselineW: base?.w ?? (node.w || 1),
            baselineH: base?.h ?? (node.h || 1),
        }
    }).filter(n => n.id)
}

// 垂直压缩：只处理受保护行(含)之后的区域
const verticalCompact = (nodes: NodeInfo[], opts: { protectedY: number | null; excludeIds?: string[] }) => {
    if (!grid) return
    const exclude = new Set(opts.excludeIds || [])
    // 按 y,x 排序后向上尝试
    const sorted = [...nodes].sort((a, b) => (a.y - b.y) || (a.x - b.x))
    for (const n of sorted) {
        if (exclude.has(n.id)) continue
        if (opts.protectedY != null && n.y < opts.protectedY) continue
        let targetY = n.y
        while (targetY > 0) {
            const tryY = targetY - 1
            if (opts.protectedY != null && tryY < opts.protectedY) break
            const collision = nodes.some(o => {
                if (o.id === n.id) return false
                if (o.y + o.h <= tryY || tryY + n.h <= o.y) return false
                // 垂直重叠，检查水平
                return !(o.x + o.w <= n.x || n.x + n.w <= o.x)
            })
            if (collision) break
            targetY = tryY
        }
        if (targetY !== n.y) {
            grid.update(n.element, { y: targetY })
            n.y = targetY
        }
    }
}

// 填补空洞：扫描每个 y 行层（高度单位）生成空段，尝试从下方提升合适高度和宽度的 widget
const fillGaps = (nodes: NodeInfo[], opts: { protectedY: number | null; excludeIds?: string[] }) => {
    if (!grid) return
    const exclude = new Set(opts.excludeIds || [])
    const maxY = Math.max(0, ...nodes.map(n => n.y + n.h))
    for (let row = opts.protectedY ?? 0; row < maxY; row++) {
        // 收集当前层占用区间
        const layer = nodes.filter(n => n.y <= row && row < n.y + n.h)
        const segments: Array<{ start: number; end: number }> = []
        // 初始空段 [0,12)
        let free: Array<{ s: number; e: number }> = [{ s: 0, e: 12 }]
        layer.forEach(n => {
            const nx1 = n.x
            const nx2 = n.x + n.w
            free = free.flatMap(seg => {
                // 无交集
                if (nx2 <= seg.s || nx1 >= seg.e) return [seg]
                const arr: Array<{ s: number; e: number }> = []
                if (nx1 > seg.s) arr.push({ s: seg.s, e: nx1 })
                if (nx2 < seg.e) arr.push({ s: nx2, e: seg.e })
                return arr
            })
        })
        segments.push(...free.map(f => ({ start: f.s, end: f.e })))
        if (!segments.length) continue
        // 尝试填充每个空段
        for (const gap of segments) {
            const width = gap.end - gap.start
            if (width <= 0) continue
            // 找候选：在 gap 下方(>row) 的 widget，且高度覆盖 row+其自身高度 (可上移)，宽度基线<=gap宽
            const candidates = nodes.filter(n => {
                if (exclude.has(n.id)) return false
                if (n.y <= row) return false // 仅考虑下方
                if (n.baselineW > width) return false
                // 上移后检查是否与行内其它 widget 冲突
                return true
            })
            // 按距离与宽度差排序
            candidates.sort((a, b) => (a.y - b.y) || (a.baselineW - b.baselineW))
            for (const c of candidates) {
                // 目标位置：y = row - (c.h - 1) （保持底部贴合 row+1）但为简单直接放到 row 行顶部
                const targetY = row
                // 检查是否与已在此新层区域(或跨行区域)的其它节点冲突
                const collision = nodes.some(o => {
                    if (o.id === c.id) return false
                    // 未来位置占用区间
                    const nx = gap.start
                    const nw = c.baselineW
                    const ny = targetY
                    const nh = c.h
                    if (o.x + o.w <= nx || nx + nw <= o.x) return false
                    if (o.y + o.h <= ny || ny + nh <= o.y) return false
                    return true
                })
                if (collision) continue
                // 移动 & 复原宽度到 baseline（避免累积放大）
                grid.update(c.element, { x: gap.start, y: targetY, w: c.baselineW })
                c.x = gap.start
                c.y = targetY
                c.w = c.baselineW
                // 更新 gap 剩余
                const remain = width - c.w
                if (remain > 0) {
                    // 产生新的次级 gap
                    segments.push({ start: gap.start + c.w, end: gap.end })
                }
                break // 每个 gap 只填一次（留给后续循环继续）
            }
        }
    }
}

// 行横向压缩并尝试“更宽松的填满”：允许在不超过 baseline+2 范围内扩展以填满 12 列
const justifyRows = (nodes: NodeInfo[], opts: { protectedY: number | null; excludeIds?: string[] }) => {
    if (!grid) return
    const exclude = new Set(opts.excludeIds || [])
    // 按行聚合（以 y 作为行顶部）
    const rows = new Map<number, NodeInfo[]>()
    for (const n of nodes) {
        if (opts.protectedY != null && n.y < opts.protectedY) continue
        if (!rows.has(n.y)) rows.set(n.y, [])
        const arr = rows.get(n.y)
        if (arr) arr.push(n)
    }
    for (const [, list] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
        // 横向压缩
        list.sort((a, b) => a.x - b.x)
        let cursor = 0
        for (const n of list) {
            if (n.x !== cursor && !exclude.has(n.id)) {
                grid.update(n.element, { x: cursor })
                n.x = cursor
            }
            cursor += n.w
        }
        const deficit = 12 - cursor
        if (deficit <= 0) continue
        // 按 baseline 剩余可扩展空间计算权重
        const expandable = list.filter(n => !exclude.has(n.id))
        if (!expandable.length) continue
        const capacities = expandable.map(n => ({ n, cap: Math.max(0, (n.baselineW + 2) - n.w) })) // baseline+2 上限
    const totalCap = capacities.reduce((s, c) => s + c.cap, 0)
        if (totalCap <= 0) continue
        let remain = deficit
        for (const c of capacities) {
            if (remain <= 0) break
            const add = Math.min(c.cap, Math.ceil(deficit * (c.cap / totalCap)))
            if (add > 0) {
                grid.update(c.n.element, { w: c.n.w + add })
                c.n.w += add
                remain -= add
            }
        }
        // 若还有剩余，顺序分配
        if (remain > 0) {
            for (const c of capacities) {
                if (remain <= 0) break
                if (c.n.w < c.n.baselineW + 2) {
                    grid.update(c.n.element, { w: c.n.w + 1 })
                    c.n.w += 1
                    remain--
                }
            }
        }
    }
}

// 记录原始大小（只在首次或用户手动调整 overwrite=true）
const recordOriginalSize = (id: string, w: number, h: number, overwrite = false) => {
    if (!originalSizes.has(id) || overwrite) originalSizes.set(id, { w, h })
}

// 更新应用顺序（拖拽结束后按照 y,x 排）
const persistOrder = () => {
    if (!grid) return
    const nodes = grid.getGridItems().map((el: Element) => {
        const node = (el as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
        return { id: node.id, x: node.x || 0, y: node.y || 0 }
    })
    const sortedApps = [...props.applications].sort((a, b) => {
        const A = nodes.find(n => n.id === a.id)
        const B = nodes.find(n => n.id === b.id)
        if (!A || !B) return 0
        if (A.y !== B.y) return A.y - B.y
        return A.x - B.x
    })
    emit('update:applications', sortedApps)
}

// 更新应用位置（模式切换时，只重排不改变原始大小）
const updateApplicationPositions = (apps: Application[]) => {
    if (!grid) return
    const nodes = collectNodes()
    // 简单按顺序重新计算 x,y（保留原始 w,h）
    let x = 0, y = 0, rowHeight = 0
    apps.forEach(app => {
        const info = nodes.find(n => n.id === app.id)
        if (!info) return
        if (x + info.w > 12) { x = 0; y += rowHeight; rowHeight = 0 }
    grid?.update(info.element, { x, y })
        info.x = x; info.y = y
        x += info.w
        rowHeight = Math.max(rowHeight, info.h)
    })
    scheduleRelayout({ startY: 0, reason: 'layoutMode change reposition' })
}


watch(() => props.layoutMode, async () => {
    console.log('🔍 GridStack - layoutMode变化:', props.layoutMode)
    if (grid && isInitialized.value) {
    if (props.applications.length > 0) updateApplicationPositions(props.applications)
    }
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
    overflow: hidden; /* 隐藏滚动条 */
}

.empty-grid {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
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

:deep(.grid-stack-item) {
    overflow: hidden;
}

/* 应用项目样式 */
:deep(.grid-stack-item-content) {
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

:deep(.grid-stack-item-content:hover) {
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
:deep(.grid-stack-item.ui-draggable-dragging) {
    opacity: 0.8;
    transform: scale(1.05) rotate(2deg);
    z-index: 1000;
    /* box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2); */
}

/* 深色主题支持 */
.dark :deep(.grid-stack-item-content) {
    background: #1f2937;
    border-color: #374151;
}

.dark :deep(.grid-stack-item-content:hover) {
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
