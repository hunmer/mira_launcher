<template>
  <div class="space-y-6">
    <SettingPlan :default-value="['0', '1', '2']">
      <SettingCard value="0" title="启动设置" icon="pi pi-power-off" icon-color="text-green-600 dark:text-green-400">
        <SettingItem title="开机自启动" tooltip="系统启动时自动运行 Mira Launcher" type="text" right-control="switch"
          v-model="settingsStore.settings.startup.autoStart" readonly />

        <SettingItem title="最小化到系统托盘" tooltip="关闭窗口时最小化到系统托盘" type="text" right-control="switch"
          v-model="settingsStore.settings.startup.startMinimized" readonly />

        <SettingItem title="启动时加载插件" tooltip="应用程序启动时自动加载所有插件" type="text" right-control="switch"
          v-model="settingsStore.settings.startup.loadPluginsOnStart" readonly />
      </SettingCard>

      <SettingCard value="1" title="性能设置" icon="pi pi-bolt" icon-color="text-orange-600 dark:text-orange-400">
        <SettingItem title="启用硬件加速" tooltip="使用 GPU 加速渲染，提升性能" type="text" right-control="switch"
          v-model="hardwareAcceleration" @update:model-value="saveHardwareAcceleration" readonly />

        <SettingItem title="预加载应用信息" tooltip="启动时预先加载应用程序信息，提升响应速度" type="text" right-control="switch"
          v-model="preloadApps" @update:model-value="savePreloadApps" readonly />
      </SettingCard>

      <SettingCard value="2" title="更新设置" icon="pi pi-download" icon-color="text-blue-600 dark:text-blue-400">
        <SettingItem title="自动检查更新" tooltip="定期检查并提示有可用更新" type="text" right-control="switch"
          v-model="settingsStore.settings.startup.checkUpdates" readonly />
      </SettingCard>
    </SettingPlan>
  </div>
</template>

<script setup lang="ts">
import { SettingCard, SettingItem, SettingPlan } from '@/components/settings'
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

<style scoped></style>
