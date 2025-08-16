<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable vue/custom-event-name-casing -->
<template>
    <div class="app-page" @contextmenu.prevent="$emit('blank-context-menu', $event)">
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
            v-model="modelApplications"
            animation="150"
            :delay="0"
            :delay-on-touch-start="true"
            :delay-on-touch-only="false"
            :force-fallback="true"
            :fallback-on-body="false"
            :disabled="false"
            :group="{ name: 'applications' }"
            :sort="true"
            :swap-threshold="0.65"
            :empty-insert-threshold="5"
            :class="[
                layoutMode === 'grid' ? 'app-grid' : 'app-list'
            ]"
            :style="layoutMode === 'grid' ? {
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                gap: '12px'
            } : {}"
            item-key="id"
            ghost-class="ghost"
            chosen-class="chosen"
            drag-class="dragging"
            @start="onDragStart"
            @end="onDragEnd"
            @update="onDragUpdate"
            @change="onDragChange"
        >
            <template #item="{ element: app }">
                <div
                    :class="[
                        'app-item-wrapper',
                        layoutMode === 'list' ? 'list-item' : 'grid-item'
                    ]"
                >
                    <div
                        :class="[
                            'app-item',
                            layoutMode === 'list' ? 'list-layout' : 'grid-layout'
                        ]"
                        style="cursor: grab; user-select: none;"
                        @click.stop="$emit('launch-app', app)"
                        @contextmenu.prevent.stop="$emit('app-context-menu', app, $event)"
                    >
                        <div class="app-icon">
                            <img
                                v-if="app.icon"
                                :src="app.icon"
                                :alt="app.name"
                                :style="{
                                    width: (layoutMode === 'list' ? Math.min(iconSize, 48) : iconSize) + 'px',
                                    height: (layoutMode === 'list' ? Math.min(iconSize, 48) : iconSize) + 'px',
                                    maxWidth: '200px',
                                    maxHeight: '200px',
                                }"
                                class="object-contain"
                                draggable="false"
                                @dragstart.prevent
                                @selectstart.prevent
                            >
                            <AppIcon
                                v-else
                                name="monitor"
                                :size="layoutMode === 'list' ? Math.min(iconSize, 48) : iconSize"
                                class="text-gray-400"
                            />
                        </div>
                        <div class="app-info">
                            <div class="app-label">
                                {{ app.name }}
                            </div>
                            <div v-if="layoutMode === 'list'" class="app-path">
                                {{ app.path }}
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </VueDraggable>
    </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'
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
    (e: 'dragStart', event: DragEvent): void
    (e: 'dragEnd', event: DragEvent): void
    (e: 'dragChange', event: DragEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 双向绑定的应用列表
const modelApplications = computed({
    get: () => props.applications,
    set: (value) => {
        console.log('更新应用列表:', value.map(app => app.name))
        emit('update:applications', value)
    },
})

// 拖拽事件处理
const onDragStart = (evt: DragEvent) => {
    console.log('开始拖拽:', evt)
    emit('dragStart', evt)
}

const onDragEnd = (evt: DragEvent) => {
    console.log('拖拽结束:', evt)
    emit('dragEnd', evt)
}

const onDragUpdate = (evt: DragEvent) => {
    // vuedraggable 在同列表内排序会触发 update 事件
    console.log('拖拽更新:', evt)
    emit('dragChange', evt)
}

const onDragChange = (evt: DragEvent) => {
    console.log('拖拽变化:', evt)
    emit('dragChange', evt)
}
</script>

<style scoped>
.app-page {
    flex: 1;
    padding: 0;
    overflow-y: auto;
    min-height: 0;
}

/* 空状态样式 */
.empty-grid {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 2rem;
    border: 2px dashed rgb(209 213 219);
    border-radius: 12px;
    background-color: rgba(243, 244, 246, 0.5);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}

.empty-grid:hover {
    border-color: rgb(59, 130, 246);
    background-color: rgba(59, 130, 246, 0.05);
}

.dark .empty-grid {
    border-color: rgb(55, 65, 81);
    background-color: rgba(31, 41, 55, 0.5);
}

.dark .empty-grid:hover {
    border-color: rgb(59, 130, 246);
    background-color: rgba(59, 130, 246, 0.1);
}

.empty-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.empty-icon {
    font-size: 3rem;
    color: rgb(156, 163, 175);
    transition: color 0.2s ease-in-out;
}

.empty-grid:hover .empty-icon {
    color: rgb(59, 130, 246);
}

.empty-text {
    font-size: 1.125rem;
    color: rgb(107, 114, 128);
    font-weight: 500;
    transition: color 0.2s ease-in-out;
}

.empty-grid:hover .empty-text {
    color: rgb(59, 130, 246);
}

.dark .empty-icon {
    color: rgb(107, 114, 128);
}

.dark .empty-text {
    color: rgb(156, 163, 175);
}

.dark .empty-grid:hover .empty-icon,
.dark .empty-grid:hover .empty-text {
    color: rgb(59, 130, 246);
}

.app-grid {
    display: grid;
    width: 100%;
    min-height: 100%;
    align-content: start;
}

.app-list {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100%;
    gap: 0.5rem;
}

.app-item-wrapper {
    width: 100%;
}

.app-item-wrapper.grid-item {
    height: 100%;
    min-height: 120px;
}

.app-item-wrapper.list-item {
    height: auto;
}

.app-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    border-radius: 12px;
    background-color: rgba(255, 255, 255, 0.6);
    border: 2px solid transparent;
    transition: all 0.2s ease-in-out;
    cursor: grab;
    backdrop-filter: blur(8px);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.app-item:active {
    cursor: grabbing;
}

.app-item.grid-layout {
    flex-direction: column;
    text-align: center;
}

.app-item.list-layout {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
    gap: 1rem;
    padding: 0.75rem 1rem;
}

.dark .app-item {
    background-color: rgba(55, 65, 81, 0.6);
}

.app-item:hover {
    background-color: rgba(243, 244, 246, 0.8);
    border-color: rgba(59, 130, 246, 0.5);
    transform: translateY(-2px);
}

.dark .app-item:hover {
    background-color: rgba(55, 65, 81, 0.8);
}

.app-item:active {
    transform: translateY(0);
}

.app-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.app-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
}

.app-label {
    font-size: 0.875rem;
    line-height: 1.25;
    color: rgb(55 65 81);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
}

.app-item.list-layout .app-label {
    text-align: left;
    font-size: 1rem;
    font-weight: 600;
}

.app-path {
    font-size: 0.75rem;
    color: rgb(107 114 128);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dark .app-label {
    color: #e5e7eb;
}

.dark .app-path {
    color: rgb(156 163 175);
}

/* 拖拽状态样式 */
.ghost {
    opacity: 0 !important;
    background-color: rgba(59, 130, 246, 0.1) !important;
    border: 2px dashed rgba(59, 130, 246, 0.4) !important;
    border-radius: 12px;
    cursor: grabbing !important;
    transform: scale(0.95) !important;
}

.ghost .app-item {
    background-color: transparent !important;
    border: none !important;
    cursor: grabbing !important;
    opacity: 0 !important;
}

.chosen {
    background-color: rgba(59, 130, 246, 0.15) !important;
    border-color: rgba(59, 130, 246, 0.7) !important;
    transform: scale(1.02) !important;
    cursor: grabbing !important;
    z-index: 1000 !important;
}

.chosen .app-item {
    background-color: rgba(59, 130, 246, 0.2) !important;
    border-color: rgba(59, 130, 246, 0.8) !important;
    cursor: grabbing !important;
}

.dragging {
    opacity: 0.9 !important;
    transform: rotate(2deg) scale(1.05) !important;
    z-index: 2000 !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6) !important;
    transition: none !important;
    cursor: grabbing !important;
    pointer-events: none !important;
}

.dragging .app-item {
    background-color: rgba(55, 65, 81, 0.95) !important;
    border-color: rgba(59, 130, 246, 0.9) !important;
    cursor: grabbing !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
}

/* 确保拖拽时显示正确的游标 */
.app-item-wrapper:hover {
    cursor: grab;
}

.app-item-wrapper:active {
    cursor: grabbing;
}

/* 应用图标样式优化 */
.app-icon img {
    transition: transform 0.2s ease-in-out;
    user-select: none;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    pointer-events: none;
    border-radius: 8px;
}

.app-item:hover .app-icon img {
    transform: scale(1.05);
}

/* 确保SVG图标正确渲染 */
.app-icon svg {
    transition: transform 0.2s ease-in-out;
    user-select: none;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    pointer-events: none;
}

.app-item:hover .app-icon svg {
    transform: scale(1.05);
}

/* 响应式布局优化 */
@media (max-width: 800px) {
    .app-item {
        padding: 0.5rem;
        min-height: 100px;
    }

    .app-label {
        font-size: 0.75rem;
    }
}

/* 全局拖拽样式覆盖 */
:global(.sortable-ghost) {
    cursor: grabbing !important;
}

:global(.sortable-chosen) {
    cursor: grabbing !important;
}

:global(.sortable-drag) {
    cursor: grabbing !important;
}
</style>
