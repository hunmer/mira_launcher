<template>
  <div class="settings-page">
    <Container class="max-w-4xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          系统设置
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          配置您的 Mira Launcher 偏好设置
        </p>
      </div>

      <div class="space-y-6">
        <!-- 主题设置 -->
        <Card title="外观设置">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  主题模式
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  选择浅色或深色主题
                </p>
              </div>
              <Button @click="toggleTheme">
                {{ isDark ? '切换到浅色模式' : '切换到深色模式' }}
              </Button>
            </div>
          </div>
        </Card>

        <!-- 启动设置 -->
        <Card title="启动设置">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  开机自启动
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  系统启动时自动运行 Mira Launcher
                </p>
              </div>
              <input v-model="autoStart" type="checkbox" class="toggle">
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
              <input v-model="minimizeToTray" type="checkbox" class="toggle">
            </div>
          </div>
        </Card>

        <!-- 快捷键设置 -->
        <Card title="快捷键设置">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  全局唤醒快捷键
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  快速显示/隐藏启动器窗口
                </p>
              </div>
              <Input v-model="globalHotkey" placeholder="Ctrl+Space" readonly class="w-32" />
            </div>
          </div>
        </Card>
      </div>

      <Divider class="my-6" />

      <div class="flex justify-between">
        <Button variant="outline" @click="$router.back()">
          返回
        </Button>
        <div class="space-x-2">
          <Button variant="outline" @click="resetSettings">
            重置设置
          </Button>
          <Button type="primary" @click="saveSettings">
            保存设置
          </Button>
        </div>
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import Card from '@/components/common/Card.vue'
import Input from '@/components/common/Input.vue'
import Container from '@/components/layout/Container.vue'
import Divider from '@/components/layout/Divider.vue'
import { useThemeStore } from '@/stores/theme'
import { computed, onMounted, ref } from 'vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.currentTheme === 'dark')

// 设置项
const autoStart = ref(false)
const minimizeToTray = ref(true)
const globalHotkey = ref('Ctrl+Space')

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const saveSettings = () => {
  // 保存设置逻辑
  console.log('保存设置:', {
    autoStart: autoStart.value,
    minimizeToTray: minimizeToTray.value,
    globalHotkey: globalHotkey.value,
  })
}

const resetSettings = () => {
  // 重置设置逻辑
  autoStart.value = false
  minimizeToTray.value = true
  globalHotkey.value = 'Ctrl+Space'
}

onMounted(() => {
  document.title = 'Mira Launcher - 设置'
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background-color: #f9fafb;
}

.dark .settings-page {
  background-color: #111827;
}

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
