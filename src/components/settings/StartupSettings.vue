<template>
  <div class="space-y-6">
    <Accordion 
      :value="['0', '1', '2']" 
      multiple
    >
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
                <h3 class="font-medium text-gray-900 dark:text-white">
                  开机自启动
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  系统启动时自动运行 Mira Launcher
                </p>
              </div>
              <input
                v-model="autoStart"
                type="checkbox"
                class="toggle"
                @change="saveAutoStart"
              >
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
              <input
                v-model="minimizeToTray"
                type="checkbox"
                class="toggle"
                @change="saveMinimizeToTray"
              >
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  启动时隐藏窗口
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  应用程序启动时不显示主窗口
                </p>
              </div>
              <input
                v-model="startHidden"
                type="checkbox"
                class="toggle"
                @change="saveStartHidden"
              >
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
              <input
                v-model="hardwareAcceleration"
                type="checkbox"
                class="toggle"
                @change="saveHardwareAcceleration"
              >
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
              <input
                v-model="preloadApps"
                type="checkbox"
                class="toggle"
                @change="savePreloadApps"
              >
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
              <input
                v-model="autoUpdate"
                type="checkbox"
                class="toggle"
                @change="saveAutoUpdate"
              >
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

// 启动设置
const autoStart = ref(false)
const minimizeToTray = ref(true)
const startHidden = ref(false)

// 性能设置
const hardwareAcceleration = ref(true)
const preloadApps = ref(true)

// 更新设置
const autoUpdate = ref(true)

const saveAutoStart = () => {
  console.log('保存开机自启动设置:', autoStart.value)
  // 这里可以调用 Tauri API 来设置开机自启动
}

const saveMinimizeToTray = () => {
  console.log('保存最小化到托盘设置:', minimizeToTray.value)
  // 这里可以保存到本地存储或调用相关 API
}

const saveStartHidden = () => {
  console.log('保存启动时隐藏设置:', startHidden.value)
}

const saveHardwareAcceleration = () => {
  console.log('保存硬件加速设置:', hardwareAcceleration.value)
}

const savePreloadApps = () => {
  console.log('保存预加载应用设置:', preloadApps.value)
}

const saveAutoUpdate = () => {
  console.log('保存自动更新设置:', autoUpdate.value)
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
