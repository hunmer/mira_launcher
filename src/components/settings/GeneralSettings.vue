<template>
  <div class="space-y-6">
    <Accordion 
      :value="['0', '1', '2']" 
      multiple
    >
      <AccordionPanel value="0">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-palette text-purple-600 dark:text-purple-400" />
            <span>外观设置</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <TooltipInfo content="切换应用的明暗主题模式，影响整体界面色彩方案">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    主题模式
                  </h3>
                </TooltipInfo>
              </div>
              <Button @click="toggleTheme">
                {{ isDark ? '切换到浅色模式' : '切换到深色模式' }}
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="1">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-globe text-blue-600 dark:text-blue-400" />
            <span>语言设置</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <TooltipInfo content="设置应用界面显示语言，重启应用后生效">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    界面语言
                  </h3>
                </TooltipInfo>
              </div>
              <select 
                v-model="settingsStore.settings.general.language"
                class="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="zh-CN">
                  简体中文
                </option>
                <option value="en-US">
                  English
                </option>
              </select>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="2">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-window-maximize text-indigo-600 dark:text-indigo-400" />
            <span>应用设置</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <TooltipInfo content="设置启动器窗口的默认尺寸大小">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    窗口大小
                  </h3>
                </TooltipInfo>
              </div>
              <select 
                v-model="settingsStore.settings.general.windowSize"
                class="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="small">
                  小
                </option>
                <option value="medium">
                  中
                </option>
                <option value="large">
                  大
                </option>
              </select>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <TooltipInfo content="关闭窗口时最小化到系统托盘而不退出程序">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    最小化到托盘
                  </h3>
                </TooltipInfo>
              </div>
              <input
                v-model="settingsStore.settings.general.minimizeToTray"
                type="checkbox"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              >
            </div>

            <div class="flex items-center justify-between">
              <div>
                <TooltipInfo content="在任务栏显示应用程序图标">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    显示在任务栏
                  </h3>
                </TooltipInfo>
              </div>
              <input
                v-model="settingsStore.settings.general.showInTaskbar"
                type="checkbox"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              >
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Button from '@/components/common/Button.vue'
import { TooltipInfo } from '@/components/common'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

const themeStore = useThemeStore()
const settingsStore = useSettingsStore()

const isDark = computed(() => themeStore.currentTheme === 'dark')

const toggleTheme = () => {
  themeStore.toggleTheme()
}

// 组件挂载时加载设置
onMounted(async () => {
  await settingsStore.loadSettings()
})
</script>
