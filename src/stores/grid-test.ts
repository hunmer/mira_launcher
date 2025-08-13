// 简单的gridStore功能测试
import { useGridStore } from '@/stores/grid'
import type { GridItem } from '@/types/components'

// 模拟测试gridStore功能
export function testGridStore() {
  const gridStore = useGridStore()

  console.log('测试gridStore基本功能...')

  // 测试添加项目
  const testItem: Omit<GridItem, 'id'> = {
    name: '测试应用',
    path: '/test/app.exe',
    category: 'test',
    gridSize: '1x1',
    icon: 'test-icon',
  }

  const itemId = gridStore.addItem(testItem)
  console.log('添加项目成功，ID:', itemId)
  console.log('当前项目数量:', gridStore.itemCount)

  // 测试获取项目
  const retrievedItem = gridStore.getItem(itemId)
  console.log('获取项目:', retrievedItem?.name)

  // 测试更新项目
  gridStore.updateItem(itemId, { name: '更新后的测试应用' })
  console.log('更新项目后:', gridStore.getItem(itemId)?.name)

  // 测试选择管理
  gridStore.selectItem(itemId)
  console.log('选中项目数:', gridStore.selectedItems.length)
  console.log('是否有选中项:', gridStore.hasSelection)

  // 测试配置管理
  gridStore.updateConfig({ columns: 6, gap: 'lg' })
  console.log('更新后的配置:', gridStore.config)

  // 测试导出配置
  const exportedConfig = gridStore.exportConfig()
  console.log('导出配置包含项目数:', exportedConfig.items.length)

  console.log('gridStore测试完成！')

  return {
    itemCount: gridStore.itemCount,
    hasSelection: gridStore.hasSelection,
    config: gridStore.config,
  }
}

export default testGridStore
