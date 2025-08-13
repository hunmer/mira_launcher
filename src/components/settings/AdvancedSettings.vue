<template>
  <div class="space-y-6">
    <Accordion 
      :value="['0', '1']" 
      multiple
    >
      <AccordionPanel value="0">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-cog text-gray-600 dark:text-gray-400" />
            <span>系统设置</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  开发者模式
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  启用开发者选项和调试功能
                </p>
              </div>
              <input
                v-model="developerMode"
                type="checkbox"
                class="toggle"
                @change="saveDeveloperMode"
              >
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  调试日志
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  记录详细的调试信息到日志文件
                </p>
              </div>
              <input
                v-model="debugLogging"
                type="checkbox"
                class="toggle"
                @change="saveDebugLogging"
              >
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  数据收集
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  允许收集匿名使用数据以改进产品
                </p>
              </div>
              <input
                v-model="dataCollection"
                type="checkbox"
                class="toggle"
                @change="saveDataCollection"
              >
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="1">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-shield text-orange-600 dark:text-orange-400" />
            <span>重置与备份</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  重置所有设置
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  将所有设置恢复到默认值
                </p>
              </div>
              <Button
                variant="outline"
                severity="danger"
                @click="resetSettings"
              >
                重置设置
              </Button>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  导出设置
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  导出当前设置到文件
                </p>
              </div>
              <Button
                variant="outline"
                @click="exportSettings"
              >
                导出
              </Button>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  导入设置
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  从文件导入设置配置
                </p>
              </div>
              <Button
                variant="outline"
                @click="importSettings"
              >
                导入
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/common/Button.vue'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

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

<style scoped>
.toggle {
  appearance: none;
  width: 48px;
  height: 24px;
  background-color: #e5e7eb;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle:checked {
  background-color: #3b82f6;
}

.toggle::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle:checked::before {
  transform: translateX(24px);
}
</style>
