<template>
  <div class="space-y-6">
    <SettingPlan :default-value="['0', '1']">
      <SettingCard value="0" title="系统设置" icon="pi pi-cog" icon-color="text-gray-600 dark:text-gray-400">
        <SettingItem title="开发者模式" tooltip="启用开发者选项和调试功能" type="text" right-control="switch" v-model="developerMode"
          @update:model-value="saveDeveloperMode" readonly />

        <SettingItem title="调试日志" tooltip="记录详细的调试信息到日志文件" type="text" right-control="switch" v-model="debugLogging"
          @update:model-value="saveDebugLogging" readonly />

        <SettingItem title="数据收集" tooltip="允许收集匿名使用数据以改进产品" type="text" right-control="switch" v-model="dataCollection"
          @update:model-value="saveDataCollection" readonly />
      </SettingCard>

      <SettingCard value="1" title="重置与备份" icon="pi pi-shield" icon-color="text-orange-600 dark:text-orange-400">
        <SettingItem title="重置所有设置" tooltip="将所有设置恢复到默认值" type="button" button-label="重置设置" button-severity="danger"
          button-variant="outlined" @button-click="resetSettings" />

        <SettingItem title="导出设置" tooltip="导出当前设置到文件" type="button" button-label="导出" button-variant="outlined"
          @button-click="exportSettings" />

        <SettingItem title="导入设置" tooltip="从文件导入设置配置" type="button" button-label="导入" button-variant="outlined"
          @button-click="importSettings" />
      </SettingCard>
    </SettingPlan>
  </div>
</template>

<script setup lang="ts">
import { SettingCard, SettingItem, SettingPlan } from '@/components/settings'
import { ref } from 'vue'

// 系统设置
const developerMode = ref(false)
const debugLogging = ref(false)
const dataCollection = ref(true)

const saveDeveloperMode = () => {
  console.log('保存开发者模式设置:', developerMode.value)
}

const saveDebugLogging = () => {
  console.log('保存调试日志设置:', debugLogging.value)
}

const saveDataCollection = () => {
  console.log('保存数据收集设置:', dataCollection.value)
}

const resetSettings = () => {
  if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
    console.log('重置所有设置到默认值')
    // 重置所有设置项
    developerMode.value = false
    debugLogging.value = false
    dataCollection.value = true

    // 这里可以触发其他组件的重置方法
    // 或者调用 API 重置所有设置
    location.reload() // 临时方案，重新加载页面
  }
}

const exportSettings = () => {
  console.log('导出设置')
  // 这里可以实现导出设置到文件的逻辑
}

const importSettings = () => {
  console.log('导入设置')
  // 这里可以实现从文件导入设置的逻辑
}
</script>

<style scoped></style>
