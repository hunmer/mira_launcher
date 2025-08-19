<template>
    <div
        class="app-card"
        :class="{ 'app-card--grid': layoutMode === 'grid', 'app-card--list': layoutMode === 'list' }"
        :data-app-id="app.id"
        @click="$emit('launch', app)"
        @contextmenu.prevent="$emit('context-menu', app, $event)"
    >
        <!-- 插件标识Badge -->
        <div 
            v-if="pluginInfo" 
            class="app-card__plugin-badge" 
            :class="{ 
                'app-card__plugin-badge--grid': layoutMode === 'grid', 
                'app-card__plugin-badge--list': layoutMode === 'list' 
            }"
            :title="`通过插件添加: ${pluginInfo.label}`"
        >
            <div class="plugin-badge">
                <i :class="pluginInfo.icon || 'pi pi-puzzle-piece'" />
            </div>
        </div>
        
        <div class="app-card__icon">
            <img
                v-if="app.icon"
                :src="app.icon"
                :alt="app.name"
                class="app-card__icon-img"
                draggable="false"
                :style="iconStyle"
            >
            <div
                v-else
                class="app-card__icon-placeholder"
                :style="iconStyle"
            >
                <i class="pi pi-desktop" />
            </div>
        </div>
        <div class="app-card__info">
            <div class="app-card__label">
                {{ app.name }}
            </div>
            <div
                v-if="layoutMode === 'list'"
                class="app-card__path"
            >
                {{ app.path }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAddEntriesStore } from '@/stores/addEntries'
import type { Application } from '@/stores/applications'
import { computed } from 'vue'

interface Props {
    app: Application
    layoutMode: 'grid' | 'list'
    iconSize: number
}

interface Emits {
    (e: 'launch', app: Application): void
    (e: 'context-menu', app: Application, event: MouseEvent): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const addEntriesStore = useAddEntriesStore()

// 获取插件信息
const pluginInfo = computed(() => {
    if (!props.app.appType) return null
    return addEntriesStore.entries.find(entry => entry.appType === props.app.appType || entry.id === props.app.appType)
})

const iconStyle = computed(() => {
    // 在网格模式下，图标大小根据卡片高度自动调整
    if (props.layoutMode === 'grid') {
        // 从iconSize prop获取基础尺寸，但确保在合理范围内
        const baseSize = Math.max(32, Math.min(props.iconSize, 200))
        return {
            width: `${baseSize}px`,
            height: `${baseSize}px`,
            fontSize: `${Math.max(16, baseSize * 0.5)}px`,
            maxWidth: '80%', // 相对于卡片宽度
            maxHeight: '80%', // 相对于卡片高度
        }
    } else {
        // 列表模式固定48px高度
        const listIconSize = 48
        return {
            width: `${listIconSize}px`,
            height: `${listIconSize}px`,
            fontSize: '20px',
            maxWidth: `${listIconSize}px`,
            maxHeight: `${listIconSize}px`,
        }
    }
})
</script>

<style scoped>
.app-card {
    display: flex;
    width: 100%;
    height: 100%;
    user-select: none;
    cursor: pointer;
    overflow: hidden;
    position: relative;
}

/* 插件标识Badge */
.app-card__plugin-badge {
    position: absolute;
    z-index: 10;
    pointer-events: none;
}

.app-card__plugin-badge--grid {
    top: 4px;
    right: 4px;
}

.app-card__plugin-badge--list {
    top: 8px;
    right: 8px;
}

.plugin-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    font-size: 10px;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.9);
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;  
}

.app-card:hover .plugin-badge {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.dark .plugin-badge {
    background: rgba(59, 130, 246, 0.8);
    color: #dbeafe;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 使用 BEM 命名避免冲突 */
.app-card--grid {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.app-card--list {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start; /* 明确指定左对齐 */
    gap: 12px;
    padding: 12px 16px;
    height: 100%;
    width: 100%;
}

.app-card__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    max-width: 100%;
    max-height: 100%;
}

.app-card__icon-img {
    border-radius: 8px;
    object-fit: contain;
    transition: all 0.2s ease;
}

/* 网格模式下的图标响应式调整 */
.app-card--grid .app-card__icon-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.app-card--list .app-card__icon-img {
    width: 48px !important;
    height: 48px !important;
}

.app-card__icon-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    border-radius: 8px;
    color: #9ca3af;
    transition: all 0.2s ease;
}

/* 网格模式下的占位符响应式调整 */
.app-card--grid .app-card__icon-placeholder {
    max-width: 100%;
    max-height: 100%;
}

.app-card--list .app-card__icon-placeholder {
    width: 48px !important;
    height: 48px !important;
    font-size: 20px !important;
}

.app-card__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.app-card--grid .app-card__info {
    align-items: center;
    text-align: center;
}

.app-card--list .app-card__info {
    align-items: flex-start;
    text-align: left;
    flex: 1;
}

.app-card__label {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.app-card--grid .app-card__label {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.app-card--list .app-card__label {
    margin-bottom: 4px;
    font-size: 15px;
    font-weight: 600;
}

.app-card__path {
    font-size: 12px;
    color: #6b7280;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.8;
}

/* 深色主题 */
.dark .app-card__label {
    color: #f9fafb;
}

.dark .app-card__path {
    color: #9ca3af;
}

.dark .app-card__icon-placeholder {
    background: #374151;
    color: #6b7280;
}
</style>
