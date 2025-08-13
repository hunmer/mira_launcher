<template>
    <Teleport to="body">
        <Transition name="context-menu">
            <div v-if="show" :style="{ top: y + 'px', left: x + 'px' }" class="context-menu" @click.stop>
                <template v-for="(item, index) in items" :key="index">
                    <div v-if="item.separator" class="context-menu-separator"></div>
                    <div v-else :class="[
                        'context-menu-item',
                        { 'context-menu-item-danger': item.danger }
                    ]" @click="handleItemClick(item)">
                        <span v-if="item.icon" class="context-menu-icon">
                            <!-- 这里可以根据需要添加图标组件 -->
                            {{ item.icon }}
                        </span>
                        <span class="context-menu-label">{{ item.label }}</span>
                    </div>
                </template>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
export interface MenuItem {
    label: string
    icon?: string
    action?: () => void
    danger?: boolean
    separator?: boolean
}

interface Props {
    show: boolean
    x: number
    y: number
    items: MenuItem[]
}

interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'select', item: MenuItem): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleItemClick = (item: MenuItem) => {
    emit('select', item)
    emit('update:show', false)
}
</script>

<style scoped>
.context-menu {
    position: fixed;
    z-index: 50;
    min-width: 12rem;
    padding: 0.5rem 0;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e7eb;
    backdrop-filter: blur(8px);
}

.dark .context-menu {
    background-color: #1f2937;
    border-color: #4b5563;
}

.context-menu-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    transition: all 0.15s ease-out;
}

.dark .context-menu-item {
    color: #e5e7eb;
}

.context-menu-item:hover {
    background-color: #f3f4f6;
}

.dark .context-menu-item:hover {
    background-color: #374151;
}

.context-menu-item-danger {
    color: #dc2626;
}

.dark .context-menu-item-danger {
    color: #f87171;
}

.context-menu-item-danger:hover {
    background-color: #fef2f2;
}

.dark .context-menu-item-danger:hover {
    background-color: rgba(127, 29, 29, 0.2);
}

.context-menu-icon {
    width: 1rem;
    height: 1rem;
    margin-right: 0.75rem;
    color: #6b7280;
}

.dark .context-menu-icon {
    color: #9ca3af;
}

.context-menu-label {
    flex: 1;
}

.context-menu-separator {
    height: 1px;
    background-color: #e5e7eb;
    margin: 0.25rem 0.5rem;
}

.dark .context-menu-separator {
    background-color: #4b5563;
}

/* 动画效果 */
.context-menu-enter-active,
.context-menu-leave-active {
    transition: all 0.15s ease-out;
}

.context-menu-enter-from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
}

.context-menu-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
}
</style>
