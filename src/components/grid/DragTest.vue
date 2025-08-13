<template>
  <div class="drag-test-container p-6">
    <h2 class="text-2xl font-bold mb-4">
      拖拽功能测试
    </h2>

    <div class="mb-4 flex gap-2">
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        @click="addTestItem"
      >
        添加测试项目
      </button>
      <button
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        @click="toggleDraggable"
      >
        {{ draggableEnabled ? '禁用' : '启用' }}拖拽
      </button>
      <button
        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        @click="clearItems"
      >
        清空项目
      </button>
    </div>

    <div class="mb-4">
      <p class="text-sm text-gray-600">
        项目数量: {{ testItems.length }} |
        拖拽状态: {{ draggableEnabled ? '启用' : '禁用' }} |
        正在拖拽: {{ draggableState.isDragging ? '是' : '否' }}
      </p>
    </div>

    <GridContainer
      ref="gridRef"
      :items="testItems"
      :draggable="draggableEnabled"
      :drag-options="dragOptions"
      columns="auto"
      gap="md"
      class="min-h-32 border-2 border-dashed border-gray-300 rounded-lg p-4"
      @drag-start="onDragStart"
      @drag-end="onDragEnd"
      @drag-update="onDragUpdate"
    >
      <GridItem
        v-for="item in testItems"
        :key="item.id"
        :size="item.gridSize || '1x1'"
        :selected="item.selected || false"
        :draggable="draggableEnabled"
        @click="selectItem(item)"
        @contextmenu="showContextMenu(item, $event)"
      >
        <template #icon>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span class="text-blue-600 font-bold">{{ item.name.charAt(0) }}</span>
          </div>
        </template>
        <template #label>
          {{ item.name }}
        </template>
      </GridItem>
    </GridContainer>

    <!-- 拖拽事件日志 -->
    <div class="mt-6">
      <h3 class="text-lg font-semibold mb-2">
        拖拽事件日志
      </h3>
      <div class="bg-gray-100 p-4 rounded-lg max-h-40 overflow-y-auto">
        <div
          v-for="log in eventLogs"
          :key="log.id"
          class="text-sm mb-1"
          :class="{
            'text-green-600': log.type === 'start',
            'text-blue-600': log.type === 'update',
            'text-red-600': log.type === 'end'
          }"
        >
          [{{ log.timestamp }}] {{ log.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GridContainer from '@/components/grid/GridContainer.vue'
import GridItem from '@/components/grid/GridItem.vue'
import type { GridItem as GridItemType } from '@/types/components'
import { computed, ref } from 'vue'

// 测试数据
const testItems = ref<GridItemType[]>([
  {
    id: '1',
    name: '测试应用 1',
    gridSize: '1x1',
    category: 'test',
    selected: false,
  },
  {
    id: '2',
    name: '测试应用 2',
    gridSize: '1x1',
    category: 'test',
    selected: false,
  },
  {
    id: '3',
    name: '大型应用',
    gridSize: '2x1',
    category: 'test',
    selected: false,
  },
])

// 拖拽状态
const draggableEnabled = ref(true)
const gridRef = ref()

// 事件日志
const eventLogs = ref<Array<{
    id: string
    type: string
    message: string
    timestamp: string
}>>([])

// 拖拽状态
const draggableState = computed(() => {
  return gridRef.value?.draggableState || { isDragging: false }
})

// 拖拽配置
const dragOptions = {
  animation: 200,
  ghostClass: 'drag-ghost',
  chosenClass: 'drag-chosen',
  dragClass: 'drag-active',
}

// 添加测试项目
const addTestItem = () => {
  const id = Date.now().toString()
  testItems.value.push({
    id,
    name: `测试应用 ${testItems.value.length + 1}`,
    gridSize: '1x1',
    category: 'test',
    selected: false,
  })
}

// 切换拖拽状态
const toggleDraggable = () => {
  draggableEnabled.value = !draggableEnabled.value
  if (gridRef.value) {
    gridRef.value.setDraggable(draggableEnabled.value)
  }
}

// 清空项目
const clearItems = () => {
  testItems.value = []
  eventLogs.value = []
}

// 选择项目
const selectItem = (item: GridItemType) => {
  item.selected = !item.selected
}

// 显示右键菜单
const showContextMenu = (item: GridItemType, event: MouseEvent) => {
  console.log('Context menu for:', item.name, event)
}

// 拖拽事件处理
const addLog = (type: string, message: string) => {
  eventLogs.value.unshift({
    id: Date.now().toString(),
    type,
    message,
    timestamp: new Date().toLocaleTimeString(),
  })

  // 限制日志数量
  if (eventLogs.value.length > 50) {
    eventLogs.value = eventLogs.value.slice(0, 50)
  }
}

const onDragStart = (event: any) => {
  addLog('start', `开始拖拽: 索引 ${event.oldIndex}`)
}

const onDragEnd = (event: any) => {
  addLog('end', `结束拖拽: ${event.oldIndex} → ${event.newIndex}`)
}

const onDragUpdate = (event: any) => {
  addLog('update', `更新位置: ${event.oldIndex} → ${event.newIndex}`)
}
</script>

<style scoped>
.drag-test-container {
    min-height: 100vh;
    background-color: #f9fafb;
}

.dark .drag-test-container {
    background-color: #111827;
}
</style>
