<template>
  <div class="space-y-6">
    <Accordion 
      :value="['0', '1']" 
      multiple
    >
      <AccordionPanel value="0">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-key text-yellow-600 dark:text-yellow-400" />
            <span>快捷键设置</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <TooltipInfo content="快速显示/隐藏启动器窗口的全局快捷键">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    全局唤醒快捷键
                  </h3>
                </TooltipInfo>
              </div>
              <Input
                v-model="settingsStore.settings.shortcuts.globalHotkey"
                placeholder="Ctrl+Space"
                readonly
                class="w-32"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <TooltipInfo content="启动搜索功能的快捷键">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    搜索快捷键
                  </h3>
                </TooltipInfo>
              </div>
              <Input
                v-model="settingsStore.settings.shortcuts.searchHotkey"
                placeholder="Ctrl+F"
                readonly
                class="w-32"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <TooltipInfo content="打开设置页面的快捷键">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    设置页面快捷键
                  </h3>
                </TooltipInfo>
              </div>
              <Input
                v-model="settingsStore.settings.shortcuts.settingsHotkey"
                placeholder="Ctrl+,"
                readonly
                class="w-32"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="1">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-mouse text-teal-600 dark:text-teal-400" />
            <span>鼠标设置</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  双击启动应用
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  双击应用图标启动应用程序
                </p>
              </div>
              <input
                v-model="doubleClickToLaunch"
                type="checkbox"
                class="toggle"
                @change="saveDoubleClickToLaunch"
              >
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  右键菜单
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  启用应用图标的右键上下文菜单
                </p>
              </div>
              <input
                v-model="enableContextMenu"
                type="checkbox"
                class="toggle"
                @change="saveEnableContextMenu"
              >
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Input from '@/components/common/Input.vue'
import { TooltipInfo } from '@/components/common'
import { useSettingsStore } from '@/stores/settings'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

const settingsStore = useSettingsStore()

// 鼠标设置
const doubleClickToLaunch = ref(true)
const enableContextMenu = ref(true)

const saveDoubleClickToLaunch = () => {
  console.log('保存双击启动设置:', doubleClickToLaunch.value)
}

const saveEnableContextMenu = () => {
  console.log('保存右键菜单设置:', enableContextMenu.value)
}

// 组件挂载时加载设置
onMounted(async () => {
  await settingsStore.loadSettings()
})
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
