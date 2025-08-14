<template>
  <div class="space-y-6">
    <Accordion :value="['0', '1', '2']" multiple>
      <AccordionPanel value="0">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-power-off text-green-600 dark:text-green-400" />
            <span>启动设置</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <TooltipInfo content="系统启动时自动运行 Mira Launcher">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    开机自启动
                  </h3>
                </TooltipInfo>
              </div>
              <input v-model="settingsStore.settings.startup.autoStart" type="checkbox" class="toggle">
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  最小化到系统托盘
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  关闭窗口时最小化到系统托盘
                </p>
              </div>
              <input v-model="settingsStore.settings.startup.startMinimized" type="checkbox" class="toggle">
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  启动时加载插件
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  应用程序启动时自动加载所有插件
                </p>
              </div>
              <input v-model="settingsStore.settings.startup.loadPluginsOnStart" type="checkbox" class="toggle">
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="1">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-bolt text-orange-600 dark:text-orange-400" />
            <span>性能设置</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  启用硬件加速
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  使用 GPU 加速渲染，提升性能
                </p>
              </div>
              <input v-model="hardwareAcceleration" type="checkbox" class="toggle" @change="saveHardwareAcceleration">
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  预加载应用信息
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  启动时预先加载应用程序信息，提升响应速度
                </p>
              </div>
              <input v-model="preloadApps" type="checkbox" class="toggle" @change="savePreloadApps">
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="2">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-download text-blue-600 dark:text-blue-400" />
            <span>更新设置</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  自动检查更新
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  定期检查并提示有可用更新
                </p>
              </div>
              <input v-model="settingsStore.settings.startup.checkUpdates" type="checkbox" class="toggle">
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
  TooltipInfo
} from '@/components/common'
import { useSettingsStore } from '@/stores/settings'
import { ref } from 'vue'

const settingsStore = useSettingsStore()

// 性能设置 (local state since not in store yet)
const hardwareAcceleration = ref(true)
const preloadApps = ref(true)

const saveHardwareAcceleration = () => {
  console.log('保存硬件加速设置:', hardwareAcceleration.value)
}

const savePreloadApps = () => {
  console.log('保存预加载应用设置:', preloadApps.value)
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
