/* eslint-disable */
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

        <!-- 应用网格 -->
        <VueDraggable
            v-else
            v-model="modelApplicationsList"
            item-key="id"
            :class="[layoutMode === 'grid' ? 'app-grid' : 'app-list']"
            :style="
                layoutMode === 'grid'
                    ? {
                        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                        gap: '12px',
                    }
                    : {}
            "
            animation="200"
            ghost-class="drag-ghost"
            chosen-class="drag-chosen"
            drag-class="drag-dragging"
            :disabled="false"
            :force-fallback="false"
            :fallback-on-body="true"
            :swap-threshold="0.5"
            :direction="layoutMode === 'grid' ? 'grid' : 'vertical'"
            :empty-insert-threshold="10"
            :scroll-sensitivity="100"
            :scroll-speed="10"
            :bubble-scroll="true"
            @start="onDragStart"
            @end="onDragEnd"
            @change="onDragChange"
        >
            <template #item="{ element: app }">
                <div
                    :class="[
                        'app-item-wrapper',
                        layoutMode === 'list' ? 'list-item' : 'grid-item',
                    ]"
                >
                    <ApplicationCard
                        :app="app"
                        :layout-mode="layoutMode"
                        :icon-size="iconSize"
                        @launch="$emit('launch-app', app)"
                        @context-menu="(application, event) => $emit('app-context-menu', application, event)"
                    />
                </div>
            </template>
        </VueDraggable>
    </div>
</template>

<script setup lang="ts">
import ApplicationCard from '@/components/business/ApplicationCard.vue'
import type { Application } from '@/stores/applications'
import { computed } from 'vue'
import VueDraggable from 'vuedraggable'

interface Props {
    applications: Application[]
    layoutMode: 'grid' | 'list'
    gridColumns: number
    iconSize: number
}

interface DragEvent {
    oldIndex?: number
    newIndex?: number
    item?: HTMLElement
    moved?: {
        element: Application
        oldIndex: number
        newIndex: number
    }
    added?: {
        element: Application
        newIndex: number
    }
    removed?: {
        element: Application
        oldIndex: number
    }
}

interface Emits {
    (e: 'update:applications', apps: Application[]): void
    (e: 'launch-app', app: Application): void
    (e: 'app-context-menu', app: Application, event: MouseEvent): void
    (e: 'blank-context-menu', event: MouseEvent): void
    (e: 'drag-start', event: DragEvent): void
    (e: 'drag-end', event: DragEvent): void
    (e: 'drag-change', event: DragEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 正确的 v-model 实现
const modelApplicationsList = computed({
    get: () => {
        console.log('📥 ApplicationGrid - 获取应用列表:', props.applications.map(app => app.name))
        return props.applications
    },
    set: (value: Application[]) => {
        console.log('📤 ApplicationGrid - 更新应用列表:', value.map(app => app.name))
        emit('update:applications', value)
    },
})

// 拖拽事件处理
const onDragStart = (evt: DragEvent) => {
    console.log('🟢 ApplicationGrid - 开始拖拽:', evt)
    emit('drag-start', evt)
}

const onDragEnd = (evt: DragEvent) => {
    console.log('🔴 ApplicationGrid - 拖拽结束:', evt)
    emit('drag-end', evt)
}

const onDragChange = (evt: DragEvent) => {
    console.log('🔄 ApplicationGrid - 拖拽变化:', evt)
    emit('drag-change', evt)
}
</script>

<style scoped>
/* 页面容器样式 */
.app-page {
    width: 100%;
    height: 100%;
    padding: 16px;
    overflow-y: auto;
}

/* 空状态样式 */
.empty-grid {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    cursor: pointer;
    border: 2px dashed #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    transition: all 0.2s ease-in-out;
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

/* 网格布局容器 */
.app-grid {
    display: grid;
    gap: 12px;
    width: 100%;
}

/* 网格项目包装器 */
.app-grid .grid-item {
    aspect-ratio: 1;
    border-radius: 12px;
    background: white;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease-in-out;
    cursor: grab;
    user-select: none;
    overflow: hidden;
}

.app-grid .grid-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
}

.app-grid .grid-item:active {
    cursor: grabbing;
}

/* 列表布局容器 */
.app-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

/* 列表项目包装器 */
.app-list .list-item {
    border-radius: 8px;
    background: white;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease-in-out;
    cursor: grab;
    user-select: none;
    overflow: hidden;
}

.app-list .list-item:hover {
    background: #f8fafc;
    border-color: #3b82f6;
}

.app-list .list-item:active {
    cursor: grabbing;
}

/* 应用项目内容容器 - 让ApplicationCard组件完全控制内部样式 */
.app-item-wrapper {
    width: 100%;
    height: 100%;
}

.grid-item .app-item-wrapper {
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 拖拽状态样式 */
.drag-ghost {
    opacity: 0.4 !important;
    background: #e0e7ff !important;
    border: 2px dashed #3b82f6 !important;
    transform: scale(0.95) !important;
    pointer-events: none !important;
}

.drag-chosen {
    cursor: grabbing !important;
    transform: scale(1.02) !important;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
    z-index: 1000 !important;
}

.drag-dragging {
    opacity: 0.9 !important;
    transform: scale(1.05) rotate(3deg) !important;
    z-index: 1001 !important;
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2) !important;
}

/* 拖拽动画优化 */
.app-grid:has(.drag-chosen) {
    transition: all 0.2s ease-out;
}

.app-grid .grid-item:not(.drag-chosen):not(.drag-ghost) {
    transition: transform 0.2s ease-out;
}

.app-list:has(.drag-chosen) {
    transition: all 0.2s ease-out;
}

.app-list .list-item:not(.drag-chosen):not(.drag-ghost) {
    transition: transform 0.2s ease-out;
}

/* 深色主题 */
.dark .app-grid .grid-item,
.dark .app-list .list-item {
    background: #1f2937;
    border-color: #374151;
}

.dark .app-grid .grid-item:hover,
.dark .app-list .list-item:hover {
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

/* 响应式调整 */
@media (max-width: 768px) {
    .app-page {
        padding: 12px;
    }
    
    .app-grid {
        gap: 8px;
    }
    
    .grid-item .app-item-wrapper {
        padding: 12px;
    }
}
</style>
