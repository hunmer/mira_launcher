<template>
    <div class="page-controls">
        <!-- 页面指示器容器 - 支持滚轮滚动 -->
        <div
            ref="indicatorsContainer"
            class="page-indicators-container"
            @wheel="handleWheel"
        >
            <div class="page-indicators">
                <button
                    v-for="(page, index) in totalPages"
                    :key="index"
                    :class="['page-indicator', { active: index === currentPageIndex }]"
                    :title="`第 ${index + 1} 页`"
                    @click="$emit('page-change', index)"
                    @contextmenu="handlePageContextMenu($event, index)"
                >
                    {{ index + 1 }}
                </button>
            </div>
        </div>

        <!-- 添加页面按钮 -->
        <div class="add-page-container">
            <Button
                icon="pi pi-plus"
                class="add-page-btn"
                size="small"
                variant="secondary"
                title="添加新页面"
                @click="$emit('add-page')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import { ref } from 'vue'

interface Props {
    currentPageIndex: number
    totalPages: number
}

interface Emits {
    (e: 'page-change', pageIndex: number): void
    (e: 'add-page'): void
    (e: 'page-context-menu', event: MouseEvent): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const indicatorsContainer = ref<HTMLElement>()

// 处理页面右键菜单
const handlePageContextMenu = (event: MouseEvent, _pageIndex: number) => {
    event.preventDefault()
    emit('page-context-menu', event)
}

// 处理滚轮事件
const handleWheel = (event: WheelEvent) => {
    event.preventDefault()

    const container = indicatorsContainer.value
    if (!container) return

    // 水平滚动
    const scrollAmount = event.deltaY > 0 ? 60 : -60
    container.scrollLeft += scrollAmount
}
</script>

<style scoped>
.page-controls {
  display: flex;
  align-items: center;
  padding: 1rem;
  margin-top: auto;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid rgb(229 231 235);
  flex-shrink: 0;
}

.dark .page-controls {
  background-color: rgba(31, 41, 55, 0.8);
  border: 1px solid rgb(75 85 99);
}

.page-indicators-container {
  flex: 1;
  overflow-x: auto;
  max-width: calc(100% - 80px);
  margin-right: 1rem;
  scroll-behavior: smooth;
}

.page-indicators-container::-webkit-scrollbar {
  height: 4px;
}

.page-indicators-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.page-indicators-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
}

.page-indicators-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

.page-indicators {
  display: flex;
  gap: 0.5rem;
  min-width: max-content;
  padding: 0.25rem 0;
}

.page-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 2px solid rgb(209 213 219);
  border-radius: 8px;
  background-color: transparent;
  color: rgb(107 114 128);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.page-indicator:hover {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: rgb(59 130 246);
  color: rgb(59 130 246);
  transform: translateY(-1px);
}

.page-indicator.active {
  background-color: rgb(59 130 246);
  border-color: rgb(59 130 246);
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.dark .page-indicator {
  border-color: rgb(75 85 99);
  color: rgb(156 163 175);
}

.dark .page-indicator:hover {
  background-color: rgba(99, 102, 241, 0.2);
  border-color: rgb(99 102 241);
  color: rgb(129 140 248);
}

.dark .page-indicator.active {
  background-color: rgb(99 102 241);
  border-color: rgb(99 102 241);
  color: white;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
}

.add-page-container {
  flex-shrink: 0;
}

.add-page-btn {
  transition: all 0.2s ease;
}

.add-page-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
</style>
