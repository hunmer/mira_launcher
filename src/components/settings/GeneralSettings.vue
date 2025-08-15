<template>
  <div class="space-y-6">
    <SettingPlan :default-value="['0', '1', '2']">
      <SettingCard value="0" title="外观设置" icon="pi pi-palette" icon-color="text-purple-600 dark:text-purple-400">
        <SettingItem title="主题模式" tooltip="切换应用的明暗主题模式，影响整体界面色彩方案" type="button"
          :button-label="isDark ? '切换到浅色模式' : '切换到深色模式'" @button-click="toggleTheme" />
      </SettingCard>

      <SettingCard value="1" title="语言设置" icon="pi pi-globe" icon-color="text-blue-600 dark:text-blue-400">
        <SettingItem title="界面语言" tooltip="设置应用界面显示语言，重启应用后生效" type="select"
          v-model="settingsStore.settings.general.language" :options="languageOptions" option-label="label"
          option-value="value" />
      </SettingCard>

      <SettingCard value="2" title="应用设置" icon="pi pi-window-maximize"
        icon-color="text-indigo-600 dark:text-indigo-400">
        <SettingItem title="窗口大小" tooltip="设置启动器窗口的默认尺寸大小" type="select"
          v-model="settingsStore.settings.general.windowSize" :options="windowSizeOptions" option-label="label"
          option-value="value" />

        <SettingItem title="最小化到托盘" tooltip="关闭窗口时最小化到系统托盘而不退出程序" type="text" right-control="switch"
          v-model="settingsStore.settings.general.minimizeToTray" readonly />

        <SettingItem title="显示在任务栏" tooltip="在任务栏显示应用程序图标" type="text" right-control="switch"
          v-model="settingsStore.settings.general.showInTaskbar" readonly />
      </SettingCard>
    </SettingPlan>
  </div>
</template>

<script setup lang="ts">
import { SettingCard, SettingItem, SettingPlan } from '@/components/settings'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import { computed, onMounted, ref } from 'vue'

const themeStore = useThemeStore()
const settingsStore = useSettingsStore()

const isDark = computed(() => themeStore.currentTheme === 'dark')

// 语言选项
const languageOptions = ref([
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
])

// 窗口大小选项
const windowSizeOptions = ref([
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' }
])

const toggleTheme = () => {
  themeStore.toggleTheme()
}

// 组件挂载时加载设置
onMounted(async () => {
  await settingsStore.loadSettings()
})
</script>
