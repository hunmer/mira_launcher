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
    (e: 'drag-change', event: DragEventData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const gridContainer = ref<HTMLElement>()
let grid: GridStack | null = null
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
            cellHeight: props.layoutMode === 'list' ? '80px' : '140px', // 为网格模式提供足够高度
            margin: 8, // 增加边距避免边框被遮挡
            float: false, // 禁用浮动，保持网格对齐
            removable: false, // 禁用删除
            animate: false, // 完全禁用动画，避免卡顿
            alwaysShowResizeHandle: false,
        }

        grid = GridStack.init(options, gridContainer.value)
        isInitialized.value = true

        // 绑定事件
        grid.on('dragstart', (event, element) => {
            console.log('🟢 GridStack - 开始拖拽:', element)
            emit('drag-start', { element, event })
        })

        grid.on('dragstop', (event, element) => {
            console.log('🔴 GridStack - 拖拽结束:', element)
            
            // 更新应用顺序
            if (grid) {
                const nodes = grid.getGridItems().map((el: Element) => {
                    const node = (el as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
                    return {
                        id: node.id,
                        x: node.x || 0,
                        y: node.y || 0,
                        w: node.w || 1,
                        h: node.h || 1,
                    }
                })

                // 根据位置重新排序应用（按照拖拽后的实际位置）
                const sortedApps = [...props.applications].sort((a, b) => {
                    const nodeA = nodes.find(n => n.id === a.id)
                    const nodeB = nodes.find(n => n.id === b.id)
                    
                    if (!nodeA || !nodeB) return 0
                    
                    // 首先按行排序，然后按列排序
                    if (nodeA.y !== nodeB.y) {
                        return nodeA.y - nodeB.y
                    }
                    return nodeA.x - nodeB.x
                })

                // 保存新的拖拽排序，不考虑反序状态
                // 拖拽操作本身就是用户的自定义排序意图
                emit('update:applications', sortedApps)
            }
            emit('drag-end', { element, event })
        })

        grid.on('change', (event, items) => {
            console.log('🔄 GridStack - 网格变化:', items)
            emit('drag-change', { event, items })
        })

        grid.on('resizestop', (event, element) => {
            console.log('📏 GridStack - 调整大小结束:', element)
            
            // 只触发change事件，不重新排序应用
            // 调整大小不应该改变应用的顺序，只需要保存网格状态
            if (grid) {
                const nodes = grid.getGridItems().map((el: Element) => {
                    const node = (el as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
                    return {
                        id: node.id,
                        x: node.x || 0,
                        y: node.y || 0,
                        w: node.w || 1,
                        h: node.h || 1,
                    }
                })
                
                // 只保存网格布局状态，不改变应用数组顺序
                console.log('💾 GridStack - 保存网格布局状态:', nodes)
            }
            emit('drag-change', { element, event })
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
    console.log('🧹 GridStack - 已清空现有项目')

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

        console.log('🎨 GridStack - 创建DOM元素完成:', element)

        if (grid) {
            // 先设置GridStack属性到元素上
            element.setAttribute('gs-id', app.id)
            element.setAttribute('gs-x', x.toString())
            element.setAttribute('gs-y', y.toString())
            element.setAttribute('gs-w', itemSize.w.toString())
            element.setAttribute('gs-h', itemSize.h.toString())
            
            // 使用 makeWidget 创建widget
            const widget = grid.makeWidget(element)
            console.log('📦 GridStack - makeWidget 完成:', widget)
        }

        // 计算下一个位置
        x += itemSize.w
        if (x >= 12) {
            x = 0
            y += itemSize.h
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

// 更新应用位置而不重新渲染
const updateApplicationPositions = (apps: Application[]) => {
    if (!grid) return
    
    // 对于位置重新排序，我们需要保留用户手动调整的大小
    // 但重新计算位置以避免重叠
    
    // 首先收集所有当前的节点信息（包括调整后的大小）
    const currentNodes = new Map<string, { w: number; h: number }>()
    grid.getGridItems().forEach((el: Element) => {
        const node = (el as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
        if (node.id) {
            currentNodes.set(node.id, {
                w: node.w || getItemSize().w,
                h: node.h || getItemSize().h,
            })
        }
    })
    
    // 重新排列所有widget，保持它们的自定义大小
    let currentRow = 0
    let currentCol = 0
    const defaultItemSize = getItemSize()
    
    apps.forEach((app) => {
        if (!grid) return
        
        // 查找对应的DOM元素
        const element = grid.getGridItems().find((el: Element) => {
            const node = (el as HTMLElement & { gridstackNode: GridStackNode }).gridstackNode
            return node.id === app.id
        }) as HTMLElement
        
        if (element) {
            // 获取当前widget的实际大小（保留用户调整的大小）
            const savedNode = currentNodes.get(app.id)
            const currentW = savedNode?.w || defaultItemSize.w
            const currentH = savedNode?.h || defaultItemSize.h
            
            // 检查当前位置是否能放下这个widget
            let newX = currentCol
            let newY = currentRow
            
            // 如果当前行放不下，移到下一行
            if (newX + currentW > 12) {
                newX = 0
                newY = currentRow + (savedNode?.h || defaultItemSize.h)
                currentCol = 0
                currentRow = newY
            }
            
            // 更新位置但保留当前大小
            grid.update(element, { x: newX, y: newY, w: currentW, h: currentH })
            console.log(`📍 更新应用位置: ${app.name} -> (${newX}, ${newY}) 大小: ${currentW}x${currentH}`)
            
            // 计算下一个位置
            currentCol = newX + currentW
            if (currentCol >= 12) {
                currentCol = 0
                currentRow += currentH
            }
        }
    })
}

// 监听属性变化
watch(() => props.applications, async (newApps, oldApps) => {
    console.log('🔍 GridStack - applications变化:', newApps.length, '个应用')
    if (grid && isInitialized.value) {
        // 检查是否只是重新排序（相同的应用，不同的顺序）
        const isSameApps = newApps.length === oldApps?.length && 
            newApps.every(app => oldApps?.some(oldApp => oldApp.id === app.id))
        
        if (isSameApps) {
            console.log('🔄 GridStack - 应用重新排序，更新位置而不重新渲染')
            updateApplicationPositions(newApps)
        } else {
            console.log('🔄 GridStack - 应用内容变化，重新加载')
            await loadApplications()
        }
    }
}, { deep: true })

watch(() => props.layoutMode, async () => {
    console.log('🔍 GridStack - layoutMode变化:', props.layoutMode)
    if (grid && isInitialized.value) {
        // 重新设置单元格高度
        grid.cellHeight(props.layoutMode === 'list' ? '80px' : '140px')
        // 更新现有项目的尺寸而不是重新加载
        if (props.applications.length > 0) {
            updateApplicationPositions(props.applications)
        }
    }
})

watch(() => props.gridColumns, async () => {
    console.log('🔍 GridStack - gridColumns变化:', props.gridColumns)
    if (grid && isInitialized.value && props.applications.length > 0) {
        // 更新应用位置以适应新的列数
        updateApplicationPositions(props.applications)
    }
})

watch(() => props.iconSize, async () => {
    if (grid && isInitialized.value) {
        await loadApplications()
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
    min-height: 400px;
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
