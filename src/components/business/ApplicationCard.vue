<template>
    <div
        class="app-card"
        :class="{ 'app-card--grid': layoutMode === 'grid', 'app-card--list': layoutMode === 'list' }"
        :data-app-id="app.id"
        @click="$emit('launch', app)"
        @contextmenu.prevent="$emit('context-menu', app, $event)"
    >
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

const iconStyle = computed(() => {
    const currentIconSize = props.layoutMode === 'list' ? Math.min(props.iconSize, 48) : props.iconSize
    return {
        width: `${currentIconSize}px`,
        height: `${currentIconSize}px`,
        fontSize: props.layoutMode === 'list' ? '20px' : `${Math.max(16, currentIconSize * 0.5)}px`,
        maxWidth: '200px',
        maxHeight: '200px',
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
    transition: all 0.2s ease-in-out;
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
}

.app-card__icon-img {
    border-radius: 8px;
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
